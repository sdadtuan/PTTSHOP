import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { formatVnd } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/dang-nhap?callbackUrl=/tai-khoan/don-hang");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="mb-6 flex items-center gap-3 text-sm text-neutral-500">
        <Link href="/tai-khoan" className="hover:text-neutral-800">
          Tài khoản
        </Link>
        <span>/</span>
        <span className="text-neutral-800">Đơn hàng</span>
      </div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
        Lịch sử đơn hàng
      </h1>

      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          Chưa có đơn.{" "}
          <Link href="/san-pham" className="text-[var(--accent)]">
            Mua sắm ngay
          </Link>
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => (
            <li
              key={o.id}
              className="border border-neutral-100 bg-white p-4 md:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/tai-khoan/don-hang/${o.id}`}
                    className="font-semibold hover:text-[var(--accent)]"
                  >
                    {o.orderNumber}
                  </Link>
                  <p className="mt-1 text-xs text-neutral-500">
                    {o.createdAt.toLocaleString("vi-VN")} · {o.items.length} sản phẩm
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {ORDER_STATUS_LABELS[o.status] || o.status}
                  </p>
                  <p className="mt-1 font-semibold text-[var(--accent)]">
                    {formatVnd(o.total)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
