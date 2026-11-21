import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
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
      password: "new-admin-pass",
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
    expect(disabledCustomer.id).toBe(demoCustomer.id);
    expect(disabledCustomer.password).toBeNull();
    expect(await prisma.session.count({ where: { userId: demoAdmin.id } })).toBe(0);
    expect(created.role).toBe("ADMIN");
    expect(await bcrypt.compare("new-admin-pass", created.password!)).toBe(true);
    expect(kept.userId).toBe(demoAdmin.id);
    expect(await prisma.order.count()).toBe(1);
  });
});
