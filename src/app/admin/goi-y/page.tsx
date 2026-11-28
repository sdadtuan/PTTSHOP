"use client";

import { FormEvent, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, useAdminToast } from "@/components/admin/ui";

export default function RecommendationAdminPage() {
  const { toast } = useAdminToast();
  const [threshold, setThreshold] = useState("");
  const [relations, setRelations] = useState("");

  async function load() {
    const res = await fetch("/api/admin/recommendations");
    const data = await res.json();
    if (!res.ok) {
      toast("Không tải được gợi ý");
      return;
    }
    setThreshold(data.bestsellerMinOrders == null ? "" : String(data.bestsellerMinOrders));
    setRelations(
      (data.relations || [])
        .map((row: { productId: string; relatedId: string; position: number }) => `${row.productId} ${row.relatedId} ${row.position}`)
        .join("\n"),
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = relations
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [productId, relatedId, position] = line.split(/\s+/);
        return { productId, relatedId, position: Number(position || 0) };
      });
    const res = await fetch("/api/admin/recommendations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bestsellerMinOrders: threshold.trim() ? Number(threshold) : null,
        relations: parsed,
      }),
    });
    toast(res.ok ? "Đã lưu. Ngưỡng trống thì không ghi bán chạy." : "Không lưu được");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AdminPageHeader title="Gợi ý" description="Quan hệ tay ưu tiên hơn đơn mua cùng. Ngưỡng bán chạy để trống thì không hiện chữ đó." />
      <AdminButton type="button" onClick={() => void load()}>Tải cấu hình hiện tại</AdminButton>
      <AdminCard>
        <label className="block text-sm">
          Số đơn thật tối thiểu để ghi “Bán chạy”
          <input value={threshold} onChange={(event) => setThreshold(event.target.value)} className="mt-1 w-full rounded border px-2 py-1" inputMode="numeric" />
        </label>
        <label className="mt-3 block text-sm">
          Mỗi dòng: id sản phẩm, id gợi ý, thứ tự
          <textarea value={relations} onChange={(event) => setRelations(event.target.value)} rows={8} className="mt-1 w-full rounded border px-2 py-1 font-mono text-xs" />
        </label>
        <AdminButton type="submit" className="mt-3">Lưu</AdminButton>
      </AdminCard>
    </form>
  );
}
