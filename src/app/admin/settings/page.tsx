import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { updateFormSettingsAction } from "@/server/actions";
import { requirePermission } from "@/server/auth-context";
import { getPrimaryForm } from "@/server/queries";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const session = await requirePermission("forms:manage");
  const query = await searchParams;
  const form = await getPrimaryForm(session.user.organizationId);
  if (!form) return <main><PageHeader title="Settings" description="No feedback form exists for this organization."/></main>;

  return (
    <main>
      <PageHeader title="Settings" description="Configure the public form identity, public link, confirmation message, and availability." action={<Link className="btn btn-secondary" target="_blank" href={`/f/${form.publicSlug}`}>Preview form <ExternalLink size={16}/></Link>} />
      {query.success && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Form settings saved.</div>}
      {query.error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Settings could not be saved. Check the values and public slug.</div>}
      <section className="card mt-7 max-w-3xl p-5 sm:p-7">
        <form className="space-y-6" action={updateFormSettingsAction}>
          <input type="hidden" name="formId" value={form.id}/>
          <div><label className="label" htmlFor="title">Public form title</label><input className="input" id="title" name="title" maxLength={160} defaultValue={form.title} required/></div>
          <div><label className="label" htmlFor="description">Introduction</label><textarea className="input min-h-28" id="description" name="description" maxLength={1000} defaultValue={form.description ?? ""}/></div>
          <div><label className="label" htmlFor="successMessage">Confirmation message</label><textarea className="input min-h-24" id="successMessage" name="successMessage" maxLength={500} defaultValue={form.successMessage} required/></div>
          <div><label className="label" htmlFor="publicSlug">Public link slug</label><div className="flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-indigo-500 focus-within:outline focus-within:outline-3 focus-within:outline-indigo-100"><span className="border-r border-slate-200 px-3 text-sm text-slate-500">/f/</span><input className="min-w-0 flex-1 rounded-r-xl px-3 py-3 outline-none" id="publicSlug" name="publicSlug" defaultValue={form.publicSlug} required/></div><p className="help">Lowercase letters, numbers, and hyphens only.</p></div>
          <div><label className="label" htmlFor="timeZone">Organization time zone</label><input className="input" id="timeZone" name="timeZone" defaultValue={session.user.organizationTimeZone} required/><p className="help">Use an IANA value such as Asia/Manila or America/New_York.</p></div>
          <div><label className="label" htmlFor="status">Form status</label><select className="input" id="status" name="status" defaultValue={form.status}>{["DRAFT","ACTIVE","INACTIVE","ARCHIVED"].map((value)=><option key={value}>{value}</option>)}</select></div>
          <button className="btn btn-primary" type="submit">Save settings</button>
        </form>
      </section>
    </main>
  );
}
