import { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { EMPTY_LOYALTY, ledgerBalance, planExpiry, planOrderPoints, pointsForAmount, redeemQuote, referralBlocked } from "@/lib/loyalty";
import { syncOrderLoyalty } from "@/lib/loyalty-sync";

const now = new Date("2026-11-28T04:00:00.000Z");
const rule = { ...EMPTY_LOYALTY, enabled: true, pointsPerAmount: 1, amountVnd: 10_000, earnOn: "COMPLETED" };

describe("sổ điểm", () => {
  it("does nothing while the flag or the rate is empty", () => {
    expect(pointsForAmount(100_000, null, null)).toBeNull();
    expect(pointsForAmount(100_000, -1, 10_000)).toBeNull();
    const planned = planOrderPoints({
      rule: EMPTY_LOYALTY,
      order: { id: "o", status: "COMPLETED", paymentStatus: "PAID", total: 100_000 },
      existing: [],
      now,
    });
    expect(planned).toEqual([]);
  });

  it("earns once, reverses on cancel, and expires through the ledger", () => {
    const first = planOrderPoints({
      rule,
      order: { id: "o", status: "COMPLETED", paymentStatus: "PAID", total: 25_000 },
      existing: [],
      now,
    });
    expect(first).toMatchObject([{ idempotencyKey: "earn:o", delta: 2, reason: "EARN" }]);
    const second = planOrderPoints({
      rule,
      order: { id: "o", status: "COMPLETED", paymentStatus: "PAID", total: 25_000 },
      existing: first,
      now,
    });
    expect(second).toEqual([]);
    const reversed = planOrderPoints({
      rule,
      order: { id: "o", status: "CANCELLED", paymentStatus: "PAID", total: 25_000 },
      existing: first,
      now,
    });
    expect(reversed).toMatchObject([{ idempotencyKey: "reverse:o", delta: -2, reason: "REVERSE" }]);
    expect(ledgerBalance([...first, ...reversed])).toBe(0);
    const expired = planExpiry([{ id: "e1", ...first[0], expiresAt: new Date("2026-11-01T00:00:00.000Z") }], now);
    expect(expired).toMatchObject([{ idempotencyKey: "expire:e1", delta: -2, reason: "EXPIRE" }]);
    expect(planExpiry([{ id: "e1", ...first[0], expiresAt: new Date("2026-11-01T00:00:00.000Z") }, ...expired], now)).toEqual([]);
  });

  it("blocks self referral and caps a redemption", () => {
    expect(referralBlocked({
      referrerUserId: "a", referredUserId: "a", referrerPhone: null, referrerEmail: null, buyerPhone: null, buyerEmail: null,
    })).toMatch(/tài khoản/);
    expect(referralBlocked({
      referrerUserId: "a", referredUserId: "b", referrerPhone: "0901234567", referrerEmail: null, buyerPhone: "0901 234 567", buyerEmail: null,
    })).toMatch(/điện thoại/);
    expect(referralBlocked({
      referrerUserId: "a", referredUserId: "b", referrerPhone: null, referrerEmail: "A@shop.test", buyerPhone: null, buyerEmail: "a@shop.test",
    })).toMatch(/email/);
    const open = { ...rule, redeemCapPerOrder: 10, redeemVndPerPoint: 1_000 };
    expect(redeemQuote({ rule: open, balance: 20, requested: 11, goodsTotal: 100_000 }).error).toMatch(/trần/);
    expect(redeemQuote({ rule: open, balance: 4, requested: 5, goodsTotal: 100_000 }).error).toMatch(/đủ/);
    expect(redeemQuote({ rule: EMPTY_LOYALTY, balance: 20, requested: 5, goodsTotal: 100_000 })).toMatchObject({ points: 0, discount: 0 });
    expect(redeemQuote({ rule: open, balance: 20, requested: 5, goodsTotal: 100_000 })).toEqual({ points: 5, discount: 5_000, error: null });
  });
});

describe("cộng điểm idempotent trên đơn", () => {
  it("credits a completed order once when sync runs twice", async () => {
    const db = new PrismaClient();
    const stamp = Date.now();
    const user = await db.user.create({
      data: { email: `b26-${stamp}@example.com`, name: "Diem", password: "x" },
    });
    const order = await db.order.create({
      data: {
        orderNumber: `PTTB26${stamp}`,
        userId: user.id,
        status: "COMPLETED",
        paymentStatus: "PAID",
        customerName: "Diem",
        customerPhone: "0901234567",
        address: "1 Nguyen Hue",
        subtotal: 20_000,
        discount: 0,
        total: 20_000,
      },
    });
    await db.loyaltySettings.upsert({
      where: { id: "default" },
      create: { id: "default", enabled: true, pointsPerAmount: 1, amountVnd: 10_000, earnOn: "COMPLETED" },
      update: { enabled: true, pointsPerAmount: 1, amountVnd: 10_000, earnOn: "COMPLETED" },
    });
    try {
      await syncOrderLoyalty(order.id);
      await syncOrderLoyalty(order.id);
      const rows = await db.loyaltyLedger.findMany({ where: { orderId: order.id } });
      expect(rows).toHaveLength(1);
      expect(rows[0]?.delta).toBe(2);
      expect(ledgerBalance(rows)).toBe(2);
    } finally {
      await db.loyaltyLedger.deleteMany({ where: { orderId: order.id } });
      await db.loyaltyAccount.deleteMany({ where: { userId: user.id } });
      await db.order.deleteMany({ where: { id: order.id } });
      await db.user.deleteMany({ where: { id: user.id } });
      await db.loyaltySettings.deleteMany({ where: { id: "default" } });
      await db.$disconnect();
    }
  });
});
