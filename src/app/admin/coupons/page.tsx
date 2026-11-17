"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrder: number;
  usedCount: number;
  maxUses: number | null;
  isActive: boolean;
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Lỗi");
    else setCoupons(data.coupons || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: String(form.get("code") || ""),
        description: String(form.get("description") || ""),
        discountType: String(form.get("discountType") || "PERCENT"),
        discountValue: Number(form.get("discountValue") || 0),
        minOrder: Number(form.get("minOrder") || 0),
        maxUses: form.get("maxUses")
          ? Number(form.get("maxUses"))
          : null,
        isActive: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Tạo thất bại");
      return;
    }
    e.currentTarget.reset();
    await load();
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Xóa mã?")) return;
    await fetch("/api/admin/coupons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        Mã giảm giá
      </h1>
      <AdminNav current="/admin/coupons" />
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <form onSubmit={onCreate} className="mt-6 grid gap-2 sm:grid-cols-3">
        <input name="code" required placeholder="CODE" className="rounded border px-3 py-2 text-sm" />
        <input name="description" placeholder="Mô tả" className="rounded border px-3 py-2 text-sm" />
        <select name="discountType" className="rounded border px-3 py-2 text-sm">
          <option value="PERCENT">PERCENT</option>
          <option value="FIXED">FIXED</option>
        </select>
        <input name="discountValue" type="number" required placeholder="Giá trị" className="rounded border px-3 py-2 text-sm" />
        <input name="minOrder" type="number" defaultValue={0} placeholder="Đơn tối thiểu" className="rounded border px-3 py-2 text-sm" />
        <input name="maxUses" type="number" placeholder="Max uses" className="rounded border px-3 py-2 text-sm" />
        <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm text-white sm:col-span-3">
          Thêm mã
        </button>
      </form>
      <ul className="mt-6 divide-y border border-neutral-100 bg-white">
        {coupons.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <div>
              <p className="font-medium">
                {c.code}{" "}
                <span className="text-neutral-500">
                  ({c.discountType} {c.discountValue})
                </span>
              </p>
              <p className="text-xs text-neutral-500">
                Đã dùng {c.usedCount}
                {c.maxUses != null ? `/${c.maxUses}` : ""} · min {c.minOrder}đ
                {!c.isActive ? " · OFF" : ""}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void toggle(c.id, !c.isActive)}
                className="text-xs text-[var(--accent)]"
              >
                {c.isActive ? "Tắt" : "Bật"}
              </button>
              <button
                type="button"
                onClick={() => void remove(c.id)}
                className="text-xs text-red-600"
              >
                Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
