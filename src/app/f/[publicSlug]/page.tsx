import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { PublicFeedbackForm } from "@/features/feedback/public-feedback-form";
import { getPublicForm } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({ params }: { params: Promise<{ publicSlug: string }> }) {
  const { publicSlug } = await params;
  const form = await getPublicForm(publicSlug);
  if (!form || form.categoryAssignments.length === 0) notFound();
  // This force-dynamic Server Component serializes one timestamp per page load.
  // eslint-disable-next-line react-hooks/purity
  const startedAt = Date.now();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-14">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex justify-center"><Logo href={`/f/${publicSlug}`} /></div>
        <section className="card p-5 shadow-sm sm:p-8" aria-labelledby="feedback-title">
          <div className="border-b border-slate-200 pb-6">
            <p className="text-sm font-semibold text-indigo-700">{form.organization.name}</p>
            <h1 id="feedback-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{form.title}</h1>
            {form.description && <p className="mt-3 leading-7 text-slate-600">{form.description}</p>}
          </div>
          <div className="pt-7">
            <PublicFeedbackForm
              publicSlug={publicSlug}
              categories={form.categoryAssignments.map((item) => item.category)}
              commentEnabled={form.commentEnabled}
              commentRequired={form.commentRequired}
              commentMaxLength={form.commentMaxLength}
              startedAt={startedAt}
              idempotencyKey={randomUUID()}
            />
          </div>
        </section>
        <p className="mx-auto mt-5 max-w-lg text-center text-xs leading-5 text-slate-500">Your rating, category, and optional comment will be shared with this business. Technical information may be processed temporarily to prevent spam and abuse.</p>
      </div>
    </main>
  );
}
