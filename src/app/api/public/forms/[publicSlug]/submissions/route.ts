import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getServerEnv } from "@/lib/env";
import { createRequestId, getClientIp, keyedHash, sha256 } from "@/lib/security";
import { publicSubmissionSchema } from "@/lib/validation";
import { prisma } from "@/server/db";
import { consumeRateLimit } from "@/server/rate-limit";

export async function POST(request: Request, context: { params: Promise<{ publicSlug: string }> }) {
  const { publicSlug } = await context.params;
  const env = getServerEnv();
  const ipHash = keyedHash(
    env.IP_HASH_SECRET,
    getClientIp(request.headers, env.TRUST_PROXY_HEADERS),
  );
  const coarseLimit = await consumeRateLimit(`public-route:${publicSlug}:${ipHash}`, {
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!coarseLimit.allowed) {
    return NextResponse.json(
      { message: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: { "retry-after": String(coarseLimit.retryAfterSeconds) },
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = publicSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Check the required fields and try again." }, { status: 400 });
  }

  const form = await prisma.feedbackForm.findFirst({
    where: { publicSlug, status: "ACTIVE", deletedAt: null },
    include: {
      categoryAssignments: {
        where: { categoryId: parsed.data.categoryId, category: { isActive: true, archivedAt: null } },
        take: 1,
      },
    },
  });
  if (!form || form.categoryAssignments.length === 0) {
    return NextResponse.json({ message: "This feedback form is unavailable." }, { status: 404 });
  }

  if (form.commentRequired && !parsed.data.comment) {
    return NextResponse.json({ message: "A written comment is required." }, { status: 400 });
  }
  if (!form.commentEnabled && parsed.data.comment) {
    return NextResponse.json({ message: "Comments are not enabled for this form." }, { status: 400 });
  }
  if (
    parsed.data.comment &&
    parsed.data.comment.length > form.commentMaxLength
  ) {
    return NextResponse.json(
      { message: `Comment must be ${form.commentMaxLength.toLocaleString()} characters or fewer.` },
      { status: 400 },
    );
  }

  const elapsed = Date.now() - parsed.data.startedAt;
  if (elapsed < 800 || elapsed > 24 * 60 * 60 * 1000) {
    return NextResponse.json({ accepted: true }, { status: 202 });
  }

  const rateLimit = await consumeRateLimit(`submission:${form.id}:${ipHash}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Too many attempts. Please try again later." },
      { status: 429, headers: { "retry-after": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const idempotencyKeyHash = sha256(`${form.id}:${parsed.data.idempotencyKey}`);
  const previous = await prisma.feedbackSubmission.findFirst({
    where: { formId: form.id, idempotencyKeyHash },
    select: { id: true },
  });
  if (previous) return NextResponse.json({ accepted: true }, { status: 200 });

  const payloadHash = sha256(JSON.stringify([parsed.data.rating, parsed.data.categoryId, parsed.data.comment]));
  const duplicate = await prisma.feedbackSubmission.findFirst({
    where: {
      formId: form.id,
      sourceIpHash: ipHash,
      payloadHash,
      submittedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    },
    orderBy: { submittedAt: "desc" },
    select: { id: true },
  });

  try {
    await prisma.feedbackSubmission.create({
      data: {
        organizationId: form.organizationId,
        formId: form.id,
        categoryId: parsed.data.categoryId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        requestId: createRequestId(),
        idempotencyKeyHash,
        sourceIpHash: ipHash,
        userAgentHash: keyedHash(env.IP_HASH_SECRET, request.headers.get("user-agent") ?? "unknown"),
        payloadHash,
        duplicateOfId: duplicate?.id,
        priority: parsed.data.rating <= 2 ? "HIGH" : parsed.data.rating === 3 ? "NORMAL" : "LOW",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.feedbackSubmission.findFirst({
        where: { formId: form.id, idempotencyKeyHash },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json({ accepted: true }, { status: 200 });
      }
    }
    throw error;
  }

  return NextResponse.json({ accepted: true }, { status: 201 });
}
