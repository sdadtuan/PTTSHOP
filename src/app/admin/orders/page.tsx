"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { formatVnd } from "@/lib/format";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/lib/order-status";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  paymentMethod: string;
  status: keyof typeof ORDER_STATUS_LABELS;
  createdAt: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không tải được");
      return;
    }
    setOrders(data.orders || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Cập nhật thất bại");
      return;
    }
    await load();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex items-end justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Đơn hàng
        </h1>
        <Link href="/" className="text-sm text-[var(--accent)]">
          Storefront
        </Link>
      </div>
      <AdminNav current="/admin/orders" />
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <div className="mt-6 overflow-x-auto border border-neutral-100 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Khách</th>
              <th className="px-4 py-3">Tổng</th>
              <th className="px-4 py-3">TT</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-neutral-50">
                <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                <td className="px-4 py-3">
                  <div>{o.customerName}</div>
                  <div className="text-xs text-neutral-500">{o.customerPhone}</div>
                </td>
                <td className="px-4 py-3">{formatVnd(o.total)}</td>
                <td className="px-4 py-3">{o.paymentMethod}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => void updateStatus(o.id, e.target.value)}
                    className="rounded border border-neutral-200 px-2 py-1"
                  >
                    {ORDER_STATUS_FLOW.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
