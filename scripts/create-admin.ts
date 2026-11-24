import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const email = process.env.ADMIN_INIT_EMAIL?.trim().toLowerCase() || "";
const password = process.env.ADMIN_INIT_PASSWORD || "";

if (!email || !password || password.length < 12) {
  console.error("Cần ADMIN_INIT_EMAIL và ADMIN_INIT_PASSWORD (ít nhất 12 ký tự).");
  process.exit(1);
}

const prisma = new PrismaClient();
const hash = await bcrypt.hash(password, 10);
await prisma.user.upsert({
  where: { email },
  create: { email, password: hash, role: "ADMIN", name: "Quản trị" },
  update: { password: hash, role: "ADMIN" },
});
console.log("Đã tạo hoặc cập nhật tài khoản quản trị.");
await prisma.$disconnect();
