import { createHmac } from "crypto";
import { execSync } from "child_process";
import path from "path";
import { describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { crc16CcittFalse } from "@/lib/payments/crc16";
import { buildVietQrPayload, readVietQrFields } from "@/lib/payments/vietqr";
import { checkoutMethodError, paymentOptions, quoteFromServerPrices } from "@/lib/payments/policy";
import { reviewPaymentConfirm } from "@/lib/payments/confirm";
import { payosDataString, payosSign, reviewPayosWebhook } from "@/lib/payments/payos";
import { releaseExpiredUnpaid, shouldReleaseHold } from "@/lib/payments/hold";
import { isSqliteBusy, withSqliteRetry } from "@/lib/payments/sqlite-retry";
import { transferView } from "@/lib/payments/instructions";
import { applyPayosPayment } from "@/lib/payments/apply-webhook";

const bank = {
  codEnabled: true,
  codMaxAmount: 5_000_000,
  holdHours: 24,
  codConfirmHours: 48,
  bankBin: "970422",
  bankName: "MB",
  bankAccountNumber: "0000000000",
  bankAccountName: "CONG TY TEST",
  bankBranch: "",
};

describe("TC QR", () => {
  it("matches the hand CRC 29B1 and decodes BIN, account, amount and content", () => {
    expect(crc16CcittFalse("123456789")).toBe("29B1");
    const payload = buildVietQrPayload({
      bankBin: bank.bankBin,
      bankAccountNumber: bank.bankAccountNumber,
      bankAccountName: bank.bankAccountName,
      amount: 150000,
      orderNumber: "PTT123456",
    });
    expect(payload.startsWith("000201")).toBe(true);
    expect(crc16CcittFalse(payload.slice(0, -4))).toBe(payload.slice(-4));
    expect(readVietQrFields(payload)).toEqual({
      bin: "970422",
      account: "0000000000",
      amount: "150000",
      content: "PTT123456",
    });
  });
});

describe("COD ceiling and bank visibility", () => {
  it("blocks COD above the server ceiling and still lists bank transfer", () => {
    expect(checkoutMethodError("COD", 5_000_001, bank, false)).toMatch(/ngưỡng/);
    expect(checkoutMethodError("COD", 5_000_000, bank, false)).toBeNull();
    const hidden = paymentOptions({ ...bank, bankAccountNumber: "" }, false);
    expect(hidden.bankVisible).toBe(true);
    expect(hidden.bankReady).toBe(false);
    expect(checkoutMethodError("BANK_TRANSFER", 1000, { ...bank, bankAccountNumber: "" }, false)).toMatch(/cấu hình/);
    expect(JSON.stringify(hidden)).not.toContain("0000000000");
  });

  it("prices from the catalog", () => {
    expect(quoteFromServerPrices([{ price: 200000, quantity: 2 }], 30000, 0).total).toBe(430000);
  });
});

describe("manual confirm", () => {
  it("rejects a guest and a customer, accepts one admin confirm, rejects the second and an amount change", () => {
    expect(reviewPaymentConfirm({ role: null, paymentStatus: "UNPAID", orderTotal: 1000 }).ok).toBe(false);
    const customer = reviewPaymentConfirm({ role: "CUSTOMER", paymentStatus: "UNPAID", orderTotal: 1000 });
    expect(customer.ok).toBe(false);
    if (!customer.ok) expect(customer.status).toBe(403);
    const first = reviewPaymentConfirm({ role: "ADMIN", paymentStatus: "UNPAID", orderTotal: 250000 });
    expect(first).toEqual({ ok: true, amount: 250000 });
    const second = reviewPaymentConfirm({ role: "ADMIN", paymentStatus: "PAID", orderTotal: 250000 });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.status).toBe(409);
    const changed = reviewPaymentConfirm({ role: "ADMIN", paymentStatus: "UNPAID", orderTotal: 250000, requestedAmount: 1 });
    expect(changed.ok).toBe(false);
  });
});

