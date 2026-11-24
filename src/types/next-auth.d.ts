import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      rbacRoles?: string[];
      legacyAdmin?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    rbacRoles?: string[];
    legacyAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    rbacRoles?: string[];
    legacyAdmin?: boolean;
  }
}
