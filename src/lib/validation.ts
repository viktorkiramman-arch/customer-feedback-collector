import { z } from "zod";
import { normalizeComment, normalizeName } from "@/lib/normalization";

const emptyStringToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const publicSlugSchema = z
  .string()
  .trim()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

export const publicSubmissionSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  categoryId: z.uuid(),
  comment: z
    .string()
    .max(2000, "Comment must be 2,000 characters or fewer.")
    .optional()
    .transform(normalizeComment),
  idempotencyKey: z.string().min(16).max(200),
  website: z.string().max(0, "Invalid submission.").optional().default(""),
  startedAt: z.coerce.number().int().positive(),
});

export const loginSchema = z.object({
  email: z.email().max(320).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(200),
});

export const categorySchema = z.object({
  id: z.uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Category name is required.")
    .max(80)
    .transform((value) => value.replace(/\s+/g, " ")),
  description: z.string().trim().max(300).optional().transform((value) => value || null),
});

export const categoryInputSchema = categorySchema.transform((value) => ({
  ...value,
  normalizedName: normalizeName(value.name),
}));

export const feedbackFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  rating: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().min(1).max(5).optional(),
  ),
  categoryId: z.preprocess(emptyStringToUndefined, z.uuid().optional()),
  status: z.preprocess(
    emptyStringToUndefined,
    z.enum(["NEW", "REVIEWED", "FLAGGED", "SPAM", "ARCHIVED"]).optional(),
  ),
  workflowStatus: z.preprocess(
    emptyStringToUndefined,
    z.enum(["OPEN", "INVESTIGATING", "ACTION_PLANNED", "RESOLVED", "NO_ACTION"]).optional(),
  ),
  from: z.preprocess(emptyStringToUndefined, z.iso.date().optional()),
  to: z.preprocess(emptyStringToUndefined, z.iso.date().optional()),
  page: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(1).default(1)),
});

export const moderationSchema = z.object({
  submissionId: z.uuid(),
  status: z.enum(["NEW", "REVIEWED", "FLAGGED", "SPAM", "ARCHIVED"]),
  workflowStatus: z.enum(["OPEN", "INVESTIGATING", "ACTION_PLANNED", "RESOLVED", "NO_ACTION"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  moderationReason: z.string().trim().max(500).optional().transform((value) => value || null),
  resolutionSummary: z.string().trim().max(1000).optional().transform((value) => value || null),
});

export const formSettingsSchema = z.object({
  formId: z.uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional().transform((value) => value || null),
  successMessage: z.string().trim().min(1).max(500),
  publicSlug: publicSlugSchema,
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
  timeZone: z.string().trim().min(1).max(80).refine((value) => {
    try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; }
  }, "Enter a valid IANA time zone."),
});
