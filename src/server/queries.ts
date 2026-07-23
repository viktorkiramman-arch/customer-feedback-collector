import type { Prisma } from "@/generated/prisma/client";
import { addUtcDays, startOfUtcDay } from "@/lib/dates";
import type { z } from "zod";
import { feedbackFiltersSchema } from "@/lib/validation";
import { prisma } from "@/server/db";

export type FeedbackFilters = z.infer<typeof feedbackFiltersSchema>;

export async function getPublicForm(publicSlug: string) {
  return prisma.feedbackForm.findFirst({
    where: { publicSlug, status: "ACTIVE", deletedAt: null },
    select: {
      id: true,
      organizationId: true,
      title: true,
      description: true,
      successMessage: true,
      commentEnabled: true,
      commentRequired: true,
      commentMaxLength: true,
      organization: { select: { name: true } },
      categoryAssignments: {
        where: { category: { isActive: true, archivedAt: null } },
        orderBy: { displayOrder: "asc" },
        select: {
          category: { select: { id: true, name: true, description: true } },
        },
      },
    },
  });
}

function buildSubmissionWhere(
  organizationId: string,
  filters: FeedbackFilters,
): Prisma.FeedbackSubmissionWhereInput {
  const from = filters.from ? startOfUtcDay(new Date(`${filters.from}T00:00:00.000Z`)) : undefined;
  const to = filters.to ? addUtcDays(startOfUtcDay(new Date(`${filters.to}T00:00:00.000Z`)), 1) : undefined;

  return {
    organizationId,
    deletedAt: null,
    ...(filters.rating ? { rating: filters.rating } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.workflowStatus ? { workflowStatus: filters.workflowStatus } : {}),
    ...(from || to
      ? {
          submittedAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lt: to } : {}),
          },
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { comment: { contains: filters.q, mode: "insensitive" } },
            { category: { name: { contains: filters.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

export async function listFeedback(organizationId: string, filters: FeedbackFilters) {
  const pageSize = 25;
  const skip = (filters.page - 1) * pageSize;
  const where = buildSubmissionWhere(organizationId, filters);
  const [items, total] = await prisma.$transaction([
    prisma.feedbackSubmission.findMany({
      where,
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        rating: true,
        comment: true,
        status: true,
        workflowStatus: true,
        priority: true,
        submittedAt: true,
        category: { select: { name: true } },
        form: { select: { name: true } },
      },
    }),
    prisma.feedbackSubmission.count({ where }),
  ]);

  return { items, total, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getFeedbackDetails(organizationId: string, id: string) {
  return prisma.feedbackSubmission.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      category: { select: { name: true } },
      form: { select: { name: true } },
      assignee: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { name: true, email: true } },
    },
  });
}

export async function getCategories(organizationId: string) {
  return prisma.feedbackCategory.findMany({
    where: { organizationId },
    orderBy: [{ archivedAt: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { submissions: true } } },
  });
}

export async function getPrimaryForm(organizationId: string) {
  return prisma.feedbackForm.findFirst({
    where: { organizationId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

export async function getDashboardStats(organizationId: string, days = 30) {
  const from = addUtcDays(startOfUtcDay(new Date()), -(days - 1));
  const baseWhere: Prisma.FeedbackSubmissionWhereInput = {
    organizationId,
    deletedAt: null,
    submittedAt: { gte: from },
    status: { not: "SPAM" },
  };

  const [aggregate, distribution, byCategory, recent, timeRows, negativeCount, unresolvedNegative] =
    await Promise.all([
      prisma.feedbackSubmission.aggregate({
        where: baseWhere,
        _count: { id: true },
        _avg: { rating: true },
      }),
      prisma.feedbackSubmission.groupBy({
        by: ["rating"],
        where: baseWhere,
        _count: { _all: true },
        orderBy: { rating: "asc" },
      }),
      prisma.feedbackSubmission.groupBy({
        by: ["categoryId"],
        where: baseWhere,
        _count: { _all: true },
        orderBy: { _count: { categoryId: "desc" } },
      }),
      prisma.feedbackSubmission.findMany({
        where: baseWhere,
        orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
        take: 8,
        select: {
          id: true,
          rating: true,
          comment: true,
          status: true,
          workflowStatus: true,
          submittedAt: true,
          category: { select: { name: true } },
        },
      }),
      prisma.feedbackSubmission.findMany({
        where: baseWhere,
        select: { submittedAt: true },
      }),
      prisma.feedbackSubmission.count({ where: { ...baseWhere, rating: { lte: 2 } } }),
      prisma.feedbackSubmission.count({
        where: { ...baseWhere, rating: { lte: 2 }, workflowStatus: { not: "RESOLVED" } },
      }),
    ]);

  const categoryIds = byCategory.map((item) => item.categoryId);
  const categoryNames = await prisma.feedbackCategory.findMany({
    where: { id: { in: categoryIds }, organizationId },
    select: { id: true, name: true },
  });
  const nameMap = new Map(categoryNames.map((category) => [category.id, category.name]));

  const daily = new Map<string, number>();
  for (let index = 0; index < days; index += 1) {
    const day = addUtcDays(from, index).toISOString().slice(0, 10);
    daily.set(day, 0);
  }
  for (const row of timeRows) {
    const day = row.submittedAt.toISOString().slice(0, 10);
    daily.set(day, (daily.get(day) ?? 0) + 1);
  }

  return {
    total: aggregate._count.id,
    average: aggregate._avg.rating,
    negativeCount,
    unresolvedNegative,
    distribution: [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: distribution.find((item) => item.rating === rating)?._count._all ?? 0,
    })),
    byCategory: byCategory.slice(0, 6).map((item) => ({
      name: nameMap.get(item.categoryId) ?? "Archived category",
      count: item._count._all,
    })),
    daily: Array.from(daily, ([date, count]) => ({ date, count })),
    recent,
  };
}

export async function getExportRows(organizationId: string, filters: FeedbackFilters) {
  return prisma.feedbackSubmission.findMany({
    where: buildSubmissionWhere(organizationId, filters),
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
    take: 10_000,
    select: {
      id: true,
      submittedAt: true,
      rating: true,
      comment: true,
      status: true,
      workflowStatus: true,
      priority: true,
      category: { select: { name: true } },
      form: { select: { name: true } },
    },
  });
}
