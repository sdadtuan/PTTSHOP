import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { POST as registerPost } from "@/app/api/auth/register/route";
import { clearRateLimit } from "@/lib/rate-limit";
import { cleanDb, resetTestDb, seedMinimal } from "./helpers";

const prisma = new PrismaClient();

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify(body),
  });
}

describe("auth: register & login", () => {
  beforeAll(() => {
    resetTestDb();
  });

  beforeEach(async () => {
    await cleanDb(prisma);
    await seedMinimal(prisma);
    clearRateLimit("register:127.0.0.1");
    clearRateLimit(`login-fail:${process.env.E2E_CUSTOMER_EMAIL}`);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("registers a customer with hashed password (never ADMIN)", async () => {
    const res = await registerPost(
      jsonRequest("http://localhost/api/auth/register", {
        name: "New User",
        email: "new@test.local",
        password: "secret12",
      }),
    );
    expect(res.status).toBe(201);
    const payload = await res.json();
    expect(payload.user.role).toBe("CUSTOMER");
    expect(payload.user.email).toBe("new@test.local");

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "new@test.local" },
    });
    expect(user.role).toBe("CUSTOMER");
    expect(user.password).not.toBe("secret12");
    expect(await bcrypt.compare("secret12", user.password!)).toBe(true);

    // Duplicate email rejected
    const dup = await registerPost(
      jsonRequest("http://localhost/api/auth/register", {
        name: "Dup",
        email: "new@test.local",
        password: "secret12",
      }),
    );
    expect(dup.status).toBe(409);
  });

  it("login succeeds with correct password and fails with wrong", async () => {
    const user = await prisma.user.findUnique({
      where: { email: process.env.E2E_CUSTOMER_EMAIL },
    });
    expect(user?.password).toBeTruthy();
    expect(await bcrypt.compare(process.env.E2E_CUSTOMER_PASSWORD!, user!.password!)).toBe(true);
    expect(await bcrypt.compare("wrong", user!.password!)).toBe(false);
  });

  it("forgot-password stores reset token", async () => {
    const email = process.env.E2E_CUSTOMER_EMAIL!;
    const token = "a".repeat(40);
    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token,
        expires: new Date(Date.now() + 3600_000),
      },
    });
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });
    expect(record?.identifier).toBe(`reset:${email}`);

    const newHash = await bcrypt.hash("newpass99", 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { password: newHash },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);
    const updated = await prisma.user.findUnique({ where: { email } });
    expect(await bcrypt.compare("newpass99", updated!.password!)).toBe(true);
  });
});
