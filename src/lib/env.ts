import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.url().default("http://localhost:3000"),
  IP_HASH_SECRET: z.string().min(16),
  TRUST_PROXY_HEADERS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const fallbackAllowed = process.env.NODE_ENV !== "production";
  return serverEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET:
      process.env.NEXTAUTH_SECRET ??
      (fallbackAllowed ? "development-auth-secret-change-this-value" : undefined),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    IP_HASH_SECRET:
      process.env.IP_HASH_SECRET ??
      (fallbackAllowed ? "development-ip-hash-secret" : undefined),
    TRUST_PROXY_HEADERS: process.env.TRUST_PROXY_HEADERS,
  });
}