describe("TC-03 TC-04 TC-05", () => {
  it("TC-03 rejects a bad signature and stays closed without a secret", () => {
    expect(reviewPayosWebhook({ configured: false, signatureOk: true, seen: false, orderFound: true, amountMatches: true, descriptionMatches: true, paidCode: true }).status).toBe(404);
    expect(reviewPayosWebhook({ configured: true, signatureOk: false, seen: false, orderFound: true, amountMatches: true, descriptionMatches: true, paidCode: true }).status).toBe(403);
    const fields = { orderCode: 123, amount: 3000, description: "PTT1" };
    const good = payosSign(fields, "checksum");
    const data = payosDataString(fields);
    const expected = createHmac("sha256", "checksum").update(data).digest("hex");
    expect(good).toBe(expected);
    expect(good).not.toBe("deadbeef");
  });

  it("TC-04 does not apply a duplicate event", () => {
    const again = reviewPayosWebhook({ configured: true, signatureOk: true, seen: true, orderFound: true, amountMatches: true, descriptionMatches: true, paidCode: true });
    expect(again.apply).toBe(false);
    expect(again.duplicate).toBe(true);
  });

  it("TC-05 releases only unpaid transfer orders created after the deploy cutoff", () => {
    const now = new Date("2026-11-24T00:00:00.000Z");
    const enforceFrom = new Date("2026-11-23T12:00:00.000Z");
    expect(shouldReleaseHold({
      method: "BANK_TRANSFER",
      paymentStatus: "UNPAID",
      status: "PENDING",
      dueAt: new Date("2026-11-23T18:00:00.000Z"),
      createdAt: new Date("2026-11-23T13:00:00.000Z"),
    }, now, enforceFrom)).toBe(true);
    expect(shouldReleaseHold({
      method: "BANK_TRANSFER",
      paymentStatus: "UNPAID",
      status: "PENDING",
      dueAt: new Date("2026-11-23T18:00:00.000Z"),
      createdAt: new Date("2026-11-23T11:00:00.000Z"),
    }, now, enforceFrom)).toBe(false);
    expect(shouldReleaseHold({
      method: "COD",
      paymentStatus: "UNPAID",
      status: "PENDING",
      dueAt: new Date("2026-11-23T18:00:00.000Z"),
      createdAt: new Date("2026-11-23T13:00:00.000Z"),
    }, now, enforceFrom)).toBe(false);
    expect(shouldReleaseHold({
      method: "PAYOS",
      paymentStatus: "UNPAID",
      status: "PENDING",
      dueAt: new Date("2026-11-23T18:00:00.000Z"),
      createdAt: new Date("2026-11-23T13:00:00.000Z"),
    }, now, null)).toBe(false);
  });
});

