import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, MessageSquareText, Search, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";

const features = [
  { icon: MessageSquareText, title: "Focused feedback forms", body: "Collect a clear rating, business-defined category, and optional written feedback." },
  { icon: BarChart3, title: "Useful summaries", body: "Track response volume, average rating, category trends, and unresolved negative feedback." },
  { icon: Search, title: "Fast review workflow", body: "Search, filter, prioritize, moderate, and resolve feedback from one dashboard." },
  { icon: ShieldCheck, title: "Private by design", body: "Tenant-scoped data, server-side validation, rate limiting, and safe CSV export." },
];

export default function HomePage() {
  return (
    <main>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Logo />
          <div className="flex items-center gap-3">
            <Link className="btn btn-secondary hidden sm:inline-flex" href="/f/sample-business-feedback">Public form</Link>
            <Link className="btn btn-primary" href="/login">Open demo <ArrowRight size={17} /></Link>
          </div>
        </div>
      </header>

      <section className="overflow-hidden bg-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
          <div className="self-center">
            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">Customer feedback operations</span>
            <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">Turn customer feedback into measurable action.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Create public feedback forms, identify recurring issues, and manage every response from collection through resolution.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="btn btn-primary" href="/login">Try the admin demo <ArrowRight size={17} /></Link>
              <Link className="btn btn-secondary" href="/f/sample-business-feedback">Submit sample feedback</Link>
            </div>
            <ul className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              {["Anonymous public submissions", "Actionable resolution workflow", "Search and combined filters", "CSV export with formula protection"].map((item) => (
                <li className="flex items-center gap-2" key={item}><CheckCircle2 size={18} className="text-teal-600" />{item}</li>
              ))}
            </ul>
          </div>

          <div className="card relative overflow-hidden bg-slate-950 p-5 shadow-2xl shadow-indigo-200/60 sm:p-7">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" />
            <div className="relative rounded-xl bg-white p-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div><p className="text-sm text-slate-500">Last 30 days</p><h2 className="text-xl font-bold">Feedback overview</h2></div>
                <span className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">Sample Business</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[['160','Responses'],['4.1','Average rating'],['24','Negative'],['11','Need action']].map(([value,label]) => (
                  <div className="rounded-xl border border-slate-200 p-4" key={label}><div className="text-2xl font-bold tabular-nums">{value}</div><div className="mt-1 text-sm text-slate-500">{label}</div></div>
                ))}
              </div>
              <div className="mt-5 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between"><span className="font-semibold">Rating distribution</span><span className="text-sm text-slate-500">160 total</span></div>
                <div className="mt-5 space-y-3">
                  {[15,28,45,76,100].map((width,index) => <div className="flex items-center gap-3" key={width}><span className="w-4 text-xs font-semibold">{index+1}</span><div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-indigo-600" style={{width:`${width}%`}} /></div></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">One complete workflow</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Collect, review, assign, resolve, and measure.</h2></div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({icon:Icon,title,body}) => <article className="card p-6" key={title}><div className="inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-700"><Icon size={22}/></div><h3 className="mt-5 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></article>)}
          </div>
        </div>
      </section>
    </main>
  );
}
