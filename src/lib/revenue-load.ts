import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { buildRevenue, defaultSaigonRange, saigonRange, type RevenueCart, type RevenueOrder } from "@/lib/revenue";

const STATUSES = new Set(["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"]);

export async function loadRevenue(search: URLSearchParams, now = new Date()) {
  const fallback = defaultSaigonRange(now);
  const fromDay = search.get("from")?.trim() || fallback.from;
  const toDay = search.get("to")?.trim() || fallback.to;
  const range = saigonRange(fromDay, toDay);
  if (!range) throw new ApiError("Khoảng ngày không hợp lệ", 400);
  const status = search.get("status")?.trim() || null;
  if (status && !STATUSES.has(status)) throw new ApiError("Trạng thái không hợp lệ", 400);
  const channel = search.get("channel")?.trim() || "web";

  const [orders, carts, loyalty] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: range.start, lt: range.end } },
      include: {
        items: { select: { name: true, price: true, quantity: true } },
        refundRequests: { where: { status: "COMPLETED" }, select: { amount: true } },
      },
    }),
    prisma.cart.findMany({
      where: { updatedAt: { gte: range.start, lt: range.end }, items: { some: {} } },
      select: { id: true, userId: true, updatedAt: true },
    }),
    prisma.loyaltySettings.findUnique({ where: { id: "default" } }).catch(() => null),
  ]);

  const userIds = [...new Set(carts.map((cart) => cart.userId).filter((id): id is string => Boolean(id)))];
  const later = userIds.length
    ? await prisma.order.findMany({
        where: { userId: { in: userIds }, status: { not: "CANCELLED" } },
        select: { userId: true, createdAt: true },
      })
    : [];

  const shaped: RevenueOrder[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    total: order.total,
    refundedVnd: order.refundRequests.reduce((sum, refund) => sum + refund.amount, 0),
    createdAt: order.createdAt,
    items: order.items,
  }));
  const cartRows: RevenueCart[] = carts.map((cart) => ({
    updatedAt: cart.updatedAt,
    hasItems: true,
    orderedAfter: later.some((order) => order.userId === cart.userId && order.createdAt > cart.updatedAt),
  }));

  let pointsEarned: number | null = null;
  let pointsRedeemed: number | null = null;
  let referrals: number | null = null;
  if (loyalty?.enabled) {
    const [earned, redeemed, referralCount] = await Promise.all([
      prisma.loyaltyLedger.aggregate({
        where: { reason: "EARN", createdAt: { gte: range.start, lt: range.end } },
        _sum: { delta: true },
      }),
      prisma.loyaltyLedger.aggregate({
        where: { reason: "REDEEM", createdAt: { gte: range.start, lt: range.end } },
        _sum: { delta: true },
      }),
      prisma.referral.count({ where: { createdAt: { gte: range.start, lt: range.end } } }),
    ]);
    pointsEarned = earned._sum.delta ?? 0;
    pointsRedeemed = Math.abs(redeemed._sum.delta ?? 0);
    referrals = referralCount;
  }

  return buildRevenue({
    orders: shaped,
    carts: cartRows,
    from: range.start,
    to: range.end,
    fromDay,
    toDay,
    status,
    channel,
    sessions: null,
    loyaltyEnabled: loyalty?.enabled === true,
    pointsEarned,
    pointsRedeemed,
    referrals,
  });
}
