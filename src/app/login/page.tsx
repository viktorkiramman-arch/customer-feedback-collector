import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/features/auth/login-form";
import { getActiveSession } from "@/server/auth-context";

export const metadata: Metadata = { title: "Admin login" };

export default async function LoginPage() {
  const session = await getActiveSession();
  if (session) redirect("/admin");
  const demoMode =
    process.env.NODE_ENV !== "production" && process.env.DEMO_MODE === "true";
  const demoEmail = process.env.DEMO_ADMIN_EMAIL ?? "owner@example.com";
  const demoPassword = process.env.DEMO_ADMIN_PASSWORD ?? "ChangeMe123!";

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 flex justify-center"><Logo href="/" inverted /></div>
        <section className="card p-6 shadow-2xl sm:p-8">
          <h1 className="text-2xl font-bold">Sign in to your dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Use the seeded demo account to review the complete workflow.</p>
          <div className="mt-7">
            <LoginForm
              demoEmail={demoMode ? demoEmail : undefined}
              demoPassword={demoMode ? demoPassword : undefined}
            />
          </div>
          {demoMode && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Local demo account</p>
              <p className="mt-1">{demoEmail} / {demoPassword}</p>
            </div>
          )}
        </section>
        <p className="mt-5 text-center text-sm text-slate-400"><Link className="hover:text-white" href="/">Return to product overview</Link></p>
      </div>
    </main>
  );
}
