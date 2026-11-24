"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-context";
import { useStorefrontUi } from "@/components/cms/storefront-layout-context";
import { ConsentFields, consentsFromForm } from "@/components/legal/consent-fields";
import { formatVnd } from "@/lib/format";
import { codCeilingNotice } from "@/lib/payments/policy";

type PaymentOptions = {
  codEnabled: boolean;
  codMaxAmount: number;
  bankReady: boolean;
  payosEnabled: boolean;
};

export function CheckoutForm({ initialOptions }: { initialOptions: PaymentOptions }) {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"" | "COD" | "BANK_TRANSFER" | "PAYOS">("");
  const [options, setOptions] = useState<PaymentOptions>(initialOptions);
  const [provinces, setProvinces] = useState<{ code: string; name: string }[]>([]);
  const [wards, setWards] = useState<{ code: string; name: string }[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const ck = useStorefrontUi().checkout;

  useEffect(() => {
    void fetch("/api/payments/options")
      .then((res) => res.json())
      .then((data) => {
        setOptions({
          codEnabled: Boolean(data.codEnabled),
          codMaxAmount: Number(data.codMaxAmount) || 0,
          bankReady: Boolean(data.bankReady),
          payosEnabled: Boolean(data.payosEnabled),
        });
      })
      .catch(() => setOptions(initialOptions));
    void fetch("/api/address")
      .then((res) => res.json())
      .then((data) => setProvinces(data.provinces || []))
      .catch(() => setProvinces([]));
  }, [initialOptions]);

  useEffect(() => {
    if (!provinceCode) return;
    void fetch(`/api/address?province=${encodeURIComponent(provinceCode)}`)
      .then((res) => res.json())
      .then((data) => setWards(data.wards || []))
      .catch(() => setWards([]));
  }, [provinceCode]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="type-title text-2xl font-bold">{ck.emptyTitle}</h1>
        <Link href="/san-pham" className="mt-6 inline-block text-[var(--accent)]">
          {ck.emptyCta}
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= 500000 ? 0 : 30000;
  const total = Math.max(0, subtotal + shipping - discount);
  const codAllowed = Boolean(options.codEnabled && total <= options.codMaxAmount);
  const payosAllowed = Boolean(options.payosEnabled);
  const codLimitNote = codCeilingNotice(total, options);
  const selected =
    paymentMethod === "PAYOS" && payosAllowed
      ? "PAYOS"
      : paymentMethod === "BANK_TRANSFER"
        ? "BANK_TRANSFER"
        : paymentMethod === "COD" && codAllowed
          ? "COD"
          : codAllowed
            ? "COD"
            : "BANK_TRANSFER";

  async function applyCoupon() {
    setCouponMsg("");
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, subtotal }),
    });
    const data = await res.json();
    if (!res.ok || !data.valid) {
      setDiscount(0);
      setCouponMsg(data.error || "Mã không hợp lệ");
      return;
    }
    setDiscount(data.discount || 0);
    setCouponMsg(data.description || `Giảm ${formatVnd(data.discount)}`);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      customerName: String(form.get("name") || ""),
      customerPhone: String(form.get("phone") || ""),
      customerEmail: String(form.get("email") || ""),
      address: String(form.get("address") || ""),
      provinceCode: String(form.get("provinceCode") || ""),
      wardCode: String(form.get("wardCode") || ""),
      note: String(form.get("note") || ""),
      paymentMethod: selected,
      invoiceCompanyName: String(form.get("invoiceCompanyName") || ""),
      invoiceTaxCode: String(form.get("invoiceTaxCode") || ""),
      invoiceAddress: String(form.get("invoiceAddress") || ""),
      invoiceEmail: String(form.get("invoiceEmail") || ""),
      couponCode: couponCode || undefined,
      consents: consentsFromForm(form),
      items: items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tạo được đơn");
      clear();
      const token = data.receiptToken ? `&token=${encodeURIComponent(data.receiptToken)}` : "";
      router.push(`/dat-hang-thanh-cong?order=${encodeURIComponent(data.orderNumber)}${token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="type-title text-3xl font-bold">
        {ck.title}
      </h1>

      <form
        onSubmit={onSubmit}
        className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_0.9fr]"
      >
        <div className="min-w-0 space-y-5 border border-neutral-100 bg-white p-6">
          <h2 className="font-semibold">{ck.shippingSectionTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={ck.fieldName} name="name" required />
            <Field label={ck.fieldPhone} name="phone" required />
          </div>
          <Field label={ck.fieldEmail} name="email" type="email" />
          <Field label="Số nhà, đường" name="address" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block text-neutral-600">Tỉnh / thành phố</span>
              <select
                name="provinceCode"
                required
                value={provinceCode}
                onChange={(e) => setProvinceCode(e.target.value)}
                className="w-full rounded border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
              >
                <option value="">Chọn tỉnh</option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.code}>{province.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-neutral-600">Phường / xã</span>
              <select
                name="wardCode"
                required
                className="w-full rounded border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
              >
                <option value="">Chọn phường/xã</option>
                {wards.map((ward) => (
                  <option key={ward.code} value={ward.code}>{ward.name}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block text-neutral-600">{ck.fieldNote}</span>
            <textarea
              name="note"
              rows={3}
              className="w-full rounded border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
            />
          </label>

          <details className="text-sm">
            <summary className="cursor-pointer font-medium">Yêu cầu hoá đơn công ty</summary>
            <div className="mt-3 grid gap-3">
              <Field label="Tên công ty" name="invoiceCompanyName" />
              <Field label="Mã số thuế" name="invoiceTaxCode" />
              <Field label="Địa chỉ hoá đơn" name="invoiceAddress" />
              <Field label="Email nhận hoá đơn" name="invoiceEmail" type="email" />
            </div>
          </details>

          <div>
            <p className="mb-2 text-sm font-medium">{ck.paymentSectionTitle}</p>
            <div className="space-y-2">
              {codAllowed ? (
                <label className="flex items-center gap-3 border border-neutral-200 p-3 text-sm">
                  <input type="radio" checked={selected === "COD"} onChange={() => setPaymentMethod("COD")} />
                  {ck.paymentCod}
                </label>
              ) : null}
              {codLimitNote ? <p className="text-sm text-neutral-600">{codLimitNote}</p> : null}
              <label className="flex items-center gap-3 border border-neutral-200 p-3 text-sm">
                <input type="radio" checked={selected === "BANK_TRANSFER"} onChange={() => setPaymentMethod("BANK_TRANSFER")} />
                <span>
                  {ck.paymentBank}
                  {!options.bankReady ? (
                    <span className="mt-1 block text-xs text-red-600">Tài khoản nhận tiền chưa được cấu hình. Đơn chuyển khoản sẽ chưa đặt được.</span>
                  ) : null}
                </span>
              </label>
              {payosAllowed ? (
                <label className="flex items-center gap-3 border border-neutral-200 p-3 text-sm">
                  <input type="radio" checked={selected === "PAYOS"} onChange={() => setPaymentMethod("PAYOS")} />
                  payOS
                </label>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="h-fit min-w-0 border border-neutral-100 bg-white p-6">
          <h2 className="font-semibold">
            {ck.orderSummaryTitle} ({items.length})
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((i) => (
              <li key={i.variantId} className="flex justify-between gap-3">
                <span className="text-neutral-600">
                  {i.name} × {i.quantity}
                  <span className="block text-xs text-neutral-400">
                    {i.color} / {i.size}
                  </span>
                </span>
                <span className="font-medium">
                  {formatVnd(i.price * i.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder={ck.couponPlaceholder}
              className="min-w-0 flex-1 rounded border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
            <button
              type="button"
              onClick={() => void applyCoupon()}
              className="rounded border border-neutral-900 px-3 py-2 text-xs font-semibold"
            >
              {ck.couponApply}
            </button>
          </div>
          {couponMsg ? (
            <p className="mt-2 text-xs text-neutral-600">{couponMsg}</p>
          ) : null}

          <div className="mt-5 space-y-2 border-t border-neutral-100 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Tạm tính</span>
              <span>{formatVnd(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Ship</span>
              <span>{shipping === 0 ? "Miễn phí" : formatVnd(shipping)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-emerald-700">
                <span>Giảm giá</span>
                <span>-{formatVnd(discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-semibold">
              <span>Tổng</span>
              <span>{formatVnd(total)}</span>
            </div>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          ) : null}
          <div className="mt-4">
            <ConsentFields />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded bg-[var(--accent)] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? ck.submitLoading : ck.submitLabel}
          </button>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">
            Dữ liệu đơn được dùng để xuất hóa đơn và chứng từ theo nghĩa vụ pháp luật.{" "}
            <Link href="/chinh-sach-bao-mat" className="underline">
              Chính sách bảo mật
            </Link>
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-neutral-600">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
      />
    </label>
  );
}
