import Link from "next/link";
import { Download, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { requirePermission } from "@/server/auth-context";

export default async function ExportPage() {
  await requirePermission("feedback:export");
  return (
    <main>
      <PageHeader title="Export feedback" description="Download a UTF-8 CSV file for reporting, spreadsheet analysis, or archival use." />
      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="card p-6 sm:p-8">
          <div className="inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-700"><FileSpreadsheet size={24}/></div>
          <h2 className="mt-5 text-xl font-bold">Complete feedback export</h2>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">The export includes submission timestamps, form, rating, category, comment, moderation status, workflow status, and priority. Internal anti-abuse hashes are excluded.</p>
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200"><table className="data-table"><thead><tr><th>Included columns</th></tr></thead><tbody>{["Submission ID and timestamps","Form, rating, and category","Written comment","Moderation and workflow status","Priority"].map((item)=><tr key={item}><td>{item}</td></tr>)}</tbody></table></div>
          <Link className="btn btn-primary mt-7" href="/api/admin/feedback/export.csv"><Download size={17}/>Download all feedback</Link>
          <p className="mt-3 text-xs text-slate-500">Use filters on the Feedback page to export a narrower result set.</p>
        </section>
        <aside className="card p-6"><div className="inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-700"><ShieldCheck size={22}/></div><h2 className="mt-5 font-bold">Export safety</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600"><li>Spreadsheet formulas are neutralized.</li><li>Technical anti-abuse data is excluded.</li><li>The file is generated on demand and is not stored.</li><li>Only authorized organization members can export.</li></ul></aside>
      </div>
    </main>
  );
}
