import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission, type Permission } from "@/server/permissions";
import { findActiveSessionUser } from "@/server/session-user";

export async function getActiveSession() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await findActiveSessionUser(
    session.user.id,
    session.user.organizationId,
  );
  if (!user) return null;

  return {
    ...session,
    user: {
      ...session.user,
      ...user,
    },
  };
}

export async function requireAuth() {
  const session = await getActiveSession();
  if (!session) redirect("/login?error=session-expired");
  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireAuth();
  if (!hasPermission(session.user.role, permission)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
