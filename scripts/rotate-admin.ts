import { PrismaClient } from "@prisma/client";
import { AdminCredentialsError, readAdminCredentials } from "../src/lib/admin-credentials";
import { rotateAdminAccount } from "../src/lib/rotate-admin";

async function main() {
  let credentials: { email: string; password: string };
  try {
    credentials = readAdminCredentials();
  } catch (error) {
    if (error instanceof AdminCredentialsError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }

  const prisma = new PrismaClient();
  try {
    const result = await rotateAdminAccount(prisma, credentials);
    console.log(`Đã cập nhật admin ${result.email}; đã khoá ${result.locked} tài khoản demo.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
