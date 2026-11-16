import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { formatVnd } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/dang-nhap");
  if (session.user.role !== "ADMIN") redirect("/");

  const [productCount, orderCount, pendingOrders, recentOrders] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { items: true },
      }),
    ]);

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

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Sản phẩm" value={String(productCount)} />
        <Stat label="Đơn hàng" value={String(orderCount)} />
        <Stat label="Chờ xử lý" value={String(pendingOrders)} />
      </div>

      <section className="mt-10 overflow-x-auto border border-neutral-100 bg-white">
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
                <td className="px-4 py-3">{o.status}</td>
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
