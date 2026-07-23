import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    rateLimitBucket: {
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/server/db";
import { consumeRateLimit } from "@/server/rate-limit";

describe("database rate limiter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks after the configured limit", async () => {
    const resetAt = new Date(Date.now() + 60_000);
    const queryRaw = vi.mocked(prisma.$queryRaw);
    queryRaw
      .mockResolvedValueOnce([{ count: 1, resetAt }])
      .mockResolvedValueOnce([{ count: 2, resetAt }])
      .mockResolvedValueOnce([{ count: 3, resetAt }]);

    const options = { limit: 2, windowMs: 60_000 };
    await expect(consumeRateLimit("test-key", options)).resolves.toMatchObject({
      allowed: true,
      remaining: 1,
    });
    await expect(consumeRateLimit("test-key", options)).resolves.toMatchObject({
      allowed: true,
      remaining: 0,
    });
    await expect(consumeRateLimit("test-key", options)).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
    });
  });
});
