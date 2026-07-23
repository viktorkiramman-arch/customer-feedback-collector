import { Archive, RotateCcw, Tag } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { createCategoryAction, toggleCategoryAction } from "@/server/actions";
import { requirePermission } from "@/server/auth-context";
import { getCategories } from "@/server/queries";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const session = await requirePermission("categories:manage");
  const query = await searchParams;
  const categories = await getCategories(session.user.organizationId);

  return (
    <main>
      <PageHeader title="Categories" description="Create the business areas customers can select on the public feedback form." />
      {query.success && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Category change saved.</div>}
      {query.error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">The category could not be saved. Names must be unique.</div>}

      <div className="mt-7 grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2"><Tag size={19} className="text-indigo-700"/><h2 className="font-bold">Add category</h2></div>
          <form className="mt-6 space-y-5" action={createCategoryAction}>
            <div><label className="label" htmlFor="name">Category name</label><input className="input" id="name" name="name" maxLength={80} required placeholder="Customer Service"/></div>
            <div><label className="label" htmlFor="description">Description</label><textarea className="input min-h-28" id="description" name="description" maxLength={300} placeholder="Help customers understand what this category covers."/></div>
            <button className="btn btn-primary w-full" type="submit">Create category</button>
          </form>
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold">Form categories</h2><p className="mt-1 text-sm text-slate-500">Archived categories remain attached to historical submissions.</p></div>
          {categories.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">Create the first category to activate a public form.</div> : <div className="divide-y divide-slate-200">{categories.map((category)=><article className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" key={category.id}><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{category.name}</h3>{category.archivedAt && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Archived</span>}</div>{category.description && <p className="mt-1 text-sm text-slate-600">{category.description}</p>}<p className="mt-2 text-xs text-slate-500">{category._count.submissions} submissions</p></div><form action={toggleCategoryAction}><input type="hidden" name="id" value={category.id}/><button className={category.archivedAt ? "btn btn-secondary min-h-9 px-3 py-1.5 text-sm" : "btn btn-danger min-h-9 px-3 py-1.5 text-sm"} type="submit">{category.archivedAt ? <><RotateCcw size={15}/>Restore</> : <><Archive size={15}/>Archive</>}</button></form></article>)}</div>}
        </section>
      </div>
    </main>
  );
}
