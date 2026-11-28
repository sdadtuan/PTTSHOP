"use client";

import { FormEvent, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, useAdminToast } from "@/components/admin/ui";

export default function LookAdminPage() {
  const { toast } = useAdminToast();
  const [title, setTitle] = useState("");
  const [products, setProducts] = useState("");
  const [published, setPublished] = useState(false);
  const [rows, setRows] = useState<{ id: string; title: string; slug: string; isPublished: boolean }[]>([]);

  async function load() {
    const res = await fetch("/api/admin/looks");
    const data = await res.json();
    if (!res.ok) {
      toast("Không tải được look");
      return;
    }
    setRows(data.looks || []);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/admin/looks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        isPublished: published,
        productIds: products.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean),
      }),
    });
    toast(res.ok ? "Đã tạo look. Nháp không hiện với khách." : "Không tạo được");
    if (res.ok) void load();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AdminPageHeader title="Lookbook" description="Mặc định là nháp. Không có look đã xuất bản thì menu và trang ẩn." />
      <AdminButton type="button" onClick={() => void load()}>Tải danh sách</AdminButton>
      <AdminCard>
        <ul className="space-y-1 text-sm">
          {rows.length === 0 ? <li>Chưa tải hoặc chưa có look.</li> : rows.map((row) => (
            <li key={row.id}>{row.title} · {row.slug} · {row.isPublished ? "đã xuất bản" : "nháp"} · {row.id}</li>
          ))}
        </ul>
        <label className="mt-4 block text-sm">
          Tiêu đề
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
        </label>
        <label className="mt-3 block text-sm">
          Id sản phẩm, cách nhau bởi dấu cách
          <textarea value={products} onChange={(event) => setProducts(event.target.value)} rows={4} className="mt-1 w-full rounded border px-2 py-1 font-mono text-xs" />
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />
          Xuất bản
        </label>
        <AdminButton type="submit" className="mt-3">Tạo look</AdminButton>
      </AdminCard>
    </form>
  );
}
