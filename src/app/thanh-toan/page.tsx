"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-context";
import { formatVnd } from "@/lib/format";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER">(
    "COD",
  );
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Chưa có sản phẩm để thanh toán</h1>
        <Link href="/san-pham" className="mt-6 inline-block text-[var(--accent)]">
          Quay lại mua sắm
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= 500000 ? 0 : 30000;
  const total = Math.max(0, subtotal + shipping - discount);

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
      note: String(form.get("note") || ""),
      paymentMethod,
      couponCode: couponCode || undefined,
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
      router.push(`/dat-hang-thanh-cong?order=${data.orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        Thanh toán
      </h1>

      <form
        onSubmit={onSubmit}
        className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_0.9fr]"
      >
        <div className="min-w-0 space-y-5 border border-neutral-100 bg-white p-6">
          <h2 className="font-semibold">Thông tin giao hàng</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ tên" name="name" required />
            <Field label="Số điện thoại" name="phone" required />
          </div>
          <Field label="Email" name="email" type="email" />
          <Field label="Địa chỉ" name="address" required />
          <label className="block text-sm">
            <span className="mb-1.5 block text-neutral-600">Ghi chú</span>
            <textarea
              name="note"
              rows={3}
              className="w-full rounded border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium">Phương thức thanh toán</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 border border-neutral-200 p-3 text-sm">
                <input
                  type="radio"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
                Thanh toán khi nhận hàng (COD)
              </label>
              <label className="flex items-center gap-3 border border-neutral-200 p-3 text-sm">
                <input
                  type="radio"
                  checked={paymentMethod === "BANK_TRANSFER"}
                  onChange={() => setPaymentMethod("BANK_TRANSFER")}
                />
                Chuyển khoản ngân hàng
              </label>
            </div>
          </div>
        </div>

        <aside className="h-fit min-w-0 border border-neutral-100 bg-white p-6">
          <h2 className="font-semibold">Đơn hàng ({items.length})</h2>
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
              placeholder="Mã giảm giá"
              className="min-w-0 flex-1 rounded border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
            <button
              type="button"
              onClick={() => void applyCoupon()}
              className="rounded border border-neutral-900 px-3 py-2 text-xs font-semibold"
            >
              Áp dụng
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
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded bg-[var(--accent)] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Đặt hàng"}
          </button>
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
