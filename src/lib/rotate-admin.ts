import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readAdminCredentials } from "@/lib/admin-credentials";

export const DEMO_ACCOUNT_EMAILS = ["admin@vizfas.vn", "khach@vizfas.vn"] as const;

export async function rotateAdminAccount(
  db: PrismaClient,
  input: { email: string; password: string },
) {
  const { email, password } = readAdminCredentials({
    ADMIN_EMAIL: input.email,
    ADMIN_PASSWORD: input.password,
  });
  const hash = await bcrypt.hash(password, 10);

  await db.$transaction(async (tx) => {
    const demos = await tx.user.findMany({
      where: { email: { in: [...DEMO_ACCOUNT_EMAILS] } },
    });
    for (const user of demos) {
      if (user.email.toLowerCase() === email) continue;
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.user.update({
        where: { id: user.id },
        data: { password: null },
      });
    }

    await tx.user.upsert({
      where: { email },
      create: {
        email,
        name: "Admin",
        password: hash,
        role: "ADMIN",
      },
      update: {
        password: hash,
        role: "ADMIN",
      },
    });
  });

  return { email };
}
