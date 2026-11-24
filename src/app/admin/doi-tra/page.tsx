"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui";

type RequestRow = { id: string; status: string; type: string; reason: string; shippingFeePayer: string; order: { orderNumber: string } };
type RefundRow = { id: string; status: string; amount: number; refundMethod: string; orderId: string };
type Settings = { returnWindowDays: number; excludedCategoryIds: string[]; dualApprovalThreshold: number };

export default function AdminReturnsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [summary, setSummary] = useState({ waiting: 0, second: 0, refunded: 0 });
  const [settings, setSettings] = useState<Settings>({ returnWindowDays: 7, excludedCategoryIds: [], dualApprovalThreshold: 2_000_000 });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/returns")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setRequests(data.requests || []);
        setRefunds(data.refunds || []);
        setSummary(data.summary || { waiting: 0, second: 0, refunded: 0 });
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được đổi trả.");
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "settings",
        returnWindowDays: Number(settings.returnWindowDays),
        dualApprovalThreshold: Number(settings.dualApprovalThreshold),
        excludedCategoryIds: settings.excludedCategoryIds,
      }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không lưu được.");
  }

  async function approve(refundId: string, action: "approve" | "complete") {
    const reference = action === "complete" ? window.prompt("Mã tham chiếu đã chuyển hoàn") || "" : undefined;
    const res = await fetch("/api/admin/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, refundId, reference }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không duyệt được.");
      return;
    }
    if (data.suggestInvoiceAdjustment) setError("Phiếu đã hoàn. Đơn có hoá đơn gốc: tạo hoá đơn điều chỉnh hoặc thay thế.");
    const fresh = await fetch("/api/admin/returns").then((row) => row.json());
    setRequests(fresh.requests || []);
    setRefunds(fresh.refunds || []);
    setSummary(fresh.summary);
  }

  const shown = requests.filter((row) => !status || row.status === status);

  return (
    <div>
      <AdminPageHeader title="Đổi trả & Hoàn tiền" description="Duyệt đổi trả và hoàn tiền. Số tiền trên 2.000.000đ cần hai người duyệt khác nhau." />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <AdminCard><p className="text-sm text-[var(--admin-text-muted)]">Chờ xử lý</p><p className="text-2xl font-semibold">{summary.waiting}</p></AdminCard>
        <AdminCard><p className="text-sm text-[var(--admin-text-muted)]">Chờ duyệt cấp 2</p><p className="text-2xl font-semibold">{summary.second}</p></AdminCard>
        <AdminCard><p className="text-sm text-[var(--admin-text-muted)]">Đã hoàn</p><p className="text-2xl font-semibold">{summary.refunded}</p></AdminCard>
      </div>
      <AdminCard className="mt-4">
        <label className="text-sm">Lọc trạng thái đổi trả
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block rounded border px-2 py-2">
            <option value="">Tất cả</option>
            <option value="REQUESTED">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="RECEIVING">Đang nhận hàng hoàn</option>
            <option value="COMPLETED">Hoàn tất</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </label>
        <ul className="mt-4 space-y-2 text-sm">
          {shown.length === 0 ? <li>Chưa có yêu cầu đổi trả.</li> : null}
          {shown.map((row) => (
            <li key={row.id} className="rounded border p-3">
              {row.order.orderNumber} · {row.type} · {row.reason} · phí {row.shippingFeePayer} · {row.status}
            </li>
          ))}
        </ul>
      </AdminCard>
      <AdminCard className="mt-4">
        <h2 className="text-sm font-semibold">Hoàn tiền</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {refunds.length === 0 ? <li>Chưa có yêu cầu hoàn tiền.</li> : null}
          {refunds.map((row) => (
            <li key={row.id} className="rounded border p-3">
              <p>{row.amount.toLocaleString("vi-VN")}đ · {row.refundMethod} · {row.status}</p>
              <div className="mt-2 flex gap-2">
                {row.status === "PENDING" || row.status === "PENDING_SECOND_APPROVAL" ? (
                  <AdminButton type="button" size="sm" onClick={() => void approve(row.id, "approve")}>Duyệt</AdminButton>
                ) : null}
                {row.status === "APPROVED" ? (
                  <AdminButton type="button" size="sm" variant="secondary" onClick={() => void approve(row.id, "complete")}>Đánh dấu đã hoàn</AdminButton>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </AdminCard>
      <AdminCard className="mt-4">
        <h2 className="text-sm font-semibold">Cài đặt đổi trả</h2>
        <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={(e) => void save(e)}>
          <label className="text-sm">Số ngày được đổi trả
            <input type="number" value={settings.returnWindowDays} onChange={(e) => setSettings({ ...settings, returnWindowDays: Number(e.target.value) })} className="mt-1 w-full rounded border px-2 py-2" />
          </label>
          <label className="text-sm">Ngưỡng duyệt 2 cấp (đ)
            <input type="number" value={settings.dualApprovalThreshold} onChange={(e) => setSettings({ ...settings, dualApprovalThreshold: Number(e.target.value) })} className="mt-1 w-full rounded border px-2 py-2" />
          </label>
          <label className="text-sm sm:col-span-2">Danh mục không đổi trả (id, cách nhau bởi dấu phẩy)
            <input
              value={settings.excludedCategoryIds.join(",")}
              onChange={(e) => setSettings({ ...settings, excludedCategoryIds: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
              className="mt-1 w-full rounded border px-2 py-2"
            />
          </label>
          <AdminButton type="submit">Lưu cài đặt</AdminButton>
        </form>
      </AdminCard>
    </div>
  );
}
