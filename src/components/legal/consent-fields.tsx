"use client";

import Link from "next/link";
import type { ConsentGrant } from "@/lib/consent";

export function ConsentFields() {
  return (
    <fieldset className="space-y-2 text-sm text-neutral-700">
      <label className="flex items-start gap-2">
        <input className="mt-1" type="checkbox" name="consentDelivery" required />
        <span>
          Tôi đồng ý dùng họ tên, số điện thoại, email và địa chỉ để giao hàng và liên hệ về đơn.{" "}
          <Link href="/chinh-sach-bao-mat" className="underline">
            Chính sách bảo mật
          </Link>
        </span>
      </label>
      <label className="flex items-start gap-2">
        <input className="mt-1" type="checkbox" name="consentInvoice" required />
        <span>Tôi đồng ý dùng dữ liệu trên để xuất chứng từ.</span>
      </label>
      <label className="flex items-start gap-2">
        <input className="mt-1" type="checkbox" name="consentMarketing" />
        <span>Tôi muốn nhận tin khuyến mãi. Mục này không bắt buộc.</span>
      </label>
    </fieldset>
  );
}

export function consentsFromForm(form: FormData): ConsentGrant[] {
  return [
    { purpose: "delivery", granted: form.get("consentDelivery") === "on" },
    { purpose: "invoice", granted: form.get("consentInvoice") === "on" },
    { purpose: "marketing", granted: form.get("consentMarketing") === "on" },
  ];
}
