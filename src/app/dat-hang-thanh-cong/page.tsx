import Link from "next/link";
import { cookies } from "next/headers";
import QRCode from "qrcode";
import { PaymentInstructions } from "@/components/checkout/payment-instructions";
import { PurchaseBeacon } from "@/components/legal/purchase-beacon";
import { formatVnd } from "@/lib/format";
import { orderReceipt } from "@/lib/order-receipt";
import { canShowReceipt, RECEIPT_COOKIE } from "@/lib/order-receipt-token";
import { transferView } from "@/lib/payments/instructions";
import { getPaymentConfig } from "@/lib/payments/store";
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
  const transfer = row && allowed && row.paymentMethod === "BANK_TRANSFER"
    ? transferView({
        config: await getPaymentConfig(),
        amount: row.total,
        orderNumber: row.orderNumber,
        dueAt: row.paymentDueAt,
      })
    : null;
  const qrPng = transfer ? await QRCode.toDataURL(transfer.qrPayload, { margin: 1, width: 280 }) : "";
  const payosQr = row && allowed && row.paymentMethod === "PAYOS" && row.payosQr
    ? await QRCode.toDataURL(row.payosQr, { margin: 1, width: 280 })
    : "";
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

  if (!allowed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="type-title text-3xl font-bold">Không xem được biên nhận</h1>
        <p className="mt-4 text-sm text-neutral-600">
          Liên kết biên nhận đã hết hạn hoặc thiếu mã xác thực. Vui lòng tra cứu đơn hàng bằng mã đơn và số điện thoại đặt hàng.
        </p>
        <Link
          href="/tra-cuu-don"
          className="mt-8 inline-block rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
        >
          Tra cứu đơn hàng
        </Link>
      </div>
    );
  }

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

      {transfer ? <PaymentInstructions view={transfer} qrPng={qrPng} /> : null}
      {payosQr && row?.paymentDueAt ? (
        <PaymentInstructions
          view={{
            bankName: "payOS",
            bankShortName: "payOS",
            logoUrl: null,
            accountNumber: "",
            accountName: "",
            branch: null,
            amountLabel: formatVnd(row.total),
            amountCopy: String(row.total),
            content: row.orderNumber,
            qrPayload: row.payosQr || "",
            deadlineLabel: new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }).format(row.paymentDueAt),
            note: "Đơn được xác nhận sau khi PTT Shop nhận đủ tiền",
          }}
          qrPng={payosQr}
          hideAccount
        />
      ) : null}

      {receipt && row ? (
        <>
          <PurchaseBeacon orderNumber={row.orderNumber} value={row.total} />
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
        </>
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