describe("sqlite busy retry and concurrent webhook", () => {
  it("retries when SQLite reports busy", async () => {
    let calls = 0;
    const value = await withSqliteRetry(async () => {
      calls += 1;
      if (calls < 3) throw new Error("SQLITE_BUSY");
      return "ok";
    });
    expect(isSqliteBusy(new Error("SQLITE_BUSY"))).toBe(true);
    expect(value).toBe("ok");
    expect(calls).toBe(3);
  });

  it("processes one of two concurrent notices", async () => {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: `file:${path.resolve("prisma/pay-test.db")}` },
      stdio: "pipe",
    });
    const db = new PrismaClient({ datasourceUrl: `file:${path.resolve("prisma/pay-test.db")}` });
    const product = await db.product.create({
      data: {
        name: "Pay Tee",
        slug: `pay-tee-${Date.now()}`,
        description: "Test",
        gender: "UNISEX",
        variants: { create: { sku: `sku-${Date.now()}`, color: "Den", size: "M", price: 100000, stock: 2 } },
      },
      include: { variants: true },
    });
    const variant = product.variants[0];
    const order = await db.order.create({
      data: {
        orderNumber: `PTTPAY${Date.now()}`,
        status: "PENDING",
        paymentMethod: "PAYOS",
        paymentStatus: "UNPAID",
        customerName: "A",
        customerPhone: "0900000000",
        address: "Test",
        subtotal: 100000,
        total: 100000,
        payosOrderCode: Math.floor(Math.random() * 1_000_000_000),
        items: { create: { variantId: variant.id, name: "Pay Tee", color: "Den", size: "M", price: 100000, quantity: 1 } },
      },
    });
    const [first, second] = await Promise.all([
      applyPayosPayment(db, order, "tx-concurrent"),
      applyPayosPayment(db, order, "tx-concurrent"),
    ]);
    const flags = [first.duplicate, second.duplicate].sort();
    expect(flags).toEqual([false, true]);
    const saved = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.paymentStatus).toBe("PAID");
    const events = await db.webhookEvent.count({ where: { eventId: "tx-concurrent" } });
    expect(events).toBe(1);
    await db.$disconnect();
  });

  it("TC-05 cancels an overdue unpaid transfer created after the cutoff and restores stock", async () => {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: `file:${path.resolve("prisma/pay-test.db")}` },
      stdio: "pipe",
    });
    const db = new PrismaClient({ datasourceUrl: `file:${path.resolve("prisma/pay-test.db")}` });
    const stamp = Date.now();
    const product = await db.product.create({
      data: {
        name: "Hold Tee",
        slug: `hold-tee-${stamp}`,
        gender: "UNISEX",
        variants: {
          create: [
            { sku: `hold-${stamp}`, color: "Den", size: "M", price: 100000, stock: 3 },
            { sku: `cod-${stamp}`, color: "Den", size: "L", price: 100000, stock: 4 },
          ],
        },
      },
      include: { variants: true },
    });
    const transferVariant = product.variants.find((item) => item.sku.startsWith("hold"))!;
    const codVariant = product.variants.find((item) => item.sku.startsWith("cod"))!;
    const line = (variantId: string, quantity: number) => ({
      variantId,
      name: "Hold Tee",
      color: "Den",
      size: "M",
      price: 100000,
      quantity,
    });
    const overdue = await db.order.create({
      data: {
        orderNumber: `PTTHOLD${stamp}`,
        status: "PENDING",
        paymentMethod: "BANK_TRANSFER",
        paymentStatus: "UNPAID",
        customerName: "A",
        customerPhone: "0900000000",
        address: "Test",
        subtotal: 200000,
        total: 200000,
        createdAt: new Date("2026-11-23T13:00:00.000Z"),
        paymentDueAt: new Date("2026-11-23T18:00:00.000Z"),
        items: { create: line(transferVariant.id, 2) },
      },
    });
    const older = await db.order.create({
      data: {
        orderNumber: `PTTOLD${stamp}`,
        status: "PENDING",
        paymentMethod: "PAYOS",
        paymentStatus: "UNPAID",
        customerName: "B",
        customerPhone: "0900000001",
        address: "Test",
        subtotal: 100000,
        total: 100000,
        createdAt: new Date("2026-11-23T10:00:00.000Z"),
        paymentDueAt: new Date("2026-11-23T11:00:00.000Z"),
        items: { create: line(transferVariant.id, 1) },
      },
    });
    const cod = await db.order.create({
      data: {
        orderNumber: `PTTCOD${stamp}`,
        status: "PENDING",
        paymentMethod: "COD",
        paymentStatus: "UNPAID",
        customerName: "C",
        customerPhone: "0900000002",
        address: "Test",
        subtotal: 100000,
        total: 100000,
        createdAt: new Date("2026-11-23T13:00:00.000Z"),
        paymentDueAt: new Date("2026-11-23T18:00:00.000Z"),
        items: { create: line(codVariant.id, 1) },
      },
    });
    const result = await releaseExpiredUnpaid(
      db,
      new Date("2026-11-24T00:00:00.000Z"),
      new Date("2026-11-23T12:00:00.000Z"),
    );
    expect(result.released).toBe(1);
    expect((await db.order.findUniqueOrThrow({ where: { id: overdue.id } })).status).toBe("CANCELLED");
    expect((await db.order.findUniqueOrThrow({ where: { id: older.id } })).status).toBe("PENDING");
    expect((await db.order.findUniqueOrThrow({ where: { id: cod.id } })).status).toBe("PENDING");
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: transferVariant.id } })).stock).toBe(5);
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: codVariant.id } })).stock).toBe(4);
    await db.$disconnect();
  });
});

describe("transfer instructions", () => {
  it("returns null until the account is complete", () => {
    expect(transferView({ config: { ...bank, bankAccountName: "" }, amount: 1000, orderNumber: "PTT1", dueAt: null })).toBeNull();
    const view = transferView({ config: bank, amount: 1000, orderNumber: "PTT1", dueAt: new Date("2026-11-24T03:00:00.000Z") });
    expect(view?.accountNumber).toBe("0000000000");
    expect(view?.content).toBe("PTT1");
    expect(view?.note).toMatch(/nhận đủ tiền/);
  });
});
