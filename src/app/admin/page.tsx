import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, ShoppingBag, Users, Banknote } from "lucide-react";
import { auth } from "@/auth";
import {
  AdminBadge,
  AdminCard,
  AdminKpiCard,
  AdminPageHeader,
  AdminTable,
  AdminTd,
  AdminTh,
  AdminTr,
  orderStatusTone,
} from "@/components/admin/ui";
import { formatVnd } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/dang-nhap?callbackUrl=/admin");
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
  const maxBest = Math.max(1, ...bestSellerRows.map((r) => r._sum.quantity ?? 0));

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description={`Xin chào, ${session.user.name || session.user.email}`}
        breadcrumbs={[{ href: "/admin", label: "Admin" }, { label: "Dashboard" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard label="Doanh thu" value={formatVnd(revenue._sum.total ?? 0)} hint="Đơn chưa hủy" icon={<Banknote className="h-5 w-5" />} />
        <AdminKpiCard label="Đơn hàng" value={String(orderCount)} hint={`${pendingOrders} chờ xử lý`} icon={<ShoppingBag className="h-5 w-5" />} />
        <AdminKpiCard label="Khách hàng" value={String(customerCount)} icon={<Users className="h-5 w-5" />} />
        <AdminKpiCard label="Sản phẩm" value={String(productCount)} icon={<Package className="h-5 w-5" />} />
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <AdminCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Doanh thu 14 ngày</h2>
            <span className="text-xs text-[var(--admin-text-muted)]">Hover cột để xem chi tiết</span>
          </div>
          <div className="flex h-52 items-end gap-1.5 rounded-[var(--admin-radius-md)] bg-[var(--admin-surface-muted)]/60 p-4">
            {daily.map((d) => (
              <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end" title={`${d.date}: ${formatVnd(d.revenue)} · ${d.orders} đơn`}>
                <div className="w-full rounded-t-md bg-gradient-to-t from-[var(--admin-accent-hover)] to-[var(--admin-accent)] transition group-hover:opacity-90" style={{ height: `${Math.max(6, (d.revenue / maxDayRevenue) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-[var(--admin-text-muted)]">
                  <th className="pb-2 font-medium">Ngày</th>
                  <th className="pb-2 font-medium">Đơn</th>
                  <th className="pb-2 font-medium">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {daily.slice(-7).map((d) => (
                  <tr key={d.date} className="border-t border-[var(--admin-border)]/70">
                    <td className="py-2">{d.date}</td>
                    <td className="py-2">{d.orders}</td>
                    <td className="py-2 font-medium">{formatVnd(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="mb-4 font-semibold">Bán chạy</h2>
          {bestSellerRows.length === 0 ? (
            <p className="text-sm text-[var(--admin-text-muted)]">Chưa có dữ liệu bán</p>
          ) : (
            <ul className="space-y-4">
              {bestSellerRows.map((row) => {
                const qty = row._sum.quantity ?? 0;
                return (
                  <li key={row.name}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium">{row.name}</span>
                      <span className="shrink-0 text-[var(--admin-text-muted)]">{qty} sp</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--admin-surface-muted)]">
                      <div className="h-full rounded-full bg-[var(--admin-accent)]" style={{ width: `${(qty / maxBest) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Đơn gần đây</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-[var(--admin-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/30">
            Xem tất cả
          </Link>
        </div>
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Mã đơn</AdminTh>
              <AdminTh>Khách</AdminTh>
              <AdminTh>Tổng</AdminTh>
              <AdminTh>TT</AdminTh>
              <AdminTh>Trạng thái</AdminTh>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <AdminTr key={o.id}>
                <AdminTd className="font-medium">{o.orderNumber}</AdminTd>
                <AdminTd>
                  <div>{o.customerName}</div>
                  <div className="text-xs text-[var(--admin-text-muted)]">{o.customerPhone}</div>
                </AdminTd>
                <AdminTd>{formatVnd(o.total)}</AdminTd>
                <AdminTd>{o.paymentMethod}</AdminTd>
                <AdminTd>
                  <AdminBadge tone={orderStatusTone(o.status)}>{ORDER_STATUS_LABELS[o.status]}</AdminBadge>
                </AdminTd>
              </AdminTr>
            ))}
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--admin-text-muted)]">Chưa có đơn hàng</td>
              </tr>
            ) : null}
          </tbody>
        </AdminTable>
      </section>
    </div>
  );
}
