"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="card mx-auto max-w-xl p-8 text-center"><h1 className="text-xl font-bold">This page could not be loaded</h1><p className="mt-3 text-sm leading-6 text-slate-600">Check the database connection and try again. No changes were made.</p><button className="btn btn-primary mt-6" onClick={reset}>Try again</button></div>;
}
