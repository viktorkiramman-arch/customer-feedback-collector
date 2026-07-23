"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  rating: z.coerce.number().int().min(1, "Select a rating.").max(5),
  categoryId: z.string().uuid("Select a category."),
  comment: z.string().max(2000, "Comment must be 2,000 characters or fewer."),
  website: z.string().max(0).optional(),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

type Category = { id: string; name: string; description: string | null };

export function PublicFeedbackForm({
  publicSlug,
  categories,
  commentEnabled,
  commentRequired,
  commentMaxLength,
  startedAt,
  idempotencyKey,
}: {
  publicSlug: string;
  categories: Category[];
  commentEnabled: boolean;
  commentRequired: boolean;
  commentMaxLength: number;
  startedAt: number;
  idempotencyKey: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { comment: "", website: "" },
  });

  const comment = useWatch({ control, name: "comment" }) ?? "";

  async function onSubmit(values: FormValues) {
    setServerError(null);
    if (commentRequired && values.comment.trim().length === 0) {
      setError("comment", { type: "required", message: "A written comment is required." });
      return;
    }
    if (values.comment.length > commentMaxLength) {
      setError("comment", {
        type: "maxLength",
        message: `Comment must be ${commentMaxLength.toLocaleString()} characters or fewer.`,
      });
      return;
    }
    const response = await fetch(`/api/public/forms/${encodeURIComponent(publicSlug)}/submissions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...values, idempotencyKey, startedAt }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setServerError(payload?.message ?? "We could not submit your feedback. Please try again.");
      return;
    }

    router.push(`/f/${publicSlug}/success`);
  }

  return (
    <form
      className="space-y-8"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {(serverError || Object.keys(errors).length > 0) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <p className="font-semibold">Check your feedback before submitting.</p>
          {serverError && <p className="mt-1">{serverError}</p>}
        </div>
      )}

      <fieldset>
        <legend className="text-base font-bold text-slate-900">How would you rate your experience?</legend>
        <p className="mt-1 text-sm text-slate-600">1 is very poor. 5 is excellent.</p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <label className="group cursor-pointer" key={rating}>
              <input className="peer sr-only" type="radio" value={rating} {...register("rating")} />
              <span className="flex min-h-14 items-center justify-center rounded-xl border border-slate-300 bg-white text-lg font-bold text-slate-700 transition group-hover:border-indigo-400 peer-checked:border-indigo-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-300">
                {rating}
              </span>
            </label>
          ))}
        </div>
        {errors.rating && <p className="error-text" role="alert">{errors.rating.message}</p>}
      </fieldset>

      <fieldset>
        <legend className="text-base font-bold text-slate-900">What is your feedback about?</legend>
        <div className="mt-4 grid gap-3">
          {categories.map((category) => (
            <label className="cursor-pointer" key={category.id}>
              <input className="peer sr-only" type="radio" value={category.id} {...register("categoryId")} />
              <span className="block rounded-xl border border-slate-300 bg-white p-4 transition hover:border-indigo-400 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-300">
                <span className="font-semibold text-slate-900">{category.name}</span>
                {category.description && <span className="mt-1 block text-sm leading-5 text-slate-600">{category.description}</span>}
              </span>
            </label>
          ))}
        </div>
        {errors.categoryId && <p className="error-text" role="alert">{errors.categoryId.message}</p>}
      </fieldset>

      {commentEnabled && (
        <div>
          <label className="label" htmlFor="comment">Additional comments {commentRequired ? "" : <span className="font-normal text-slate-500">(optional)</span>}</label>
          <textarea
            id="comment"
            className="input min-h-32 resize-y"
            maxLength={commentMaxLength}
            aria-invalid={Boolean(errors.comment)}
            aria-describedby={errors.comment ? "comment-help comment-error" : "comment-help"}
            {...register("comment", { required: commentRequired })}
          />
          <div className="mt-2 flex items-start justify-between gap-4 text-xs text-slate-500">
            <p id="comment-help">Do not include passwords, payment details, or sensitive personal information.</p>
            <span className="shrink-0 tabular-nums">{comment.length}/{commentMaxLength}</span>
          </div>
          {errors.comment && <p className="error-text" id="comment-error" role="alert">{errors.comment.message}</p>}
        </div>
      )}

      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <button className="btn btn-primary w-full text-base" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting feedback…" : "Submit feedback"}
      </button>
    </form>
  );
}
