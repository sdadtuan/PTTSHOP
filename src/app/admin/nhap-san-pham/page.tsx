"use client";

import { useState } from "react";
import { AdminButton, AdminPageHeader } from "@/components/admin/ui";

type Issue = { row: number; field: string; message: string };
type PreviewProduct = {
  slug: string;
  name: string;
  categorySlug: string;
  saleStatus: string;
  variantCount: number;
  stock: number;
  outOfStock: string[];
};

export default function ImportProductsPage() {
  const [mode, setMode] = useState<"demo" | "catalog">("demo");
  const [sheet, setSheet] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [products, setProducts] = useState<PreviewProduct[]>([]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function formData() {
    const body = new FormData();
    if (sheet) body.set("file", sheet);
    body.set("mode", mode);
    for (const image of images) body.append("images", image);
    return body;
  }

  async function preview() {
    setBusy(true);
    setMessage("");
    setReady(false);
    try {
      const res = await fetch("/api/admin/catalog-import/preview", { method: "POST", body: formData() });
      const data = await res.json();
      setIssues(data.issues || []);
      setProducts(data.products || []);
      setReady(Boolean(data.ok));
      if (!res.ok) setMessage(data.error || "Không kiểm tra được file");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/catalog-import/commit", { method: "POST", body: formData() });
      const data = await res.json();
      if (!res.ok) {
        setIssues(data.issues || []);
        setReady(false);
        setMessage(data.error || "Chưa lưu");
        return;
      }
      setReady(false);
      setMessage(`Đã lưu ${data.created.length} sản phẩm: ${data.created.map((row: { slug: string }) => row.slug).join(", ")}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Nhập sản phẩm"
        description="Kiểm tra từng dòng, xem trước, rồi mới lưu. Ảnh lưu trên máy chủ, không lưu link ngoài."
        breadcrumbs={[{ href: "/admin", label: "Admin" }, { label: "Nhập sản phẩm" }]}
        actions={
          <a href="/api/admin/catalog-import/template">
            <AdminButton type="button" variant="secondary">Tải mẫu CSV</AdminButton>
          </a>
        }
      />
      <div className="grid max-w-3xl gap-4 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-white p-4">
        <label className="grid gap-1 text-sm">
          Chế độ
          <select
            className="h-10 rounded border border-[var(--admin-border)] px-2"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as "demo" | "catalog");
              setReady(false);
            }}
          >
            <option value="demo">DEMO: slug demo- và SKU DEMO-</option>
            <option value="catalog">Sản phẩm mới, không ghi đè sản phẩm đã có</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          File CSV hoặc Excel
          <input
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              setSheet(e.target.files?.[0] || null);
              setReady(false);
            }}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Ảnh kèm theo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => {
              setImages([...(e.target.files || [])]);
              setReady(false);
            }}
          />
        </label>
        <div className="flex gap-2">
          <AdminButton type="button" onClick={preview} disabled={busy || !sheet}>
            Kiểm tra
          </AdminButton>
          <AdminButton type="button" variant="accent" onClick={save} disabled={busy || !ready}>
            Lưu
          </AdminButton>
        </div>
        {message ? <p className="text-sm">{message}</p> : null}
      </div>
      {issues.length > 0 ? (
        <ul className="mt-4 grid gap-1 text-sm text-red-700">
          {issues.map((issue, i) => (
            <li key={`${issue.row}-${issue.field}-${i}`}>
              Dòng {issue.row}, cột {issue.field}: {issue.message}
            </li>
          ))}
        </ul>
      ) : null}
      {products.length > 0 ? (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Tên</th>
              <th>Danh mục</th>
              <th>Biến thể</th>
              <th>Tồn</th>
              <th>Hết hàng</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.slug}>
                <td>{product.slug}</td>
                <td>{product.name}</td>
                <td>{product.categorySlug}</td>
                <td>{product.variantCount}</td>
                <td>{product.stock}</td>
                <td>{product.outOfStock.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
