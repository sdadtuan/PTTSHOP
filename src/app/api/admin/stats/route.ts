import { handleApiError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();

    const [productCount, orderCount, customerCount, pendingOrders, revenue] =
      await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.aggregate({
          where: { status: { not: "CANCELLED" } },
          _sum: { total: true },
        }),
      ]);

    // Daily revenue for last 14 days (SQLite)
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: { not: "CANCELLED" },
      },
      select: { createdAt: true, total: true },
    });

    const byDay = new Map<string, { orders: number; revenue: number }>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, { orders: 0, revenue: 0 });
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const cur = byDay.get(key) || { orders: 0, revenue: 0 };
      cur.orders += 1;
      cur.revenue += o.total;
      byDay.set(key, cur);
    }

    return jsonOk({
      productCount,
      orderCount,
      customerCount,
      pendingOrders,
      totalRevenue: revenue._sum.total ?? 0,
      daily: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
