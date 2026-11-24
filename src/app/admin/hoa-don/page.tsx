"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui";
import { formatVnd } from "@/lib/format";

type InvoiceRow = {
  id: string;
  orderId: string;
  type: string;
  status: string;
  buyerKind: string;
  buyerName: string;
  buyerTaxCode: string | null;
  totalAmount: number;
  vatAmount: number;
  retryCount: number;
  lastError: string | null;
  invoiceNumber: string | null;
  lookupUrl: string | null;
  needsAccountantAttention: boolean;
  order: { id: string; orderNumber: string };
};

const TYPE_LABEL: Record<string, string> = {
  ORIGINAL: "Gốc",
  ADJUSTMENT: "Điều chỉnh",
  REPLACEMENT: "Thay thế",
};

export default function AdminInvoicesPage() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [summary, setSummary] = useState({ issued: 0, waiting: 0, attention: 0 });
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [blockReason, setBlockReason] = useState<string | null>(null);
  const [sandbox, setSandbox] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({
    provider: "DISABLED",
    autoIssueEnabled: false,
    issueTrigger: "ON_DELIVERED",
    templateCode: "",
    invoiceSeries: "",
    vatRate: 8,
    maxRetries: 5,
    retryBaseMinutes: 15,
  });

  async function load() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/admin/invoices?${params}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không tải được hoá đơn.");
      return;
    }
    setRows(data.invoices || []);
    setSummary(data.summary);
    setBlockReason(data.blockReason);
    setSandbox(Boolean(data.sandbox));
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/invoice-settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.settings) return;
        setSettings({
          provider: data.settings.provider,
          autoIssueEnabled: data.settings.autoIssueEnabled,
          issueTrigger: data.settings.issueTrigger,
          templateCode: data.settings.templateCode || "",
          invoiceSeries: data.settings.invoiceSeries || "",
          vatRate: data.settings.vatRate,
          maxRetries: data.settings.maxRetries,
          retryBaseMinutes: data.settings.retryBaseMinutes,
        });
        setBlockReason(data.blockReason);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    let cancelled = false;
    void fetch(`/api/admin/invoices?${params}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data.error || "Không tải được hoá đơn.");
          return;
        }
        setRows(data.invoices || []);
        setSummary(data.summary);
        setBlockReason(data.blockReason);
        setSandbox(Boolean(data.sandbox));
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được hoá đơn.");
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  async function act(body: Record<string, unknown>) {
    setError("");
    const res = await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không thực hiện được.");
      return;
    }
    await load();
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/invoice-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings,
        templateCode: settings.templateCode,
        invoiceSeries: settings.invoiceSeries,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không lưu được cấu hình.");
      return;
    }
    setBlockReason(data.blockReason);
  }

  return (
    <div>
      <AdminPageHeader
        title="Hoá đơn điện tử"
        description="Phát hành tự động đang tắt cho tới khi kế toán chốt nhà cung cấp, mẫu số và ký hiệu."
      />
      {sandbox ? (
        <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Chế độ giả lập (Sandbox) — không có giá trị pháp lý.
        </p>
      ) : null}
      {blockReason ? <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{blockReason}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <AdminCard><p className="text-sm text-[var(--admin-text-muted)]">Đã phát hành</p><p className="text-2xl font-semibold">{summary.issued}</p></AdminCard>
        <AdminCard><p className="text-sm text-[var(--admin-text-muted)]">Đang chờ / thử lại</p><p className="text-2xl font-semibold">{summary.waiting}</p></AdminCard>
        <AdminCard>
          <p className="text-sm text-[var(--admin-text-muted)]">Lỗi cần kế toán xử lý</p>
          <p className={`text-2xl font-semibold ${summary.attention > 0 ? "text-red-600" : ""}`}>{summary.attention}</p>
        </AdminCard>
      </div>
      <AdminCard className="mt-4">
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void load(); }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded border px-2 text-sm">
            <option value="">Mọi trạng thái</option>
            {["PENDING", "ISSUING", "ISSUED", "RETRYING", "FAILED", "ADJUSTED", "REPLACED", "CANCELED"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mã đơn, số hoá đơn, MST" className="h-10 min-w-56 rounded border px-3 text-sm" />
          <AdminButton type="submit">Tìm</AdminButton>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <ul className="mt-4 space-y-3 text-sm">
          {rows.map((row) => (
            <li key={row.id} className="rounded border p-3">
              <p className="font-medium">
                <Link href={`/admin/orders/${row.order.id}`} className="text-[var(--admin-accent)]">{row.order.orderNumber}</Link>
                {" · "}{TYPE_LABEL[row.type] || row.type} · {row.status}
              </p>
              <p>{row.buyerKind === "COMPANY" ? `${row.buyerName} · MST ${row.buyerTaxCode || "—"}` : row.buyerName}</p>
              <p>{formatVnd(row.totalAmount)} · VAT {formatVnd(row.vatAmount)} · thử {row.retryCount}</p>
              {row.lastError ? <p className="text-red-600">{row.lastError}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {row.status === "FAILED" || row.status === "RETRYING" || row.status === "PENDING" ? (
                  <AdminButton type="button" size="sm" onClick={() => void act({ action: "retry", invoiceId: row.id })}>Thử phát hành lại</AdminButton>
                ) : null}
                {row.status === "ISSUED" ? (
                  <form
                    className="flex flex-wrap items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      void act({
                        action: String(form.get("kind") || "adjust"),
                        invoiceId: row.id,
                        reason: String(form.get("reason") || ""),
                        amount: Number(form.get("amount") || 0),
                      });
                    }}
                  >
                    <select name="kind" className="h-9 rounded border px-2">
                      <option value="adjust">Điều chỉnh</option>
                      <option value="replace">Thay thế</option>
                    </select>
                    <input name="reason" required placeholder="Lý do" className="h-9 rounded border px-2" />
                    <input name="amount" required type="number" min={0} placeholder="Số tiền" className="h-9 w-28 rounded border px-2" />
                    <AdminButton type="submit" size="sm" variant="secondary">Điều chỉnh / Thay thế</AdminButton>
                  </form>
                ) : null}
                {row.lookupUrl ? <a href={row.lookupUrl} className="text-[var(--admin-accent)]">Tra cứu</a> : null}
              </div>
            </li>
          ))}
        </ul>
      </AdminCard>
      <AdminCard className="mt-4">
        <h2 className="text-sm font-semibold">Cài đặt hoá đơn</h2>
        <p className="mt-1 text-xs text-[var(--admin-text-muted)]">Thuế suất 0, 8 hoặc 10 để kế toán đối chiếu chính sách VAT hiện hành. Mặc định 8. Tự động phát hành đang tắt.</p>
        <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={(e) => void saveSettings(e)}>
          <label className="text-sm">Nhà cung cấp
            <select value={settings.provider} onChange={(e) => setSettings({ ...settings, provider: e.target.value })} className="mt-1 w-full rounded border px-2 py-2">
              <option value="DISABLED">Tắt</option>
              <option value="SANDBOX_MOCK">Giả lập sandbox</option>
              <option value="VIETTEL_SINVOICE">Viettel S-Invoice</option>
              <option value="MISA_MEINVOICE">MISA meInvoice</option>
            </select>
          </label>
          <label className="text-sm">Thời điểm phát hành
            <select value={settings.issueTrigger} onChange={(e) => setSettings({ ...settings, issueTrigger: e.target.value })} className="mt-1 w-full rounded border px-2 py-2">
              <option value="ON_DELIVERED">Khi giao thành công</option>
              <option value="ON_PAID">Khi đã thanh toán</option>
            </select>
          </label>
          <label className="text-sm">Mẫu số
            <input value={settings.templateCode} onChange={(e) => setSettings({ ...settings, templateCode: e.target.value })} className="mt-1 w-full rounded border px-2 py-2" />
          </label>
          <label className="text-sm">Ký hiệu
            <input value={settings.invoiceSeries} onChange={(e) => setSettings({ ...settings, invoiceSeries: e.target.value })} className="mt-1 w-full rounded border px-2 py-2" />
          </label>
          <label className="text-sm">VAT
            <select value={settings.vatRate} onChange={(e) => setSettings({ ...settings, vatRate: Number(e.target.value) })} className="mt-1 w-full rounded border px-2 py-2">
              <option value={0}>0%</option>
              <option value={8}>8%</option>
              <option value={10}>10%</option>
            </select>
          </label>
          <label className="text-sm">Số lần thử tối đa
            <input type="number" value={settings.maxRetries} onChange={(e) => setSettings({ ...settings, maxRetries: Number(e.target.value) })} className="mt-1 w-full rounded border px-2 py-2" />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={settings.autoIssueEnabled} onChange={(e) => setSettings({ ...settings, autoIssueEnabled: e.target.checked })} />
            Tự động phát hành (mặc định tắt)
          </label>
          <AdminButton type="submit">Lưu cài đặt</AdminButton>
        </form>
      </AdminCard>
    </div>
  );
}
