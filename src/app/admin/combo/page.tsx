"use client";

import { FormEvent, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, useAdminToast } from "@/components/admin/ui";

type Row = {
  id: string;
  title: string;
  slug: string;
  priceMode: string;
  priceVnd: number | null;
  percentOff: number | null;
  isPublished: boolean;
};

export default function ComboAdminPage() {
  const { toast } = useAdminToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [title, setTitle] = useState("");
  const [products, setProducts] = useState("");
  const [mode, setMode] = useState<"FIXED" | "PERCENT">("FIXED");
  const [priceVnd, setPriceVnd] = useState("");
  const [percentOff, setPercentOff] = useState("");
  const [published, setPublished] = useState(false);
  const [outOfStockMode, setOutOfStockMode] = useState<"HIDE" | "RETAIL">("HIDE");
  const [stackCoupon, setStackCoupon] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/bundles");
    const data = await res.json();
    if (!res.ok) {
      toast("Không tải được combo");
      return;
    }
    setRows(data.bundles || []);
    setOutOfStockMode(data.settings?.outOfStockMode === "RETAIL" ? "RETAIL" : "HIDE");
    setStackCoupon(data.settings?.stackCoupon === true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/admin/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        priceMode: mode,
        priceVnd: priceVnd.trim() ? Number(priceVnd) : null,
        percentOff: percentOff.trim() ? Number(percentOff) : null,
        isPublished: published,
        productIds: products.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean),
      }),
    });
    const data = await res.json().catch(() => null);
    toast(res.ok ? "Đã tạo combo. Nháp không bán." : data?.error || "Không tạo được");
    if (res.ok) void load();
  }

  async function saveSettings() {
    const res = await fetch("/api/admin/bundles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outOfStockMode, stackCoupon }),
    });
    toast(res.ok ? "Đã lưu quy tắc combo." : "Không lưu được");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AdminPageHeader
        title="Combo"
        description="Mặc định không có gói. Giá phải nhỏ hơn tổng lẻ và lớn hơn 0. Hết một món thì ẩn cả gói, trừ khi bật bán phần còn lại theo giá lẻ. Mã giảm không cộng, trừ khi bật."
      />
      <AdminButton type="button" onClick={() => void load()}>Tải danh sách</AdminButton>
      <AdminCard>
        <ul className="space-y-1 text-sm">
          {rows.length === 0 ? <li>Chưa có combo.</li> : rows.map((row) => (
            <li key={row.id}>
              {row.title} · {row.slug} · {row.priceMode === "FIXED" ? `${row.priceVnd ?? ""}đ` : `${row.percentOff ?? ""}%`} · {row.isPublished ? "đã xuất bản" : "nháp"} · {row.id}
            </li>
          ))}
        </ul>
        <label className="mt-4 block text-sm">
          Tiêu đề
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
        </label>
        <label className="mt-3 block text-sm">
          Id sản phẩm, cách nhau bởi dấu cách
          <textarea value={products} onChange={(event) => setProducts(event.target.value)} rows={3} className="mt-1 w-full rounded border px-2 py-1 font-mono text-xs" />
        </label>
        <label className="mt-3 block text-sm">
          Kiểu giá
          <select value={mode} onChange={(event) => setMode(event.target.value === "PERCENT" ? "PERCENT" : "FIXED")} className="mt-1 w-full rounded border px-2 py-1">
            <option value="FIXED">Giá cố định (đồng)</option>
            <option value="PERCENT">Phần trăm giảm</option>
          </select>
        </label>
        {mode === "FIXED" ? (
          <label className="mt-3 block text-sm">
            Giá combo (đồng)
            <input value={priceVnd} onChange={(event) => setPriceVnd(event.target.value)} inputMode="numeric" className="mt-1 w-full rounded border px-2 py-1" />
          </label>
        ) : (
          <label className="mt-3 block text-sm">
            Phần trăm giảm
            <input value={percentOff} onChange={(event) => setPercentOff(event.target.value)} inputMode="numeric" className="mt-1 w-full rounded border px-2 py-1" />
          </label>
        )}
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />
          Xuất bản
        </label>
        <AdminButton type="submit" className="mt-3">Tạo combo</AdminButton>
      </AdminCard>
      <AdminCard>
        <p className="text-sm font-medium">Khi một món hết hàng</p>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="radio" checked={outOfStockMode === "HIDE"} onChange={() => setOutOfStockMode("HIDE")} />
          Ẩn cả gói
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="radio" checked={outOfStockMode === "RETAIL"} onChange={() => setOutOfStockMode("RETAIL")} />
          Bán phần còn lại đúng giá lẻ
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={stackCoupon} onChange={(event) => setStackCoupon(event.target.checked)} />
          Cho cộng mã giảm với giá combo
        </label>
        <AdminButton type="button" className="mt-3" onClick={() => void saveSettings()}>Lưu quy tắc</AdminButton>
      </AdminCard>
    </form>
  );
}
