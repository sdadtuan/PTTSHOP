export const REVENUE_DEFINITION =
  "Doanh thu mặc định gồm đơn đã thanh toán hoặc đã giao, trừ đơn hủy và phần đã hoàn. Thời gian theo giờ Asia/Saigon. Kênh web.";

export const CONVERSION_UNMEASURED = "chưa gắn đo lường";

const SAIGON_OFFSET_MS = 7 * 60 * 60 * 1000;
const STATUSES = ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"] as const;

export type RevenueOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  refundedVnd: number;
  createdAt: Date;
  items: { name: string; price: number; quantity: number }[];
};

export type RevenueCart = {
  updatedAt: Date;
  hasItems: boolean;
  orderedAfter: boolean;
};

export function saigonDay(date: Date) {
  return new Date(date.getTime() + SAIGON_OFFSET_MS).toISOString().slice(0, 10);
}

export function defaultSaigonRange(now = new Date()) {
  const to = saigonDay(now);
  const start = new Date(`${to}T00:00:00+07:00`);
  start.setUTCDate(start.getUTCDate() - 29);
  return { from: saigonDay(start), to };
}

export function saigonRange(fromDay: string, toDay: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDay) || !/^\d{4}-\d{2}-\d{2}$/.test(toDay) || fromDay > toDay) return null;
  const start = new Date(`${fromDay}T00:00:00+07:00`);
  const end = new Date(`${toDay}T00:00:00+07:00`);
  end.setUTCDate(end.getUTCDate() + 1);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
}

export function orderNet(order: Pick<RevenueOrder, "total" | "refundedVnd">) {
  return Math.max(0, order.total - Math.max(0, order.refundedVnd));
}

export function countsAsRevenue(order: RevenueOrder) {
  if (order.status === "CANCELLED") return false;
  if (order.paymentStatus !== "PAID" && order.status !== "COMPLETED") return false;
  return orderNet(order) > 0;
}

export function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  if (/[",\n\r]/.test(guarded)) return `"${guarded.replace(/"/g, '""')}"`;
  return guarded;
}

export type RevenueReport = ReturnType<typeof buildRevenue>;

export function buildRevenue(input: {
  orders: RevenueOrder[];
  carts: RevenueCart[];
  from: Date;
  to: Date;
  fromDay: string;
  toDay: string;
  status: string | null;
  channel: string | null;
  sessions: number | null;
  loyaltyEnabled: boolean;
  pointsEarned: number | null;
  pointsRedeemed: number | null;
  referrals: number | null;
}) {
  const channel = (input.channel || "web").trim().toLowerCase() || "web";
  const base = {
    definition: REVENUE_DEFINITION,
    from: input.fromDay,
    to: input.toDay,
    channel,
    channelNote: null as string | null,
    revenue: 0,
    orderCount: 0,
    aov: null as number | null,
    conversion: null as number | null,
    conversionNote: input.sessions == null || input.sessions <= 0 ? CONVERSION_UNMEASURED : null,
    abandonedCarts: 0,
    statuses: [] as { status: string; count: number }[],
    payments: [] as { method: string; revenue: number; count: number }[],
    topProducts: [] as { name: string; quantity: number; revenue: number }[],
    loyalty: input.loyaltyEnabled
      ? { pointsEarned: input.pointsEarned, pointsRedeemed: input.pointsRedeemed, referrals: input.referrals }
      : null,
    orders: [] as { orderNumber: string; status: string; paymentStatus: string; paymentMethod: string; total: number; refundedVnd: number; net: number }[],
  };
  if (channel !== "web") {
    return { ...base, channelNote: "Kênh sàn chưa có ở giai đoạn này." };
  }
  const inWindow = input.orders.filter((order) => order.createdAt >= input.from && order.createdAt < input.to);
  const filtered = input.status ? inWindow.filter((order) => order.status === input.status) : inWindow;
  const revenueOrders = filtered.filter(countsAsRevenue);
  const revenue = revenueOrders.reduce((sum, order) => sum + orderNet(order), 0);
  const payments = new Map<string, { method: string; revenue: number; count: number }>();
  const products = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of revenueOrders) {
    const net = orderNet(order);
    const pay = payments.get(order.paymentMethod) || { method: order.paymentMethod, revenue: 0, count: 0 };
    pay.revenue += net;
    pay.count += 1;
    payments.set(order.paymentMethod, pay);
    for (const item of order.items) {
      const row = products.get(item.name) || { name: item.name, quantity: 0, revenue: 0 };
      row.quantity += item.quantity;
      row.revenue += item.price * item.quantity;
      products.set(item.name, row);
    }
  }
  const statuses = new Map<string, number>();
  for (const status of STATUSES) statuses.set(status, 0);
  for (const order of filtered) statuses.set(order.status, (statuses.get(order.status) || 0) + 1);
  const abandonedCarts = input.carts.filter(
    (cart) => cart.hasItems && !cart.orderedAfter && cart.updatedAt >= input.from && cart.updatedAt < input.to,
  ).length;
  const conversion = input.sessions != null && input.sessions > 0
    ? Math.round((revenueOrders.length / input.sessions) * 1000) / 10
    : null;
  return {
    ...base,
    revenue,
    orderCount: revenueOrders.length,
    aov: revenueOrders.length > 0 ? Math.round(revenue / revenueOrders.length) : null,
    conversion,
    conversionNote: conversion == null ? CONVERSION_UNMEASURED : null,
    abandonedCarts,
    statuses: [...statuses.entries()].filter(([, count]) => count > 0).map(([status, count]) => ({ status, count })),
    payments: [...payments.values()].sort((a, b) => b.revenue - a.revenue),
    topProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    orders: revenueOrders.map((order) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total,
      refundedVnd: order.refundedVnd,
      net: orderNet(order),
    })),
  };
}

export function revenueCsv(report: RevenueReport) {
  const lines = [
    ["dinh_nghia", report.definition],
    ["tu_ngay", report.from],
    ["den_ngay", report.to],
    ["doanh_thu", report.revenue],
    ["so_don", report.orderCount],
    ["aov", report.aov ?? ""],
    ["chuyen_doi", report.conversionNote || report.conversion],
    ["gio_bo_do", report.abandonedCarts],
    ["ma_don", "trang_thai", "thanh_toan", "phuong_thuc", "tong", "hoan", "doanh_thu_don"],
    ...report.orders.map((order) => [
      order.orderNumber,
      order.status,
      order.paymentStatus,
      order.paymentMethod,
      order.total,
      order.refundedVnd,
      order.net,
    ]),
  ];
  return `\uFEFF${lines.map((line) => line.map(csvCell).join(",")).join("\n")}\n`;
}
