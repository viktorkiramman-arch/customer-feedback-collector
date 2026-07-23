import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type RateLimitRow = {
  count: number;
  resetAt: Date;
};

export async function consumeRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  if (!Number.isInteger(options.limit) || options.limit < 1) {
    throw new Error("Rate-limit limit must be a positive integer.");
  }
  if (!Number.isInteger(options.windowMs) || options.windowMs < 1) {
    throw new Error("Rate-limit window must be a positive integer.");
  }

  const normalizedKey = key.slice(0, 191);
  const now = new Date();
  const resetAt = new Date(now.getTime() + options.windowMs);
  const maximumCount = options.limit + 1;

  const rows = await prisma.$queryRaw<RateLimitRow[]>(Prisma.sql`
    INSERT INTO "rate_limit_buckets" ("key", "count", "reset_at", "updated_at")
    VALUES (${normalizedKey}, 1, ${resetAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rate_limit_buckets"."reset_at" <= ${now} THEN 1
        ELSE LEAST("rate_limit_buckets"."count" + 1, ${maximumCount})
      END,
      "reset_at" = CASE
        WHEN "rate_limit_buckets"."reset_at" <= ${now} THEN ${resetAt}
        ELSE "rate_limit_buckets"."reset_at"
      END,
      "updated_at" = ${now}
    RETURNING "count", "reset_at" AS "resetAt"
  `);

  const bucket = rows[0];
  if (!bucket) throw new Error("Rate-limit bucket was not returned.");

  const allowed = bucket.count <= options.limit;
  return {
    allowed,
    remaining: Math.max(0, options.limit - bucket.count),
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function deleteExpiredRateLimitBuckets(before = new Date()): Promise<number> {
  const result = await prisma.rateLimitBucket.deleteMany({
    where: { resetAt: { lt: before } },
  });
  return result.count;
}
