import Link from "next/link";
import { cookies } from "next/headers";
import { formatVnd } from "@/lib/format";
import { orderReceipt } from "@/lib/order-receipt";
import { canShowReceipt, RECEIPT_COOKIE } from "@/lib/order-receipt-token";
import { prisma } from "@/lib/prisma";
import { displayBrandName } from "@/lib/public-brand";
import { getStorefrontUi } from "@/lib/storefront/ui-copy";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ order?: string; token?: string }>;
};

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { order, token } = await searchParams;
  const ui = (await getStorefrontUi()).orderSuccess;
  const jar = await cookies();
  const cookieToken = jar.get(RECEIPT_COOKIE)?.value?.split(".").slice(1).join(".") || null;
  const cookieOrder = jar.get(RECEIPT_COOKIE)?.value?.split(".")[0];
  const row = order
    ? await prisma.order.findUnique({
        where: { orderNumber: order },
        include: { items: true },
      })
    : null;
  const allowed = Boolean(
    row &&
      canShowReceipt(row.receiptTokenHash, [
        token,
        cookieOrder === row.orderNumber ? cookieToken : null,
      ]),
  );
  const receipt = row && allowed
    ? orderReceipt({
        orderNumber: row.orderNumber,
        paymentMethod: row.paymentMethod,
        subtotal: row.subtotal,
        shippingFee: row.shippingFee,
        discount: row.discount,
        total: row.total,
        items: row.items,
      })
    : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <p className="text-center text-sm tracking-[0.25em] text-[var(--accent)] uppercase">{displayBrandName(ui.eyebrow)}</p>
      <h1 className="mt-3 text-center type-title text-3xl font-bold">{ui.title}</h1>
      {order ? (
        <p className="mt-3 text-center text-neutral-600">
          {ui.orderLabel}{" "}
          <span className="font-semibold text-neutral-900">{order}</span>
        </p>
      ) : null}
      <p className="mt-2 text-center text-sm text-neutral-500">{ui.body}</p>

      {receipt ? (
        <div className="mt-8 border border-neutral-100 bg-white p-5 text-sm">
          <ul className="space-y-3">
            {receipt.lines.map((line, index) => (
              <li key={`${line.label}-${index}`} className="flex justify-between gap-3">
                <span className="text-neutral-700">{line.label}</span>
                <span className="font-medium">{formatVnd(line.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
            <div className="flex justify-between">
              <span className="text-neutral-500">Tạm tính</span>
              <span>{formatVnd(receipt.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Phí ship</span>
              <span>{receipt.shippingFee === 0 ? "Miễn phí" : formatVnd(receipt.shippingFee)}</span>
            </div>
            {receipt.discount > 0 ? (
              <div className="flex justify-between">
                <span className="text-neutral-500">Giảm giá</span>
                <span>-{formatVnd(receipt.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between font-semibold">
              <span>Tổng</span>
              <span>{formatVnd(receipt.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Thanh toán</span>
              <span>{receipt.paymentLabel}</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/san-pham"
          className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
        >
          {ui.ctaShop}
        </Link>
        <Link
          href="/"
          className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold"
        >
          {ui.ctaHome}
        </Link>
      </div>
    </div>
  );
}
