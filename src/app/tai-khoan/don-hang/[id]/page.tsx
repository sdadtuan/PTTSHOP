import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { formatVnd } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/dang-nhap");

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true },
  });
  if (!order) notFound();

  const steps = ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED"] as const;
  const stepIndex =
    order.status === "CANCELLED"
      ? -1
      : Math.max(0, steps.indexOf(order.status as (typeof steps)[number]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link href="/tai-khoan/don-hang" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← Quay lại đơn hàng
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-extrabold">
        {order.orderNumber}
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        {ORDER_STATUS_LABELS[order.status] || order.status} ·{" "}
        {order.paymentMethod === "COD" ? "COD" : "Chuyển khoản"} ·{" "}
        {order.paymentStatus}
      </p>

      {order.status !== "CANCELLED" ? (
        <ol className="mt-8 grid grid-cols-4 gap-2 text-center text-[11px] sm:text-xs">
          {steps.map((s, i) => (
            <li
              key={s}
              className={
                i <= stepIndex
                  ? "border-b-2 border-[var(--accent)] pb-2 font-semibold text-neutral-900"
                  : "border-b-2 border-neutral-200 pb-2 text-neutral-400"
              }
            >
              {ORDER_STATUS_LABELS[s]}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-6 text-sm text-red-600">Đơn đã hủy.</p>
      )}

      <div className="mt-8 space-y-3 border border-neutral-100 bg-white p-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4 text-sm">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-neutral-500">
                {item.color} / {item.size} × {item.quantity}
              </p>
            </div>
            <p className="font-medium">{formatVnd(item.price * item.quantity)}</p>
          </div>
        ))}
        <div className="border-t border-neutral-100 pt-3 text-sm">
          <div className="flex justify-between">
            <span>Tạm tính</span>
            <span>{formatVnd(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Ship</span>
            <span>{formatVnd(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Giảm</span>
            <span>-{formatVnd(order.discount)}</span>
          </div>
          <div className="mt-2 flex justify-between text-base font-semibold">
            <span>Tổng</span>
            <span className="text-[var(--accent)]">{formatVnd(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-neutral-600">
        <p className="font-semibold text-neutral-900">Giao tới</p>
        <p className="mt-1">{order.customerName}</p>
        <p>{order.customerPhone}</p>
        <p>{order.address}</p>
      </div>
    </div>
  );
}
