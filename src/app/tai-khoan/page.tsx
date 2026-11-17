import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatVnd } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/dang-nhap?callbackUrl=/tai-khoan");

  const [user, orders, addressCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.address.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
        Tài khoản
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Xin chào, {user?.name || user?.email}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/tai-khoan/don-hang"
          className="border border-neutral-100 bg-white p-5 transition hover:border-neutral-300"
        >
          <p className="text-sm font-semibold">Đơn hàng</p>
          <p className="mt-1 text-2xl font-bold">{orders.length}+</p>
        </Link>
        <Link
          href="/tai-khoan/dia-chi"
          className="border border-neutral-100 bg-white p-5 transition hover:border-neutral-300"
        >
          <p className="text-sm font-semibold">Sổ địa chỉ</p>
          <p className="mt-1 text-2xl font-bold">{addressCount}</p>
        </Link>
        <Link
          href="/yeu-thich"
          className="border border-neutral-100 bg-white p-5 transition hover:border-neutral-300"
        >
          <p className="text-sm font-semibold">Yêu thích</p>
          <p className="mt-1 text-sm text-neutral-500">Xem danh sách</p>
        </Link>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Đơn gần đây</h2>
          <Link href="/tai-khoan/don-hang" className="text-sm text-[var(--accent)]">
            Xem tất cả
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-neutral-500">Chưa có đơn hàng.</p>
        ) : (
          <div className="overflow-x-auto border border-neutral-100 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Mã</th>
                  <th className="px-4 py-2 font-medium">Trạng thái</th>
                  <th className="px-4 py-2 font-medium">Tổng</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-neutral-50">
                    <td className="px-4 py-2">
                      <Link
                        href={`/tai-khoan/don-hang/${o.id}`}
                        className="font-medium hover:text-[var(--accent)]"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {ORDER_STATUS_LABELS[o.status] || o.status}
                    </td>
                    <td className="px-4 py-2">{formatVnd(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
