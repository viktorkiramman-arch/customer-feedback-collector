import { prisma } from "@/server/db";

export async function findActiveSessionUser(userId: string, organizationId: string) {
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      userId,
      organizationId,
      revokedAt: null,
      user: {
        isDisabled: false,
        deletedAt: null,
      },
      organization: {
        deletedAt: null,
      },
    },
    select: {
      role: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          timeZone: true,
        },
      },
    },
  });

  if (!membership) return null;

  return {
    id: membership.user.id,
    email: membership.user.email,
    name: membership.user.name,
    organizationId: membership.organization.id,
    organizationName: membership.organization.name,
    organizationTimeZone: membership.organization.timeZone,
    role: membership.role,
  };
}
