"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui";

type Supplier = {
  id: string;
  code: string;
  name: string;
  taxCode: string | null;
  connectionType: string;
  slaHours: number;
  imageLicense: string;
  isActive: boolean;
};

const links = [
  ["/admin/anh-xa-sku", "Ánh xạ SKU"],
  ["/admin/dong-bo-ton", "Đồng bộ tồn"],
  ["/admin/phieu-dat-ncc", "Phiếu đặt nhà cung cấp"],
  ["/admin/doi-tru-ncc", "Đối trừ nhà cung cấp"],
  ["/admin/quy-tac-gia", "Quy tắc giá"],
];

export default function SuppliersPage() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [error, setError] = useState("");

  async function reload() {
    const res = await fetch("/api/admin/suppliers");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không tải được nhà cung cấp");
    else setRows(data.suppliers || []);
  }

  useEffect(() => {
    void fetch("/api/admin/suppliers")
      .then((res) => res.json())
      .then((data) => setRows(data.suppliers || []))
      .catch(() => setError("Không tải được nhà cung cấp"));
  }, []);

  async function createSupplier(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: String(form.get("code") || ""),
        name: String(form.get("name") || ""),
        taxCode: String(form.get("taxCode") || ""),
        connectionType: String(form.get("connectionType") || "FILE"),
        slaHours: Number(form.get("slaHours") || 48),
        imageLicense: String(form.get("imageLicense") || "NONE"),
        paysReturnFee: true,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) setError(data.error || "Không lưu được hồ sơ");
    else void reload();
  }

  return (
    <div>
      <AdminPageHeader title="Nhà cung cấp" description="Hồ sơ NCC, SLA 48 giờ, cảnh báo khi 24 giờ chưa có mã vận đơn. Không lưu khoá API." />
      <nav className="mt-3 flex flex-wrap gap-3 text-sm">
        {links.map(([href, label]) => <Link key={href} className="underline" href={href}>{label}</Link>)}
      </nav>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <AdminCard className="mt-4">
        <form className="grid gap-2 sm:grid-cols-3" onSubmit={(e) => void createSupplier(e)}>
          <input name="code" required placeholder="Mã NCC" className="rounded border px-2 py-2" />
          <input name="name" required placeholder="Tên" className="rounded border px-2 py-2" />
          <input name="taxCode" placeholder="MST" className="rounded border px-2 py-2" />
          <select name="connectionType" className="rounded border px-2 py-2">
            <option value="FILE">File</option>
            <option value="GOOGLE_SHEET">Google Sheet</option>
            <option value="MANUAL">Nhập tay</option>
            <option value="API_STUB">CJ (chưa nối)</option>
          </select>
          <input name="slaHours" type="number" min={1} defaultValue={48} className="rounded border px-2 py-2" />
          <select name="imageLicense" className="rounded border px-2 py-2">
            <option value="NONE">Chưa có phép dùng ảnh</option>
            <option value="WRITTEN">Có văn bản cho phép ảnh</option>
            <option value="OWN_PHOTOS">Ảnh PTT tự chụp</option>
          </select>
          <AdminButton type="submit">Lưu hồ sơ</AdminButton>
        </form>
      </AdminCard>
      <AdminCard className="mt-4">
        <ul className="space-y-2 text-sm">
          {rows.length === 0 ? <li>Chưa có nhà cung cấp.</li> : null}
          {rows.map((row) => (
            <li key={row.id}>
              {row.code} · {row.name} · {row.connectionType} · SLA {row.slaHours} giờ · ảnh {row.imageLicense}
              {row.taxCode ? ` · MST ${row.taxCode}` : ""}
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
