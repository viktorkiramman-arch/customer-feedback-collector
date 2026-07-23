const styles: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 ring-blue-200",
  REVIEWED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  FLAGGED: "bg-amber-50 text-amber-800 ring-amber-200",
  SPAM: "bg-red-50 text-red-700 ring-red-200",
  ARCHIVED: "bg-slate-100 text-slate-700 ring-slate-200",
  OPEN: "bg-blue-50 text-blue-700 ring-blue-200",
  INVESTIGATING: "bg-violet-50 text-violet-700 ring-violet-200",
  ACTION_PLANNED: "bg-amber-50 text-amber-800 ring-amber-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  NO_ACTION: "bg-slate-100 text-slate-700 ring-slate-200",
  LOW: "bg-slate-100 text-slate-700 ring-slate-200",
  NORMAL: "bg-blue-50 text-blue-700 ring-blue-200",
  HIGH: "bg-orange-50 text-orange-700 ring-orange-200",
  URGENT: "bg-red-50 text-red-700 ring-red-200",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[value] ?? styles.NEW}`}>
      {value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}
    </span>
  );
}
