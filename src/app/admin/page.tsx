import Link from "next/link";
import { ArrowRight, MessageSquareText, Star, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/dates";
import { requirePermission } from "@/server/auth-context";
import { getDashboardStats, getPrimaryForm } from "@/server/queries";

export const dynamic = "force-dynamic";

function MetricCard({ label, value, help, icon: Icon }: { label: string; value: string; help: string; icon: typeof Star }) {
  return <article className="card p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p></div><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><Icon size={20}/></span></div><p className="mt-3 text-xs text-slate-500">{help}</p></article>;
}

export default async function DashboardPage() {
  const session = await requirePermission("feedback:read");
  const [stats, form] = await Promise.all([
    getDashboardStats(session.user.organizationId),
    getPrimaryForm(session.user.organizationId),
  ]);
  const maxDistribution = Math.max(1, ...stats.distribution.map((item) => item.count));
  const maxCategory = Math.max(1, ...stats.byCategory.map((item) => item.count));

  return (
    <main>
      <PageHeader title="Dashboard" description="A 30-day view of customer sentiment, operational workload, and recent submissions." action={form ? <Link className="btn btn-secondary" target="_blank" href={`/f/${form.publicSlug}`}>Open public form <ArrowRight size={16}/></Link> : undefined} />
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total responses" value={String(stats.total)} help="Valid responses in the last 30 days" icon={MessageSquareText}/>
        <MetricCard label="Average rating" value={stats.average?.toFixed(2) ?? "—"} help="Mean rating excluding spam" icon={Star}/>
        <MetricCard label="Negative feedback" value={String(stats.negativeCount)} help="Ratings of 1 or 2" icon={TriangleAlert}/>
        <MetricCard label="Needs action" value={String(stats.unresolvedNegative)} help="Negative feedback not resolved" icon={TriangleAlert}/>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="card p-5 sm:p-6">
          <div className="flex items-center justify-between"><h2 className="font-bold">Rating distribution</h2><span className="text-sm text-slate-500">Last 30 days</span></div>
          <div className="mt-6 space-y-4">
            {stats.distribution.map((item) => <div className="grid grid-cols-[24px_1fr_36px] items-center gap-3" key={item.rating}><span className="text-sm font-semibold">{item.rating}</span><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{width:`${(item.count/maxDistribution)*100}%`}} /></div><span className="text-right text-sm tabular-nums text-slate-500">{item.count}</span></div>)}
          </div>
        </article>
        <article className="card p-5 sm:p-6">
          <div className="flex items-center justify-between"><h2 className="font-bold">Feedback by category</h2><Link className="text-sm font-semibold text-indigo-700" href="/admin/feedback">View all</Link></div>
          <div className="mt-6 space-y-4">
            {stats.byCategory.length === 0 ? <p className="text-sm text-slate-500">No category data is available yet.</p> : stats.byCategory.map((item) => <div key={item.name}><div className="mb-1.5 flex justify-between gap-4 text-sm"><span className="truncate font-medium">{item.name}</span><span className="tabular-nums text-slate-500">{item.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600" style={{width:`${(item.count/maxCategory)*100}%`}} /></div></div>)}
          </div>
        </article>
      </section>

      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6"><div><h2 className="font-bold">Recent submissions</h2><p className="mt-1 text-sm text-slate-500">Newest valid feedback across active forms.</p></div><Link className="btn btn-secondary min-h-9 px-3 py-1.5 text-sm" href="/admin/feedback">View all</Link></div>
        {stats.recent.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No feedback has been collected yet.</div> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Rating</th><th>Category</th><th>Comment</th><th>Workflow</th><th>Submitted</th></tr></thead><tbody>{stats.recent.map((item) => <tr key={item.id}><td><Link className="font-bold text-indigo-700" href={`/admin/feedback/${item.id}`}>{item.rating}/5</Link></td><td>{item.category.name}</td><td className="max-w-md text-slate-600">{item.comment ? item.comment.slice(0,120) : <span className="italic text-slate-400">No comment</span>}</td><td><StatusBadge value={item.workflowStatus}/></td><td className="whitespace-nowrap text-slate-500">{formatDateTime(item.submittedAt, session.user.organizationTimeZone)}</td></tr>)}</tbody></table></div>}
      </section>
    </main>
  );
}
