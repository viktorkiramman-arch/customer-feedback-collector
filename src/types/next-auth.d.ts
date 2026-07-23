import type { DefaultSession } from "next-auth";
import type { MembershipRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string;
      organizationName: string;
      organizationTimeZone: string;
      role: MembershipRole;
    } & DefaultSession["user"];
  }

  interface User {
    organizationId: string;
    organizationName: string;
    organizationTimeZone: string;
    role: MembershipRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    organizationId: string;
    organizationName: string;
    organizationTimeZone: string;
    role: MembershipRole;
  }
}
