import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import type { MembershipRole } from "@/generated/prisma/enums";
import { loginSchema } from "@/lib/validation";
import { prisma } from "@/server/db";

const membershipRoles = new Set<MembershipRole>(["OWNER", "ADMIN", "MEMBER"]);

function isMembershipRole(value: unknown): value is MembershipRole {
  return typeof value === "string" && membershipRoles.has(value as MembershipRole);
}

export const authOptions: NextAuthOptions = {
  secret:
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV !== "production"
      ? "development-auth-secret-change-this-value"
      : undefined),
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: {
            memberships: {
              where: { revokedAt: null, organization: { deletedAt: null } },
              include: { organization: true },
              take: 1,
              orderBy: { createdAt: "asc" },
            },
          },
        });

        if (
          !user ||
          !user.passwordHash ||
          user.isDisabled ||
          user.deletedAt ||
          user.memberships.length === 0
        ) {
          return null;
        }

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        const membership = user.memberships[0];
        if (!membership) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: membership.organizationId,
          organizationName: membership.organization.name,
          organizationTimeZone: membership.organization.timeZone,
          role: membership.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.organizationTimeZone = user.organizationTimeZone;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (
        session.user &&
        typeof token.userId === "string" &&
        typeof token.organizationId === "string" &&
        typeof token.organizationName === "string" &&
        typeof token.organizationTimeZone === "string" &&
        isMembershipRole(token.role)
      ) {
        session.user.id = token.userId;
        session.user.organizationId = token.organizationId;
        session.user.organizationName = token.organizationName;
        session.user.organizationTimeZone = token.organizationTimeZone;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
