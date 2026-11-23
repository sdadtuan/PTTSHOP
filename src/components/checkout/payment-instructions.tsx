"use client";

import { useState } from "react";
import Image from "next/image";
import type { TransferView } from "@/lib/payments/instructions";

export function PaymentInstructions({
  view,
  qrPng,
  hideAccount = false,
}: {
  view: TransferView;
  qrPng: string;
  hideAccount?: boolean;
}) {
  const [copied, setCopied] = useState("");

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
  }

  return (
    <div className="mt-8 border border-neutral-100 bg-white p-5 text-sm" data-testid="bank-transfer-qr">
      <h2 className="text-center font-semibold">Chuyển khoản</h2>
      {view.logoUrl ? (
        <Image src={view.logoUrl} alt={view.bankShortName} width={128} height={32} className="mx-auto mt-3 h-8 w-auto" />
      ) : null}
      <p className="mt-2 text-center font-medium">{view.bankName}</p>
      <Image src={qrPng} alt={`Mã QR ${view.content}`} width={224} height={224} unoptimized className="mx-auto mt-4 w-56" />
      <div className="mt-3 text-center">
        <a href={qrPng} download={`qr-${view.content}.png`} className="text-xs underline">
          Tải ảnh QR
        </a>
      </div>
      <dl className="mt-4 space-y-3">
        {hideAccount ? null : (
          <>
            <Row label="Số tài khoản" value={view.accountNumber} onCopy={() => void copy("stk", view.accountNumber)} copied={copied === "stk"} />
            <Row label="Chủ tài khoản" value={view.accountName} />
            {view.branch ? <Row label="Chi nhánh" value={view.branch} /> : null}
          </>
        )}
        <Row label="Số tiền" value={view.amountLabel} onCopy={() => void copy("amount", view.amountCopy)} copied={copied === "amount"} />
        <Row label="Nội dung" value={view.content} onCopy={() => void copy("content", view.content)} copied={copied === "content"} />
      </dl>
      {view.deadlineLabel ? <p className="mt-4 text-neutral-600">Hạn chuyển khoản: {view.deadlineLabel} (giờ Việt Nam)</p> : null}
      <p className="mt-2 text-neutral-700">{view.note}</p>
    </div>
  );
}

function Row({ label, value, onCopy, copied }: { label: string; value: string; onCopy?: () => void; copied?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <dt className="text-xs text-neutral-500">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
      {onCopy ? (
        <button type="button" onClick={onCopy} className="rounded border border-neutral-300 px-2 py-1 text-xs">
          {copied ? "Đã chép" : "Sao chép"}
        </button>
      ) : null}
    </div>
  );
}
