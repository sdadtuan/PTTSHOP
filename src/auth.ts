import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { consumeRecovery, decryptSecret, verifyTotp } from "@/lib/two-factor";

class TwoFactorRequired extends CredentialsSignin {
  code = "two_factor_required";
}

class TwoFactorInvalid extends CredentialsSignin {
  code = "two_factor_invalid";
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/dang-nhap",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.password) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        const rawOtp = (credentials as { otp?: unknown }).otp;
        const otp = typeof rawOtp === "string" ? rawOtp.trim() : "";
        const twoFactor = user.role === "ADMIN"
          ? await prisma.adminTwoFactor.findUnique({ where: { userId: user.id } })
          : null;
        if (twoFactor?.enabled) {
          if (!otp) throw new TwoFactorRequired();
          const secret = decryptSecret(twoFactor.secretEncrypted);
          if (!verifyTotp(secret, otp)) {
            const remaining = consumeRecovery(twoFactor.recoveryCodesHash, otp);
            if (!remaining) throw new TwoFactorInvalid();
            await prisma.adminTwoFactor.update({
              where: { userId: user.id },
              data: { recoveryCodesHash: JSON.stringify(remaining), verifiedAt: new Date() },
            });
          } else {
            await prisma.adminTwoFactor.update({ where: { userId: user.id }, data: { verifiedAt: new Date() } });
          }
        }
        const assignments = user.role === "ADMIN"
          ? await prisma.userRoleAssignment.findMany({ where: { userId: user.id }, select: { role: true } })
          : [];
        const legacyAdmin = user.role === "ADMIN" && assignments.length === 0;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          rbacRoles: legacyAdmin ? ["ADMIN"] : assignments.map((row) => row.role),
          legacyAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const staff = user as { role?: string; rbacRoles?: string[]; legacyAdmin?: boolean };
        token.role = staff.role ?? "CUSTOMER";
        token.id = user.id;
        token.rbacRoles = staff.rbacRoles;
        token.legacyAdmin = staff.legacyAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "CUSTOMER";
        session.user.rbacRoles = token.rbacRoles as string[] | undefined;
        session.user.legacyAdmin = token.legacyAdmin as boolean | undefined;
      }
      return session;
    },
  },
});
