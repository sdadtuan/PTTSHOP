"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui";

type Rule = { id: string; name: string; floorPrice: number | null; note: string | null };
type Variant = { id: string; sku: string; price: number; costPrice: number | null; product: { name: string } };

export default function PricingRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/pricing-rules")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        setRules(data.rules || []);
        setVariants(data.variants || []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/pricing-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") || ""),
        floorPrice: Number(form.get("floorPrice") || 0),
        note: String(form.get("note") || ""),
      }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không lưu được quy tắc giá.");
    else setRules((rows) => [data.rule, ...rows]);
  }

  return (
    <div>
      <AdminPageHeader title="Quy tắc giá" description="Giá sàn và giá vốn. Kho, CSKH và Marketing không được mở trang này." />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <AdminCard className="mt-4">
        <form className="grid gap-2 sm:grid-cols-3" onSubmit={(e) => void save(e)}>
          <input name="name" required placeholder="Tên quy tắc" className="rounded border px-2 py-2" />
          <input name="floorPrice" type="number" min={0} required placeholder="Giá sàn" className="rounded border px-2 py-2" />
          <input name="note" placeholder="Ghi chú" className="rounded border px-2 py-2" />
          <AdminButton type="submit">Lưu quy tắc</AdminButton>
        </form>
        <ul className="mt-4 space-y-2 text-sm">
          {rules.length === 0 ? <li>Chưa có quy tắc giá.</li> : null}
          {rules.map((rule) => <li key={rule.id}>{rule.name} · giá sàn {rule.floorPrice ?? "—"}</li>)}
        </ul>
      </AdminCard>
      <AdminCard className="mt-4">
        <h2 className="text-sm font-semibold">Giá vốn biến thể</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {variants.map((row) => <li key={row.id}>{row.sku} · {row.product.name} · giá {row.price} · vốn {row.costPrice ?? "chưa có"}</li>)}
        </ul>
      </AdminCard>
    </div>
  );
}
