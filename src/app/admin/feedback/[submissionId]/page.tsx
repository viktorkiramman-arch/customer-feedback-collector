import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/dates";
import { updateModerationAction } from "@/server/actions";
import { requirePermission } from "@/server/auth-context";
import { getFeedbackDetails } from "@/server/queries";

export default async function FeedbackDetailsPage({ params, searchParams }: { params: Promise<{ submissionId: string }>; searchParams: Promise<{ success?: string; error?: string }> }) {
  const session = await requirePermission("feedback:read");
  const { submissionId } = await params;
  const query = await searchParams;
  const feedback = await getFeedbackDetails(session.user.organizationId, submissionId);
  if (!feedback) notFound();

  return (
    <main>
      <Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950" href="/admin/feedback"><ArrowLeft size={16}/>Back to feedback</Link>
      <PageHeader title={`Feedback ${feedback.rating}/5`} description={`Submitted through ${feedback.form.name} on ${formatDateTime(feedback.submittedAt, session.user.organizationTimeZone)}.`} />
      {query.success && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Feedback workflow updated.</div>}
      {query.error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">The update could not be saved. Check the fields and try again.</div>}

      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="card p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-3"><StatusBadge value={feedback.status}/><StatusBadge value={feedback.workflowStatus}/><StatusBadge value={feedback.priority}/></div>
          <dl className="mt-7 grid gap-5 border-y border-slate-200 py-5 sm:grid-cols-2">
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</dt><dd className="mt-1 font-medium">{feedback.category.name}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rating</dt><dd className="mt-1 font-medium">{feedback.rating} out of 5</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</dt><dd className="mt-1 font-medium">{formatDateTime(feedback.submittedAt, session.user.organizationTimeZone)}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned to</dt><dd className="mt-1 font-medium">{feedback.assignee?.name ?? "Unassigned"}</dd></div>
          </dl>
          <div className="mt-7"><h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Customer comment</h2><div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-5 leading-7 text-slate-800">{feedback.comment ?? <span className="italic text-slate-400">No written comment was provided.</span>}</div></div>
          {feedback.resolutionSummary && <div className="mt-7"><h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Resolution summary</h2><p className="mt-3 whitespace-pre-wrap rounded-xl border border-emerald-200 bg-emerald-50 p-5 leading-7 text-emerald-950">{feedback.resolutionSummary}</p></div>}
        </section>

        <aside className="card p-5 sm:p-6">
          <h2 className="font-bold">Manage feedback</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Moderation controls visibility. Workflow tracks the action taken by the team.</p>
          <form action={updateModerationAction} className="mt-6 space-y-5">
            <input type="hidden" name="submissionId" value={feedback.id}/>
            <div><label className="label" htmlFor="status">Moderation status</label><select className="input" id="status" name="status" defaultValue={feedback.status}>{["NEW","REVIEWED","FLAGGED","SPAM","ARCHIVED"].map((value)=><option key={value}>{value}</option>)}</select></div>
            <div><label className="label" htmlFor="workflowStatus">Workflow status</label><select className="input" id="workflowStatus" name="workflowStatus" defaultValue={feedback.workflowStatus}>{["OPEN","INVESTIGATING","ACTION_PLANNED","RESOLVED","NO_ACTION"].map((value)=><option key={value}>{value}</option>)}</select></div>
            <div><label className="label" htmlFor="priority">Priority</label><select className="input" id="priority" name="priority" defaultValue={feedback.priority}>{["LOW","NORMAL","HIGH","URGENT"].map((value)=><option key={value}>{value}</option>)}</select></div>
            <div><label className="label" htmlFor="moderationReason">Internal moderation note</label><textarea className="input min-h-24" id="moderationReason" name="moderationReason" maxLength={500} defaultValue={feedback.moderationReason ?? ""}/></div>
            <div><label className="label" htmlFor="resolutionSummary">Resolution summary</label><textarea className="input min-h-28" id="resolutionSummary" name="resolutionSummary" maxLength={1000} defaultValue={feedback.resolutionSummary ?? ""}/></div>
            <button className="btn btn-primary w-full" type="submit">Save workflow</button>
          </form>
        </aside>
      </div>
    </main>
  );
}
