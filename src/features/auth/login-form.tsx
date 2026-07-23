"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm({
  demoEmail,
  demoPassword,
}: {
  demoEmail?: string;
  demoPassword?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
      callbackUrl: "/admin",
    });
    if (result?.error) {
      setError("Invalid email or password.");
      setSubmitting(false);
      return;
    }
    window.location.assign(result?.url ?? "/admin");
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</div>}
      <div><label className="label" htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" autoComplete="email" defaultValue={demoEmail} required /></div>
      <div><label className="label" htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" defaultValue={demoPassword} required /></div>
      <button className="btn btn-primary w-full" disabled={submitting} type="submit">{submitting ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
