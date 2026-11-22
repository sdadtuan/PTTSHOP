"use client";

import { useState } from "react";
import { AdminButton, AdminPageHeader } from "@/components/admin/ui";

type Issue = { row: number; field: string; message: string };
type Summary = {
  productsCreate: number;
  productsUpdate: number;
  variantsCreate: number;
  variantsUpdate: number;
  categoriesCreate: string[];
};

export default function ImportProductsPage() {
  const [sheet, setSheet] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function formData() {
    const body = new FormData();
    if (sheet) body.set("file", sheet);
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
      setSummary(data.summary || null);
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
      const saved = data.summary as Summary;
      setSummary(saved);
      setMessage(`Đã lưu. Tạo ${saved.productsCreate} sản phẩm, cập nhật ${saved.productsUpdate}.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Nhập sản phẩm"
        description="Kiểm tra từng dòng, xem trước, rồi mới lưu trong một lần. Ảnh lấy từ zip hoặc thư mục, lưu trên máy chủ."
        breadcrumbs={[{ href: "/admin", label: "Admin" }, { label: "Nhập sản phẩm" }]}
        actions={
          <a href="/api/admin/catalog-import/template">
            <AdminButton type="button" variant="secondary">Tải file mẫu</AdminButton>
          </a>
        }
      />
      <div className="grid max-w-3xl gap-4 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-white p-4">
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
          Ảnh: file zip hoặc nhiều file
          <input
            type="file"
            accept=".zip,image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => {
              setImages([...(e.target.files || [])]);
              setReady(false);
            }}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Hoặc cả thư mục ảnh
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            ref={(node) => node?.setAttribute("webkitdirectory", "")}
            onChange={(e) => {
              setImages([...(e.target.files || [])]);
              setReady(false);
            }}
          />
        </label>
        <div className="flex gap-2">
          <AdminButton type="button" onClick={preview} disabled={busy || !sheet}>Kiểm tra</AdminButton>
          <AdminButton type="button" variant="accent" onClick={save} disabled={busy || !ready}>Lưu</AdminButton>
        </div>
        {message ? <p className="text-sm">{message}</p> : null}
      </div>
      {summary ? (
        <p className="mt-4 text-sm">
          Sản phẩm tạo {summary.productsCreate}, cập nhật {summary.productsUpdate}. Biến thể tạo {summary.variantsCreate}, cập nhật {summary.variantsUpdate}.
          Danh mục sẽ tạo: {summary.categoriesCreate.length ? summary.categoriesCreate.join(", ") : "không"}.
        </p>
      ) : null}
      {issues.length > 0 ? (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr>
              <th>Dòng</th>
              <th>Cột</th>
              <th>Lỗi</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue, i) => (
              <tr key={`${issue.row}-${issue.field}-${i}`}>
                <td>{issue.row}</td>
                <td>{issue.field}</td>
                <td>{issue.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
