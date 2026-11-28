"use client";

import { FormEvent, useState } from "react";
import { AdminButton, AdminCard, AdminKpiCard, AdminPageHeader, useAdminToast } from "@/components/admin/ui";
import { PAYMENT_METHOD_LABELS } from "@/lib/admin-orders";
import { formatVnd } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { REVENUE_DEFINITION } from "@/lib/revenue";

type Report = {
  definition: string;
  from: string;
  to: string;
  channelNote: string | null;
  revenue: number;
  orderCount: number;
  aov: number | null;
  conversion: number | null;
  conversionNote: string | null;
  abandonedCarts: number;
  statuses: { status: string; count: number }[];
  payments: { method: string; revenue: number; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  loyalty: { pointsEarned: number | null; pointsRedeemed: number | null; referrals: number | null } | null;
};

export default function RevenuePage() {
  const { toast } = useAdminToast();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("web");
  const [report, setReport] = useState<Report | null>(null);

  async function load(event?: FormEvent) {
    event?.preventDefault();
    const query = new URLSearchParams();
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    if (status) query.set("status", status);
    if (channel) query.set("channel", channel);
    const res = await fetch(`/api/admin/revenue?${query.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast(data?.error || "Không tải được doanh thu");
      return;
    }
    setReport(data);
  }

  const csvQuery = new URLSearchParams();
  if (report) {
    csvQuery.set("from", report.from);
    csvQuery.set("to", report.to);
    if (status) csvQuery.set("status", status);
    if (channel) csvQuery.set("channel", channel);
    csvQuery.set("format", "csv");
  }

  return (
    <form onSubmit={(event) => void load(event)} className="space-y-4">
      <AdminPageHeader title="Doanh thu" description={REVENUE_DEFINITION} />
      <AdminCard>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="block text-sm">Từ ngày
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
          </label>
          <label className="block text-sm">Đến ngày
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
          </label>
          <label className="block text-sm">Trạng thái
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 w-full rounded border px-2 py-1">
              <option value="">Tất cả</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">Kênh
            <select value={channel} onChange={(event) => setChannel(event.target.value)} className="mt-1 w-full rounded border px-2 py-1">
              <option value="web">Web</option>
              <option value="san">Sàn</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <AdminButton type="submit">Tải doanh thu</AdminButton>
          {report ? <a className="inline-flex items-center text-sm underline" href={`/api/admin/revenue?${csvQuery.toString()}`}>Xuất CSV</a> : null}
        </div>
      </AdminCard>
      {report?.channelNote ? <p className="text-sm">{report.channelNote}</p> : null}
      {report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminKpiCard label="Doanh thu" value={formatVnd(report.revenue)} />
            <AdminKpiCard label="Số đơn" value={String(report.orderCount)} />
            <AdminKpiCard label="AOV" value={report.aov == null ? "—" : formatVnd(report.aov)} />
            <AdminKpiCard label="Chuyển đổi" value={report.conversion == null ? report.conversionNote || "chưa gắn đo lường" : `${report.conversion}%`} />
          </div>
          <AdminCard>
            <p className="text-sm">Giỏ bỏ dở: {report.abandonedCarts}. Giỏ còn món, cập nhật trong khoảng ngày, chưa có đơn sau đó.</p>
            <p className="mt-2 text-sm">{report.loyalty ? `Điểm cộng ${report.loyalty.pointsEarned ?? 0}, điểm đổi ${report.loyalty.pointsRedeemed ?? 0}, giới thiệu ${report.loyalty.referrals ?? 0}.` : "Điểm đang tắt."}</p>
          </AdminCard>
          <AdminCard>
            <h2 className="text-sm font-medium">Phương thức thanh toán</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {report.payments.length === 0 ? <li>Chưa có đơn trong khoảng này.</li> : report.payments.map((row) => (
                <li key={row.method}>{PAYMENT_METHOD_LABELS[row.method as keyof typeof PAYMENT_METHOD_LABELS] || row.method}: {formatVnd(row.revenue)} ({row.count})</li>
              ))}
            </ul>
          </AdminCard>
          <AdminCard>
            <h2 className="text-sm font-medium">Trạng thái đơn trong khoảng</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {report.statuses.length === 0 ? <li>Chưa có đơn.</li> : report.statuses.map((row) => (
                <li key={row.status}>{ORDER_STATUS_LABELS[row.status as keyof typeof ORDER_STATUS_LABELS] || row.status}: {row.count}</li>
              ))}
            </ul>
          </AdminCard>
          <AdminCard>
            <h2 className="text-sm font-medium">Sản phẩm</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {report.topProducts.length === 0 ? <li>Chưa có dòng hàng.</li> : report.topProducts.map((row) => (
                <li key={row.name}>{row.name}: {row.quantity} · {formatVnd(row.revenue)}</li>
              ))}
            </ul>
          </AdminCard>
        </>
      ) : null}
    </form>
  );
}
