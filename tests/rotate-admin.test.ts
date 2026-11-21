import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AdminCredentialsError } from "@/lib/admin-credentials";
import { rotateAdminAccount } from "@/lib/rotate-admin";
import { cleanDb, resetTestDb } from "./helpers";

const prisma = new PrismaClient();

describe("rotateAdminAccount", () => {
  beforeAll(() => {
    resetTestDb();
  });

  beforeEach(async () => {
    await cleanDb(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("sets a new admin, disables demo accounts, and keeps orders", async () => {
    const demoAdmin = await prisma.user.create({
      data: {
        email: "admin@vizfas.vn",
        name: "Demo admin",
        password: await bcrypt.hash("old-admin-pass", 10),
        role: "ADMIN",
      },
    });
    const demoCustomer = await prisma.user.create({
      data: {
        email: "khach@vizfas.vn",
        name: "Demo customer",
        password: await bcrypt.hash("old-customer-pass", 10),
        role: "CUSTOMER",
      },
    });
    await prisma.session.create({
      data: {
        sessionToken: "demo-admin-session",
        userId: demoAdmin.id,
        expires: new Date(Date.now() + 86_400_000),
      },
    });
    const order = await prisma.order.create({
      data: {
        orderNumber: "KEEP-1",
        userId: demoAdmin.id,
        customerName: "Demo admin",
        customerPhone: "0900000000",
        address: "1 Test",
        subtotal: 1000,
        total: 1000,
      },
    });

    await rotateAdminAccount(prisma, {
      email: "owner@shop.vn",
      password: "New-admin-pass1",
    });

    const disabledAdmin = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@vizfas.vn" },
    });
    const disabledCustomer = await prisma.user.findUniqueOrThrow({
      where: { email: "khach@vizfas.vn" },
    });
    const created = await prisma.user.findUniqueOrThrow({
      where: { email: "owner@shop.vn" },
    });
    const kept = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });

    expect(disabledAdmin.id).toBe(demoAdmin.id);
    expect(disabledAdmin.password).toBeNull();
    expect(disabledAdmin.role).toBe("CUSTOMER");
    expect(disabledCustomer.id).toBe(demoCustomer.id);
    expect(disabledCustomer.password).toBeNull();
    expect(disabledCustomer.role).toBe("CUSTOMER");
    expect(await prisma.session.count({ where: { userId: demoAdmin.id } })).toBe(0);
    expect(created.role).toBe("ADMIN");
    expect(await bcrypt.compare("New-admin-pass1", created.password!)).toBe(true);
    expect(kept.userId).toBe(demoAdmin.id);
    expect(await prisma.order.count()).toBe(1);
    expect(await prisma.user.count()).toBe(3);
  });

  it("rejects a weak password before changing accounts", async () => {
    await prisma.user.create({
      data: {
        email: "admin@vizfas.vn",
        password: await bcrypt.hash("Old-admin-pass1", 10),
        role: "ADMIN",
      },
    });

    await expect(
      rotateAdminAccount(prisma, { email: "owner@shop.vn", password: "alllowercase1" }),
    ).rejects.toBeInstanceOf(AdminCredentialsError);

    const unchanged = await prisma.user.findUniqueOrThrow({ where: { email: "admin@vizfas.vn" } });
    expect(unchanged.role).toBe("ADMIN");
    expect(unchanged.password).not.toBeNull();
    expect(await prisma.user.findUnique({ where: { email: "owner@shop.vn" } })).toBeNull();
  });
});
