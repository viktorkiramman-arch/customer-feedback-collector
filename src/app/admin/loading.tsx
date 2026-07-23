export default function AdminLoading() {
  return <div className="space-y-5" aria-busy="true" aria-label="Loading dashboard"><div className="h-9 w-52 animate-pulse rounded-lg bg-slate-200"/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({length:4}).map((_,i)=><div className="h-36 animate-pulse rounded-xl bg-slate-200" key={i}/>)}</div><div className="h-80 animate-pulse rounded-xl bg-slate-200"/></div>;
}
