import Link from "next/link";
import { Logo } from "@/components/logo";

export default function PublicFormNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <section className="card w-full max-w-lg p-8 text-center shadow-sm">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="mt-7 text-2xl font-bold">This feedback form is unavailable</h1>
        <p className="mt-3 text-slate-600">The link may be incorrect, or the business may have closed this form.</p>
        <Link className="btn btn-secondary mt-7" href="/">Return home</Link>
      </section>
    </main>
  );
}
