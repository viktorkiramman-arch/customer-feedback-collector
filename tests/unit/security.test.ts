import { describe, expect, it } from "vitest";
import { getClientIp } from "@/lib/security";

describe("client IP extraction", () => {
  it("ignores forwarding headers unless a trusted proxy is configured", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.7, 10.0.0.2",
      "x-real-ip": "203.0.113.8",
    });

    expect(getClientIp(headers, false)).toBe("unavailable");
    expect(getClientIp(headers, true)).toBe("203.0.113.7");
  });
});
