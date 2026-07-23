import { describe, expect, it } from "vitest";
import {
  categoryInputSchema,
  feedbackFiltersSchema,
  publicSubmissionSchema,
} from "@/lib/validation";

describe("public submission validation", () => {
  const base = {
    categoryId: "550e8400-e29b-41d4-a716-446655440000",
    idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
    startedAt: Date.now(),
    website: "",
  };

  it.each([1, 2, 3, 4, 5])("accepts rating %s", (rating) => {
    expect(publicSubmissionSchema.safeParse({ ...base, rating }).success).toBe(true);
  });

  it.each([0, 6, 2.5])("rejects rating %s", (rating) => {
    expect(publicSubmissionSchema.safeParse({ ...base, rating }).success).toBe(false);
  });

  it("rejects comments over 2,000 characters", () => {
    expect(publicSubmissionSchema.safeParse({ ...base, rating: 5, comment: "x".repeat(2001) }).success).toBe(false);
  });
});

describe("category validation", () => {
  it("normalizes category names", () => {
    const result = categoryInputSchema.parse({ name: "  Customer   Service  ", description: "" });
    expect(result.name).toBe("Customer Service");
    expect(result.normalizedName).toBe("customer service");
    expect(result.description).toBeNull();
  });
});

describe("feedback filter validation", () => {
  it("keeps active filters while treating unselected form controls as absent", () => {
    const result = feedbackFiltersSchema.parse({
      q: "service",
      rating: "5",
      categoryId: "",
      status: "",
      workflowStatus: "",
      from: "",
      to: "",
      page: "",
    });

    expect(result).toEqual({
      q: "service",
      rating: 5,
      page: 1,
    });
  });
});
