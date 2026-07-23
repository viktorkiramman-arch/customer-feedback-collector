"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { categoryInputSchema, formSettingsSchema, moderationSchema } from "@/lib/validation";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth-context";

export async function createCategoryAction(formData: FormData) {
  const session = await requirePermission("categories:manage");
  const parsed = categoryInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) redirect("/admin/categories?error=invalid");

  const primaryForm = await prisma.feedbackForm.findFirst({
    where: { organizationId: session.user.organizationId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!primaryForm) redirect("/admin/categories?error=no-form");

  try {
    await prisma.$transaction(async (tx) => {
      const category = await tx.feedbackCategory.create({
        data: {
          organizationId: session.user.organizationId,
          createdByUserId: session.user.id,
          name: parsed.data.name,
          normalizedName: parsed.data.normalizedName,
          description: parsed.data.description,
          displayOrder: await tx.feedbackCategory.count({
            where: { organizationId: session.user.organizationId },
          }),
        },
      });
      await tx.formCategoryAssignment.create({
        data: {
          organizationId: session.user.organizationId,
          formId: primaryForm.id,
          categoryId: category.id,
          displayOrder: category.displayOrder,
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: session.user.organizationId,
          actorUserId: session.user.id,
          action: "category.created",
          entityType: "feedback_category",
          entityId: category.id,
          metadata: { name: category.name },
        },
      });
    });
  } catch {
    redirect("/admin/categories?error=duplicate");
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories?success=created");
}

export async function toggleCategoryAction(formData: FormData) {
  const session = await requirePermission("categories:manage");
  const id = String(formData.get("id") ?? "");
  const category = await prisma.feedbackCategory.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!category) redirect("/admin/categories?error=not-found");

  const archive = category.archivedAt === null;
  await prisma.$transaction([
    prisma.feedbackCategory.update({
      where: { id: category.id },
      data: {
        isActive: !archive,
        archivedAt: archive ? new Date() : null,
      },
    }),
    prisma.auditLog.create({
      data: {
        organizationId: session.user.organizationId,
        actorUserId: session.user.id,
        action: archive ? "category.archived" : "category.restored",
        entityType: "feedback_category",
        entityId: category.id,
        metadata: { name: category.name },
      },
    }),
  ]);
  revalidatePath("/admin/categories");
  redirect(`/admin/categories?success=${archive ? "archived" : "restored"}`);
}

export async function updateModerationAction(formData: FormData) {
  const session = await requirePermission("feedback:moderate");
  const parsed = moderationSchema.safeParse({
    submissionId: formData.get("submissionId"),
    status: formData.get("status"),
    workflowStatus: formData.get("workflowStatus"),
    priority: formData.get("priority"),
    moderationReason: formData.get("moderationReason"),
    resolutionSummary: formData.get("resolutionSummary"),
  });
  if (!parsed.success) redirect(`/admin/feedback/${String(formData.get("submissionId"))}?error=invalid`);

  const existing = await prisma.feedbackSubmission.findFirst({
    where: {
      id: parsed.data.submissionId,
      organizationId: session.user.organizationId,
      deletedAt: null,
    },
  });
  if (!existing) redirect("/admin/feedback");

  await prisma.$transaction([
    prisma.feedbackSubmission.update({
      where: { id: existing.id },
      data: {
        status: parsed.data.status,
        workflowStatus: parsed.data.workflowStatus,
        priority: parsed.data.priority,
        moderationReason: parsed.data.moderationReason,
        resolutionSummary: parsed.data.resolutionSummary,
        reviewedByUserId: session.user.id,
        reviewedAt: new Date(),
        resolvedAt:
          parsed.data.workflowStatus === "RESOLVED"
            ? (existing.resolvedAt ?? new Date())
            : null,
      },
    }),
    prisma.auditLog.create({
      data: {
        organizationId: session.user.organizationId,
        actorUserId: session.user.id,
        action: "feedback.updated",
        entityType: "feedback_submission",
        entityId: existing.id,
        metadata: {
          fromStatus: existing.status,
          toStatus: parsed.data.status,
          workflowStatus: parsed.data.workflowStatus,
          priority: parsed.data.priority,
        },
      },
    }),
  ]);

  revalidatePath(`/admin/feedback/${existing.id}`);
  revalidatePath("/admin");
  redirect(`/admin/feedback/${existing.id}?success=updated`);
}

export async function updateFormSettingsAction(formData: FormData) {
  const session = await requirePermission("forms:manage");
  const parsed = formSettingsSchema.safeParse({
    formId: formData.get("formId"),
    title: formData.get("title"),
    description: formData.get("description"),
    successMessage: formData.get("successMessage"),
    publicSlug: formData.get("publicSlug"),
    status: formData.get("status"),
    timeZone: formData.get("timeZone"),
  });
  if (!parsed.success) redirect("/admin/settings?error=invalid");

  const form = await prisma.feedbackForm.findFirst({
    where: { id: parsed.data.formId, organizationId: session.user.organizationId },
  });
  if (!form) redirect("/admin/settings?error=not-found");

  if (parsed.data.status === "ACTIVE") {
    const activeCategoryCount = await prisma.formCategoryAssignment.count({
      where: { formId: form.id, category: { isActive: true, archivedAt: null } },
    });
    if (activeCategoryCount === 0) redirect("/admin/settings?error=no-categories");
  }

  try {
    await prisma.$transaction([
      prisma.feedbackForm.update({
        where: { id: form.id },
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          successMessage: parsed.data.successMessage,
          publicSlug: parsed.data.publicSlug,
          status: parsed.data.status,
        },
      }),
      prisma.organization.update({
        where: { id: session.user.organizationId },
        data: { timeZone: parsed.data.timeZone },
      }),
      prisma.auditLog.create({
        data: {
          organizationId: session.user.organizationId,
          actorUserId: session.user.id,
          action: "feedback_form.settings_updated",
          entityType: "feedback_form",
          entityId: form.id,
          metadata: {
            previousPublicSlug: form.publicSlug,
            publicSlug: parsed.data.publicSlug,
            previousStatus: form.status,
            status: parsed.data.status,
            timeZone: parsed.data.timeZone,
          },
        },
      }),
    ]);
  } catch {
    redirect("/admin/settings?error=slug");
  }

  revalidatePath("/admin/settings");
  revalidatePath(`/f/${form.publicSlug}`);
  revalidatePath(`/f/${parsed.data.publicSlug}`);
  redirect("/admin/settings?success=saved");
}
