import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { formatVnd } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/dang-nhap");
  if (session.user.role !== "ADMIN") redirect("/");

  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const [
    productCount,
    orderCount,
    pendingOrders,
    customerCount,
    revenue,
    recentOrders,
    dayOrders,
    bestSellerRows,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
      select: { createdAt: true, total: true },
    }),
    prisma.orderItem.groupBy({
      by: ["name"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const byDay = new Map<string, { orders: number; revenue: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    byDay.set(d.toISOString().slice(0, 10), { orders: 0, revenue: 0 });
  }
  for (const o of dayOrders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const cur = byDay.get(key) || { orders: 0, revenue: 0 };
    cur.orders += 1;
    cur.revenue += o.total;
    byDay.set(key, cur);
  }
  const daily = [...byDay.entries()].map(([date, v]) => ({ date, ...v }));
  const maxDayRevenue = Math.max(1, ...daily.map((d) => d.revenue));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            Admin VIZFAS
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Xin chào, {session.user.name || session.user.email}
          </p>
        </div>
        <Link href="/" className="text-sm text-[var(--accent)]">
          Về storefront
        </Link>
      </div>

      <AdminNav current="/admin" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sản phẩm" value={String(productCount)} />
        <Stat label="Đơn hàng" value={String(orderCount)} />
        <Stat label="Chờ xử lý" value={String(pendingOrders)} />
        <Stat label="Doanh thu" value={formatVnd(revenue._sum.total ?? 0)} />
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-3 font-semibold">Doanh thu 14 ngày</h2>
          <div className="flex h-48 items-end gap-1 border border-neutral-100 bg-white p-4">
            {daily.map((d) => (
              <div
                key={d.date}
                className="flex flex-1 flex-col items-center justify-end gap-1"
                title={`${d.date}: ${formatVnd(d.revenue)}`}
              >
                <div
                  className="w-full rounded-t bg-[var(--accent)]"
                  style={{
                    height: `${Math.max(4, (d.revenue / maxDayRevenue) * 100)}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto border border-neutral-100 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Ngày</th>
                  <th className="px-4 py-2 font-medium">Đơn</th>
                  <th className="px-4 py-2 font-medium">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((d) => (
                  <tr key={d.date} className="border-b border-neutral-50">
                    <td className="px-4 py-2">{d.date}</td>
                    <td className="px-4 py-2">{d.orders}</td>
                    <td className="px-4 py-2">{formatVnd(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Khách hàng: {customerCount}
          </p>
        </div>
        <div>
          <h2 className="mb-3 font-semibold">Bán chạy</h2>
          <ul className="space-y-2 border border-neutral-100 bg-white p-4 text-sm">
            {bestSellerRows.map((row) => (
              <li key={row.name} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">{row.name}</span>
                <span className="shrink-0 font-semibold">
                  {row._sum.quantity ?? 0}
                </span>
              </li>
            ))}
            {bestSellerRows.length === 0 ? (
              <li className="text-neutral-500">Chưa có dữ liệu bán</li>
            ) : null}
          </ul>
        </div>
      </section>

      <section className="mt-10 overflow-x-auto border border-neutral-100 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <h2 className="font-semibold">Đơn gần đây</h2>
          <Link href="/admin/orders" className="text-sm text-[var(--accent)]">
            Xem tất cả
          </Link>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Mã đơn</th>
              <th className="px-4 py-3 font-medium">Khách</th>
              <th className="px-4 py-3 font-medium">Tổng</th>
              <th className="px-4 py-3 font-medium">TT</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id} className="border-b border-neutral-50">
                <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                <td className="px-4 py-3">
                  <div>{o.customerName}</div>
                  <div className="text-xs text-neutral-500">
                    {o.customerPhone}
                  </div>
                </td>
                <td className="px-4 py-3">{formatVnd(o.total)}</td>
                <td className="px-4 py-3">{o.paymentMethod}</td>
                <td className="px-4 py-3">
                  {ORDER_STATUS_LABELS[o.status]}
                </td>
              </tr>
            ))}
            {recentOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-neutral-500"
                >
                  Chưa có đơn hàng
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-100 bg-white p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}
