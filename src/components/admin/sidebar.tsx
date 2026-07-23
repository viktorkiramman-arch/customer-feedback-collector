import Link from "next/link";
import { BarChart3, Download, MessageSquareText, Settings, Tags } from "lucide-react";
import { Logo } from "@/components/logo";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquareText },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/export", label: "Export", icon: Download },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ organizationName, userName }: { organizationName: string; userName: string }) {
  return (
    <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-5 py-4 lg:px-6 lg:py-6"><Logo href="/admin" /></div>
        <div className="border-y border-slate-200 px-5 py-3 lg:mx-4 lg:rounded-xl lg:border">
          <p className="truncate text-sm font-semibold text-slate-900">{organizationName}</p>
          <p className="truncate text-xs text-slate-500">Active workspace</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 py-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:py-5" aria-label="Admin navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link className="focus-ring flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950" href={href} key={href}>
              <Icon size={19} aria-hidden="true" />{label}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t border-slate-200 p-5 lg:block">
          <p className="truncate text-sm font-semibold">{userName}</p>
          <p className="text-xs text-slate-500">Administrator</p>
        </div>
      </div>
    </aside>
  );
}
