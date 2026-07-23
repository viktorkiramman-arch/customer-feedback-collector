import Link from "next/link";

export function Logo({ compact = false, href = "/", inverted = false }: { compact?: boolean; href?: string; inverted?: boolean }) {
  return (
    <Link href={href} className="focus-ring inline-flex items-center gap-2 rounded-lg" aria-label="FeedbackLoop home">
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect width="40" height="40" rx="12" fill="#4F46E5" />
        <path d="M11 12.5h18a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H20l-6.5 4v-4H11a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Z" fill="white" opacity=".98" />
        <path d="M15 20a5.2 5.2 0 0 1 8.3-4.2M25 20a5.2 5.2 0 0 1-8.3 4.2" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
        <path d="m22 14.8 1.8 1.2-1.7 1.4M18 25.2l-1.8-1.2 1.7-1.4" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && <span className={`text-lg font-bold tracking-tight ${inverted ? "text-white" : "text-slate-950"}`}>FeedbackLoop</span>}
    </Link>
  );
}
