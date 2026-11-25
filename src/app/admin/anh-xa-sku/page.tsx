"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui";

type Supplier = { id: string; code: string; name: string };
type Variant = { id: string; sku: string; price: number; product: { name: string } };

export default function SupplierSkuPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/suppliers").then((res) => res.json()),
      fetch("/api/admin/pricing-rules").then((res) => res.json()),
    ]).then(([supplierData, priceData]) => {
      setSuppliers(supplierData.suppliers || []);
      setVariants(priceData.variants || []);
    }).catch(() => setError("Không tải được dữ liệu ánh xạ"));
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/supplier-skus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId: String(form.get("supplierId") || ""),
        variantId: String(form.get("variantId") || ""),
        supplierSku: String(form.get("supplierSku") || ""),
        priority: Number(form.get("priority") || 1),
        costPrice: Number(form.get("costPrice") || 0),
        supplierStock: Number(form.get("supplierStock") || 0),
        safetyStock: Number(form.get("safetyStock") || 2),
      }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không lưu được ánh xạ");
  }

  return (
    <div>
      <AdminPageHeader title="Ánh xạ SKU" description="Một biến thể có thể gắn nhiều nhà cung cấp. Số ưu tiên nhỏ hơn được bán trước. Tồn an toàn mặc định 2." />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <AdminCard className="mt-4">
        <form className="grid gap-2 sm:grid-cols-2" onSubmit={(e) => void save(e)}>
          <select name="supplierId" required className="rounded border px-2 py-2">
            <option value="">Chọn nhà cung cấp</option>
            {suppliers.map((row) => <option key={row.id} value={row.id}>{row.code} · {row.name}</option>)}
          </select>
          <select name="variantId" required className="rounded border px-2 py-2">
            <option value="">Chọn biến thể</option>
            {variants.map((row) => <option key={row.id} value={row.id}>{row.sku} · {row.product.name}</option>)}
          </select>
          <input name="supplierSku" required placeholder="Mã hàng NCC" className="rounded border px-2 py-2" />
          <input name="priority" type="number" min={1} defaultValue={1} className="rounded border px-2 py-2" />
          <input name="costPrice" type="number" min={0} required placeholder="Giá vốn" className="rounded border px-2 py-2" />
          <input name="supplierStock" type="number" min={0} required placeholder="Tồn NCC" className="rounded border px-2 py-2" />
          <input name="safetyStock" type="number" min={0} defaultValue={2} placeholder="Tồn an toàn NCC" className="rounded border px-2 py-2" />
          <AdminButton type="submit">Lưu ánh xạ</AdminButton>
        </form>
      </AdminCard>
    </div>
  );
}
