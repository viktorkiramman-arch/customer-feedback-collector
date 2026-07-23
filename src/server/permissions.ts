import type { MembershipRole } from "@/generated/prisma/enums";

export type Permission =
  | "feedback:read"
  | "feedback:moderate"
  | "feedback:export"
  | "categories:manage"
  | "forms:manage"
  | "settings:manage";

const rolePermissions: Record<MembershipRole, ReadonlySet<Permission>> = {
  OWNER: new Set([
    "feedback:read",
    "feedback:moderate",
    "feedback:export",
    "categories:manage",
    "forms:manage",
    "settings:manage",
  ]),
  ADMIN: new Set([
    "feedback:read",
    "feedback:moderate",
    "feedback:export",
    "categories:manage",
    "forms:manage",
    "settings:manage",
  ]),
  MEMBER: new Set(["feedback:read"]),
};

export function hasPermission(role: MembershipRole, permission: Permission): boolean {
  return rolePermissions[role].has(permission);
}
