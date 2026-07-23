import { createHash, createHmac, randomUUID } from "node:crypto";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function keyedHash(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createRequestId(): string {
  return randomUUID();
}

export function getClientIp(headers: Headers, trustProxyHeaders: boolean): string {
  if (!trustProxyHeaders) return "unavailable";

  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}
