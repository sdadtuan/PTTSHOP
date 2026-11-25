"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui";

type Row = {
  id: string;
  poNumber: string;
  status: string;
  trackingCode: string | null;
  emailSubject: string | null;
  emailBody: string | null;
  supplier: { name: string; code: string };
  order: { orderNumber: string };
};

export default function SupplierPoPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  async function reload() {
    const data = await fetch("/api/admin/supplier-orders").then((res) => res.json());
    setRows(data.orders || []);
  }

  useEffect(() => {
    void fetch("/api/admin/supplier-orders")
      .then((res) => res.json())
      .then((data) => setRows(data.orders || []))
      .catch(() => setError("Không tải được phiếu"));
  }, []);

  async function act(id: string, action: "sent" | "tracking" | "scan", trackingCode?: string) {
    const res = await fetch("/api/admin/supplier-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, trackingCode }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không cập nhật được phiếu");
    else void reload();
  }

  return (
    <div>
      <AdminPageHeader title="Phiếu đặt nhà cung cấp" description="Tải file phiếu, gửi email bằng tay, rồi nhập mã vận đơn. Khách không trả thêm phí kiện NCC." />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <AdminButton className="mt-4" onClick={() => void act("scan", "scan")}>Quét quá hạn SLA</AdminButton>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <AdminCard key={row.id}>
            <p className="font-medium">{row.poNumber} · {row.order.orderNumber} · {row.supplier.name}</p>
            <p className="text-sm">Trạng thái {row.status} · vận đơn {row.trackingCode || "chưa có"}</p>
            <p className="mt-2 text-sm">{row.emailSubject}</p>
            <p className="text-sm text-neutral-600">{row.emailBody}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a className="underline text-sm" href={`/api/admin/supplier-orders/file?id=${row.id}`}>Tải phiếu</a>
              <AdminButton onClick={() => void act(row.id, "sent")}>Đã gửi NCC</AdminButton>
              <form className="flex gap-2" onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const code = String(new FormData(e.currentTarget).get("tracking") || "");
                void act(row.id, "tracking", code);
              }}>
                <input name="tracking" placeholder="Mã vận đơn" className="rounded border px-2 py-2 text-sm" />
                <AdminButton type="submit">Lưu mã</AdminButton>
              </form>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
