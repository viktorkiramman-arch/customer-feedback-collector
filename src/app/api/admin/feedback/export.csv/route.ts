import { toCsv } from "@/lib/csv";
import { formatDateTime } from "@/lib/dates";
import { feedbackFiltersSchema } from "@/lib/validation";
import { hasPermission } from "@/server/permissions";
import { getExportRows } from "@/server/queries";
import { prisma } from "@/server/db";
import { getActiveSession } from "@/server/auth-context";

export async function GET(request: Request) {
  const session = await getActiveSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  if (!hasPermission(session.user.role, "feedback:export")) return new Response("Forbidden", { status: 403 });

  const url = new URL(request.url);
  const parsed = feedbackFiltersSchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    rating: url.searchParams.get("rating") ?? undefined,
    categoryId: url.searchParams.get("categoryId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    workflowStatus: url.searchParams.get("workflowStatus") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    page: 1,
  });
  if (!parsed.success) return new Response("Invalid filters", { status: 400 });

  const rows = await getExportRows(session.user.organizationId, parsed.data);
  await prisma.auditLog.create({
    data: {
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "feedback.exported",
      entityType: "feedback_submission",
      metadata: { rowCount: rows.length, filtered: Array.from(url.searchParams.keys()).length > 0 },
    },
  });

  const csv = toCsv([
    ["submission_id","submitted_at_utc","submitted_at_local","form_name","rating","category","comment","moderation_status","workflow_status","priority"],
    ...rows.map((item) => [
      item.id,
      item.submittedAt.toISOString(),
      formatDateTime(item.submittedAt, session.user.organizationTimeZone),
      item.form.name,
      item.rating,
      item.category.name,
      item.comment ?? "",
      item.status,
      item.workflowStatus,
      item.priority,
    ]),
  ]);

  const date = new Date().toISOString().slice(0,10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="feedback-${date}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
