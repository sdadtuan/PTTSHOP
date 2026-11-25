"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui";

type Supplier = { id: string; code: string; name: string };
type Debit = { id: string; amount: number; reason: string; status: string };

export default function SupplierDebitPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rows, setRows] = useState<Debit[]>([]);
  const [error, setError] = useState("");

  async function reload() {
    const [supplierData, debitData] = await Promise.all([
      fetch("/api/admin/suppliers").then((res) => res.json()),
      fetch("/api/admin/supplier-debits").then((res) => res.json()),
    ]);
    setSuppliers(supplierData.suppliers || []);
    setRows(debitData.debits || []);
  }

  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/suppliers").then((res) => res.json()),
      fetch("/api/admin/supplier-debits").then((res) => res.json()),
    ]).then(([supplierData, debitData]) => {
      setSuppliers(supplierData.suppliers || []);
      setRows(debitData.debits || []);
    }).catch(() => setError("Không tải được đối trừ"));
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/supplier-debits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId: String(form.get("supplierId") || ""),
        amount: Number(form.get("amount") || 0),
        reason: String(form.get("reason") || ""),
      }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không ghi được đối trừ");
    else void reload();
  }

  return (
    <div>
      <AdminPageHeader title="Đối trừ nhà cung cấp" description="Hàng lỗi do NCC thì NCC chịu phí đổi trả. Khoản này không tự hoàn tiền cho khách." />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <AdminCard className="mt-4">
        <form className="grid gap-2 sm:grid-cols-3" onSubmit={(e) => void save(e)}>
          <select name="supplierId" required className="rounded border px-2 py-2">
            <option value="">Chọn nhà cung cấp</option>
            {suppliers.map((row) => <option key={row.id} value={row.id}>{row.code}</option>)}
          </select>
          <input name="amount" type="number" min={1} required placeholder="Số tiền" className="rounded border px-2 py-2" />
          <input name="reason" required placeholder="Lý do hàng lỗi" className="rounded border px-2 py-2" />
          <AdminButton type="submit">Ghi đối trừ</AdminButton>
        </form>
      </AdminCard>
      <AdminCard className="mt-4">
        <ul className="space-y-2 text-sm">
          {rows.map((row) => <li key={row.id}>{row.status} · {row.amount} đồng · {row.reason}</li>)}
        </ul>
      </AdminCard>
    </div>
  );
}
