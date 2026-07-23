import Link from "next/link";
import { Download, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/dates";
import { feedbackFiltersSchema } from "@/lib/validation";
import { requirePermission } from "@/server/auth-context";
import { getCategories, listFeedback } from "@/server/queries";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function scalar(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(params: SearchParams, page: number): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const item = scalar(value);
    if (item && key !== "page") query.set(key, item);
  }
  query.set("page", String(page));
  return `/admin/feedback?${query.toString()}`;
}

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await requirePermission("feedback:read");
  const raw = await searchParams;
  const parsed = feedbackFiltersSchema.safeParse({
    q: scalar(raw.q),
    rating: scalar(raw.rating),
    categoryId: scalar(raw.categoryId),
    status: scalar(raw.status),
    workflowStatus: scalar(raw.workflowStatus),
    from: scalar(raw.from),
    to: scalar(raw.to),
    page: scalar(raw.page),
  });
  const filters = parsed.success ? parsed.data : feedbackFiltersSchema.parse({});
  const [result, categories] = await Promise.all([
    listFeedback(session.user.organizationId, filters),
    getCategories(session.user.organizationId),
  ]);

  const exportQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const item = scalar(value);
    if (item && key !== "page") exportQuery.set(key, item);
  }

  return (
    <main>
      <PageHeader title="Feedback" description="Search, filter, prioritize, and manage collected customer feedback." action={<Link className="btn btn-secondary" href={`/api/admin/feedback/export.csv?${exportQuery.toString()}`}><Download size={17}/>Export CSV</Link>} />

      <form className="card mt-7 p-4 sm:p-5" method="get">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><SlidersHorizontal size={17}/>Search and filters</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2"><label className="label" htmlFor="q">Search comments or categories</label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input className="input pl-10" id="q" name="q" defaultValue={filters.q} placeholder="Delivery, support, damaged…" /></div></div>
          <div><label className="label" htmlFor="rating">Rating</label><select className="input" id="rating" name="rating" defaultValue={filters.rating ?? ""}><option value="">All ratings</option>{[1,2,3,4,5].map((value)=><option value={value} key={value}>{value} star{value === 1 ? "" : "s"}</option>)}</select></div>
          <div><label className="label" htmlFor="categoryId">Category</label><select className="input" id="categoryId" name="categoryId" defaultValue={filters.categoryId ?? ""}><option value="">All categories</option>{categories.map((category)=><option key={category.id} value={category.id}>{category.name}{category.archivedAt ? " (archived)" : ""}</option>)}</select></div>
          <div><label className="label" htmlFor="status">Moderation</label><select className="input" id="status" name="status" defaultValue={filters.status ?? ""}><option value="">All statuses</option>{["NEW","REVIEWED","FLAGGED","SPAM","ARCHIVED"].map((value)=><option key={value}>{value}</option>)}</select></div>
          <div><label className="label" htmlFor="workflowStatus">Workflow</label><select className="input" id="workflowStatus" name="workflowStatus" defaultValue={filters.workflowStatus ?? ""}><option value="">All workflow states</option>{["OPEN","INVESTIGATING","ACTION_PLANNED","RESOLVED","NO_ACTION"].map((value)=><option key={value}>{value}</option>)}</select></div>
          <div><label className="label" htmlFor="from">From</label><input className="input" id="from" name="from" type="date" defaultValue={filters.from}/></div>
          <div><label className="label" htmlFor="to">To</label><input className="input" id="to" name="to" type="date" defaultValue={filters.to}/></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3"><button className="btn btn-primary" type="submit">Apply filters</button><Link className="btn btn-secondary" href="/admin/feedback">Clear all</Link></div>
      </form>

      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><p className="text-sm text-slate-600"><span className="font-semibold text-slate-900 tabular-nums">{result.total}</span> matching responses</p><p className="text-sm text-slate-500">Page {filters.page} of {result.pageCount}</p></div>
        {result.items.length === 0 ? (
          <div className="p-10 text-center"><h2 className="font-bold">No matching feedback</h2><p className="mt-2 text-sm text-slate-500">Change or clear the current filters.</p><Link className="btn btn-secondary mt-5" href="/admin/feedback">Clear filters</Link></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Rating</th><th>Category</th><th>Comment</th><th>Priority</th><th>Workflow</th><th>Submitted</th></tr></thead>
              <tbody>{result.items.map((item)=><tr key={item.id}><td><Link className="font-bold text-indigo-700" href={`/admin/feedback/${item.id}`}>{item.rating}/5</Link></td><td className="whitespace-nowrap">{item.category.name}</td><td className="max-w-xl text-slate-600"><Link href={`/admin/feedback/${item.id}`}>{item.comment ? item.comment.slice(0,150) : <span className="italic text-slate-400">No comment</span>}</Link></td><td><StatusBadge value={item.priority}/></td><td><StatusBadge value={item.workflowStatus}/></td><td className="whitespace-nowrap text-slate-500">{formatDateTime(item.submittedAt, session.user.organizationTimeZone)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
          {filters.page > 1 ? <Link className="btn btn-secondary min-h-9 px-3 py-1.5 text-sm" href={pageHref(raw, filters.page - 1)}>Previous</Link> : <span/>}
          {filters.page < result.pageCount ? <Link className="btn btn-secondary min-h-9 px-3 py-1.5 text-sm" href={pageHref(raw, filters.page + 1)}>Next</Link> : <span/>}
        </div>
      </section>
    </main>
  );
}
