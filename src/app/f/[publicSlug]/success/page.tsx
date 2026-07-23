import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { getPublicForm } from "@/server/queries";

export default async function SuccessPage({ params }: { params: Promise<{ publicSlug: string }> }) {
  const { publicSlug } = await params;
  const form = await getPublicForm(publicSlug);
  if (!form) notFound();

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg text-center">
        <div className="mb-6 flex justify-center"><Logo href={`/f/${publicSlug}`} /></div>
        <section className="card p-8 shadow-sm sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 size={30} /></div>
          <h1 className="mt-5 text-2xl font-bold">Feedback received</h1>
          <p className="mt-3 leading-7 text-slate-600">{form.successMessage}</p>
          <Link className="btn btn-secondary mt-7" href={`/f/${publicSlug}`}>Submit another response</Link>
        </section>
      </div>
    </main>
  );
}
