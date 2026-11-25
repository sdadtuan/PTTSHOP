"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui";

type Supplier = { id: string; code: string; name: string };
type Run = { id: string; status: string; rowsRead: number; rowsChanged: number; rowsErrored: number; source: string };

export default function SupplierSyncPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState("");

  async function reload() {
    const [supplierRes, runRes] = await Promise.all([
      fetch("/api/admin/suppliers").then((res) => res.json()),
      fetch("/api/admin/supplier-sync").then((res) => res.json()),
    ]);
    setSuppliers(supplierRes.suppliers || []);
    setRuns(runRes.runs || []);
  }

  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/suppliers").then((res) => res.json()),
      fetch("/api/admin/supplier-sync").then((res) => res.json()),
    ]).then(([supplierRes, runRes]) => {
      setSuppliers(supplierRes.suppliers || []);
      setRuns(runRes.runs || []);
    }).catch(() => setError("Không tải được nhật ký đồng bộ"));
  }, []);

  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = form.get("file");
    const csv = file instanceof File ? await file.text() : String(form.get("csv") || "");
    const res = await fetch("/api/admin/supplier-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId: String(form.get("supplierId") || ""),
        source: String(form.get("source") || "FILE"),
        csv,
      }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Đồng bộ lỗi");
    else void reload();
  }

  return (
    <div>
      <AdminPageHeader title="Đồng bộ tồn" description="File CSV, Google Sheet hoặc nhập tay. Dòng lỗi không chặn dòng khác. Trùng mã thì cả hai dòng bị từ chối." />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <AdminCard className="mt-4">
        <form className="grid gap-2" onSubmit={(e) => void upload(e)}>
          <select name="supplierId" required className="rounded border px-2 py-2">
            <option value="">Chọn nhà cung cấp</option>
            {suppliers.map((row) => <option key={row.id} value={row.id}>{row.code} · {row.name}</option>)}
          </select>
          <select name="source" className="rounded border px-2 py-2">
            <option value="FILE">File</option>
            <option value="MANUAL">Nhập tay</option>
            <option value="GOOGLE_SHEET">Google Sheet đã lưu trên hồ sơ</option>
          </select>
          <input name="file" type="file" accept=".csv,text/csv" className="text-sm" />
          <textarea name="csv" placeholder="Hoặc dán CSV, kể cả một dòng nhập tay" className="min-h-24 rounded border px-2 py-2" />
          <AdminButton type="submit">Chạy đồng bộ</AdminButton>
        </form>
      </AdminCard>
      <AdminCard className="mt-4">
        <ul className="space-y-2 text-sm">
          {runs.map((run) => (
            <li key={run.id}>{run.source} · {run.status} · đọc {run.rowsRead} · đổi {run.rowsChanged} · lỗi {run.rowsErrored}</li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
