"use client";

import { FormEvent, useState } from "react";
import QRCode from "qrcode";
import { PaymentInstructions } from "@/components/checkout/payment-instructions";
import type { TransferView } from "@/lib/payments/instructions";
import { formatVnd } from "@/lib/format";

export default function LookupOrderPage() {
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    transfer: TransferView | null;
    qrPng: string;
  } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/orders/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: String(form.get("orderNumber") || ""),
        phone: String(form.get("phone") || ""),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResult(null);
      setError(data.error || "Không tìm thấy đơn");
      return;
    }
    const qrPng = data.transfer ? await QRCode.toDataURL(data.transfer.qrPayload, { margin: 1, width: 280 }) : "";
    setResult({ ...data, qrPng });
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="type-title text-3xl font-bold">Tra cứu đơn</h1>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-3">
        <input name="orderNumber" required placeholder="Mã đơn" className="w-full rounded border border-neutral-200 px-3 py-2" />
        <input name="phone" required placeholder="Số điện thoại đặt hàng" className="w-full rounded border border-neutral-200 px-3 py-2" />
        <button type="submit" className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">Xem đơn</button>
      </form>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {result ? (
        <div className="mt-6 text-sm">
          <p className="font-semibold">{result.orderNumber}</p>
          <p className="text-neutral-600">{result.status} · {result.paymentStatus} · {formatVnd(result.total)}</p>
          {result.transfer ? <PaymentInstructions view={result.transfer} qrPng={result.qrPng} /> : null}
        </div>
      ) : null}
    </div>
  );
}
