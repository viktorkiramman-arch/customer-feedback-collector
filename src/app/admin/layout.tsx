import { Sidebar } from "@/components/admin/sidebar";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { requireAuth } from "@/server/auth-context";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar organizationName={session.user.organizationName} userName={session.user.name ?? session.user.email ?? "Administrator"} />
      <div className="lg:pl-64">
        <header className="flex min-h-16 items-center justify-end border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <SignOutButton />
        </header>
        <div className="px-4 py-7 sm:px-6 lg:px-8 lg:py-9">{children}</div>
      </div>
    </div>
  );
}
