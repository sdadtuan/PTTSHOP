import { describe, expect, it, vi } from "vitest";
import { buildRevenue, countsAsRevenue, csvCell, orderNet, revenueCsv, saigonRange, type RevenueOrder } from "@/lib/revenue";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));

import { GET } from "@/app/api/admin/revenue/route";

function order(patch: Partial<RevenueOrder> & Pick<RevenueOrder, "id" | "status" | "paymentStatus" | "total">): RevenueOrder {
  return {
    orderNumber: patch.id,
    paymentMethod: "COD",
    refundedVnd: 0,
    createdAt: new Date("2026-11-28T03:00:00.000Z"),
    items: [{ name: "Ao", price: patch.total, quantity: 1 }],
    ...patch,
  };
}

const window = saigonRange("2026-11-28", "2026-11-28")!;

function report(orders: RevenueOrder[], extra: Partial<Parameters<typeof buildRevenue>[0]> = {}) {
  return buildRevenue({
    orders,
    carts: [],
    from: window.start,
    to: window.end,
    fromDay: "2026-11-28",
    toDay: "2026-11-28",
    status: null,
    channel: "web",
    sessions: null,
    loyaltyEnabled: false,
    pointsEarned: null,
    pointsRedeemed: null,
    referrals: null,
    ...extra,
  });
}

describe("doanh thu", () => {
  it("counts paid or delivered orders and drops cancel, unpaid and full refunds", () => {
    const paid = order({ id: "paid", status: "PENDING", paymentStatus: "PAID", total: 100_000 });
    const delivered = order({ id: "done", status: "COMPLETED", paymentStatus: "UNPAID", total: 50_000, paymentMethod: "BANK_TRANSFER" });
    const unpaid = order({ id: "open", status: "PENDING", paymentStatus: "UNPAID", total: 20_000 });
    const cancelled = order({ id: "cancel", status: "CANCELLED", paymentStatus: "PAID", total: 80_000 });
    const refunded = order({ id: "back", status: "COMPLETED", paymentStatus: "PAID", total: 40_000, refundedVnd: 40_000 });
    const partial = order({ id: "part", status: "COMPLETED", paymentStatus: "PAID", total: 30_000, refundedVnd: 10_000 });
    expect(countsAsRevenue(unpaid)).toBe(false);
    expect(countsAsRevenue(cancelled)).toBe(false);
    expect(countsAsRevenue(refunded)).toBe(false);
    expect(orderNet(partial)).toBe(20_000);
    const result = report([paid, delivered, unpaid, cancelled, refunded, partial]);
    expect(result.revenue).toBe(170_000);
    expect(result.orderCount).toBe(3);
    expect(result.aov).toBe(Math.round(170_000 / 3));
    expect(result.payments.find((row) => row.method === "BANK_TRANSFER")?.revenue).toBe(50_000);
    expect(result.conversion).toBeNull();
    expect(result.conversionNote).toBe("chưa gắn đo lường");
    expect(result.loyalty).toBeNull();
  });

  it("uses the Asia/Saigon day and ignores a marketplace channel", () => {
    const inside = order({ id: "in", status: "COMPLETED", paymentStatus: "PAID", total: 10_000, createdAt: new Date("2026-11-27T17:00:00.000Z") });
    const outside = order({ id: "out", status: "COMPLETED", paymentStatus: "PAID", total: 99_000, createdAt: new Date("2026-11-27T16:59:59.000Z") });
    expect(report([inside, outside]).revenue).toBe(10_000);
    const market = report([inside], { channel: "san" });
    expect(market.revenue).toBe(0);
    expect(market.channelNote).toMatch(/sàn/);
  });

  it("counts an abandoned cart and escapes spreadsheet formulas", () => {
    const result = report([], {
      carts: [
        { updatedAt: new Date("2026-11-28T03:00:00.000Z"), hasItems: true, orderedAfter: false },
        { updatedAt: new Date("2026-11-28T03:00:00.000Z"), hasItems: true, orderedAfter: true },
        { updatedAt: new Date("2026-11-28T03:00:00.000Z"), hasItems: false, orderedAfter: false },
      ],
    });
    expect(result.abandonedCarts).toBe(1);
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+cmd")).toBe("'+cmd");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell("@sum")).toBe("'@sum");
    const csv = revenueCsv(report([order({ id: "=PTT", status: "COMPLETED", paymentStatus: "PAID", total: 1000 })]));
    expect(csv).toContain("'=PTT");
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("returns 403 for a customer and 401 when signed out", async () => {
    authMock.mockResolvedValue({ user: { id: "customer", role: "CUSTOMER", email: "c@example.com" } });
    expect((await GET(new Request("http://localhost/api/admin/revenue"))).status).toBe(403);
    authMock.mockResolvedValue(null);
    expect((await GET(new Request("http://localhost/api/admin/revenue"))).status).toBe(401);
  });
});
