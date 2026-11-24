"use client";

import Link from "next/link";
import { StorefrontImage } from "@/components/product/storefront-image";
import { PAYMENT_AUDIT_EMPTY } from "@/lib/payments/audit-view";
import { formatVnd } from "@/lib/format";
import { useCallback, useEffect, useState } from "react";
import { Printer } from "lucide-react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminPageHeader,
  AdminSelect,
  AdminTable,
  AdminTableSkeleton,
  AdminTd,
  AdminTh,
  AdminTr,
  orderStatusTone,
  useAdminToast,
} from "@/components/admin/ui";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  orderItemImageUrl,
} from "@/lib/admin-orders";
import { isCodConfirmOverdue, isPaymentOverdue } from "@/lib/payments/policy";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/lib/order-status";

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: keyof typeof ORDER_STATUS_LABELS;
  paymentMethod: keyof typeof PAYMENT_METHOD_LABELS;
  paymentStatus: keyof typeof PAYMENT_STATUS_LABELS;
  paymentProvider: string | null;
  paymentRef: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  note: string | null;
  couponCode: string | null;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  userId: string | null;
  paymentDueAt?: string | null;
  paymentConfirmedAt?: string | null;
  paymentConfirmedById?: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; email: string } | null;
  shipments?: Array<{
    id: string;
    shipmentNumber: string | null;
    provider: string | null;
    trackingCode: string | null;
    status: string | null;
    shippingFee: number | null;
    codAmount: number | null;
  }>;
  paymentAudits?: Array<{ at: string; actor: string; action: string; amount: number | null }>;
  invoiceCompanyName?: string | null;
  invoiceTaxCode?: string | null;
  invoiceAddress?: string | null;
  invoiceEmail?: string | null;
  invoices?: Array<{
    id: string;
    type: string;
    status: string;
    totalAmount: number;
    vatAmount: number;
    invoiceNumber: string | null;
    lookupUrl: string | null;
    lastError: string | null;
    retryCount: number;
    buyerName: string;
    buyerTaxCode: string | null;
  }>;
  items: Array<{
    id: string;
    name: string;
    color: string;
    size: string;
    price: number;
    quantity: number;
    variant?: {
      product?: { slug: string; images: { url: string; type: string; color: string | null }[] } | null;
    } | null;
  }>;
};

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const { toast } = useAdminToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [returnReason, setReturnReason] = useState("DEFECTIVE");
  const [returnType, setReturnType] = useState("RETURN_REFUND");
  const [returnNote, setReturnNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/orders?id=${encodeURIComponent(orderId)}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không tải được đơn hàng");
      setOrder(null);
    } else {
      setError("");
      const o = data.order as OrderDetail;
      setOrder({
        ...o,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      });
    }
    setLoading(false);
  }, [orderId]);

  async function postInvoice(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không phát hành được hoá đơn.");
      return;
    }
    await load();
  }

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/admin/orders?id=${encodeURIComponent(orderId)}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Không tải được đơn hàng");
          setOrder(null);
        } else {
          setError("");
          const o = data.order as OrderDetail;
          setOrder(o);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Không tải được đơn hàng");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function updateStatus(next: string) {
    if (!order) return;
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, status: next }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast(data.error || "Cập nhật thất bại", "error");
      return;
    }
    toast("Đã cập nhật trạng thái đơn");
    await load();
  }

  async function confirmPaid() {
    if (!order) return;
    if (!confirm("Xác nhận đã nhận tiền / chuyển khoản cho đơn này?")) return;
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, paymentStatus: "PAID", confirmPaid: true }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast(data.error || "Không cập nhật được thanh toán", "error");
      return;
    }
    toast("Đã xác nhận thanh toán");
    await load();
  }

  async function createShipment(current: OrderDetail) {
    const res = await fetch("/api/admin/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: current.id, idempotencyKey: `${current.orderNumber}-K1` }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Không tạo được kiện", "error");
      return;
    }
    toast(data.created ? "Đã tạo kiện" : "Kiện này đã có");
    await load();
  }

  async function saveTracking(id: string, trackingCode: string) {
    const res = await fetch("/api/admin/shipments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, trackingCode }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast(data.error || "Không lưu mã vận đơn", "error");
      return;
    }
    toast("Đã lưu mã vận đơn");
    await load();
  }

  async function cancelThisOrder() {
    const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: cancelReason }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Không huỷ được đơn", "error");
      return;
    }
    toast(data.alreadyCancelled ? "Đơn đã huỷ trước đó" : "Đã huỷ đơn");
    if (data.suggestInvoiceAdjustment) {
      toast("Đơn đã có hoá đơn gốc. Kế toán tạo hoá đơn điều chỉnh hoặc thay thế.");
    }
    await load();
  }

  async function openReturn() {
    if (!order) return;
    const res = await fetch("/api/admin/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        type: returnType,
        reason: returnReason,
        note: returnNote,
        orderItemIds: order.items.map((item) => item.id),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Không tạo được yêu cầu đổi trả", "error");
      return;
    }
    toast("Đã tạo yêu cầu đổi trả");
  }

  async function cancelShipment(id: string) {
    const res = await fetch("/api/admin/shipments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, cancel: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Không huỷ được kiện", "error");
      return;
    }
    toast("Đã huỷ kiện");
    await load();
  }

  if (loading) {
    return <AdminTableSkeleton rows={8} />;
  }

  if (!order) {
    return (
      <div>
        <AdminPageHeader
          title="Chi tiết đơn"
          breadcrumbs={[
            { href: "/admin", label: "Admin" },
            { href: "/admin/orders", label: "Đơn hàng" },
            { label: "…" },
          ]}
        />
        <p className="text-sm text-[var(--admin-danger)]" role="alert">
          {error || "Không tìm thấy đơn"}
        </p>
        <Link href="/admin/orders" className="mt-4 inline-block text-sm text-[var(--admin-accent)] hover:underline">
          ← Danh sách đơn
        </Link>
      </div>
    );
  }

  const created = new Date(order.createdAt);
  const updated = new Date(order.updatedAt);

  return (
    <div className="admin-order-detail" data-testid="admin-order-detail">
      <AdminPageHeader
        title={order.orderNumber}
        description={`Đặt lúc ${created.toLocaleString("vi-VN")}`}
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/orders", label: "Đơn hàng" },
          { label: order.orderNumber },
        ]}
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Link href={`/admin/van-chuyen/in/${order.id}`}>
              <AdminButton type="button" variant="secondary" size="sm">
                <Printer className="mr-1.5 h-4 w-4" />
                Phiếu kho
              </AdminButton>
            </Link>
            <AdminButton type="button" variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" />
              In đơn
            </AdminButton>
            <Link href="/admin/orders">
              <AdminButton type="button" variant="ghost" size="sm">
                ← Danh sách
              </AdminButton>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard className="print:border print:shadow-none">
          <h2 className="mb-3 text-sm font-semibold">Trạng thái & thanh toán</h2>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[var(--admin-text-muted)]">Trạng thái đơn</span>
            <AdminBadge tone={orderStatusTone(order.status)}>
              {ORDER_STATUS_LABELS[order.status]}
            </AdminBadge>
          </div>
          <div className="mt-3 print:hidden">
            <AdminSelect
              label="Cập nhật trạng thái"
              value={order.status}
              onChange={(e) => void updateStatus(e.target.value)}
            >
              {ORDER_STATUS_FLOW.filter((s) => s !== "CANCELLED" || order.status === "CANCELLED").map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </AdminSelect>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[var(--admin-text-muted)]">Thanh toán</span>
            <AdminBadge tone={order.paymentStatus === "PAID" ? "success" : "pending"}>
              {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </AdminBadge>
          </div>
          <p className="mt-1 text-sm">
            {PAYMENT_METHOD_LABELS[order.paymentMethod]}
            {order.paymentRef ? (
              <span className="text-[var(--admin-text-muted)]"> · Mã: {order.paymentRef}</span>
            ) : null}
          </p>
          {isPaymentOverdue({
            method: order.paymentMethod,
            status: order.status,
            paymentStatus: order.paymentStatus,
            dueAt: order.paymentDueAt ?? null,
          }) ? <p className="mt-2 text-sm font-medium text-[var(--admin-danger)]">Quá hạn thanh toán</p> : null}
          {isCodConfirmOverdue({
            method: order.paymentMethod,
            status: order.status,
            dueAt: order.paymentDueAt ?? null,
          }) ? <p className="mt-2 text-sm font-medium text-[var(--admin-danger)]">Quá hạn xác nhận COD</p> : null}
          {order.paymentConfirmedAt ? (
            <p className="mt-2 text-xs text-[var(--admin-text-muted)]">
              Đã xác nhận {new Date(order.paymentConfirmedAt).toLocaleString("vi-VN")}
              {order.paymentConfirmedById ? ` · ${order.paymentConfirmedById}` : ""}
            </p>
          ) : null}
          {order.paymentStatus !== "PAID" ? (
            <AdminButton
              variant="ghost"
              size="sm"
              className="mt-2 h-auto px-0 text-[var(--admin-accent)] print:hidden"
              onClick={() => void confirmPaid()}
            >
              Xác nhận đã nhận tiền
            </AdminButton>
          ) : null}
          {order.status === "COMPLETED" ? (
            <p className="mt-3 text-sm text-[var(--admin-text-muted)]">Đơn đã giao. Dùng luồng Đổi trả bên dưới, không huỷ đơn.</p>
          ) : order.status === "CANCELLED" ? (
            <p className="mt-3 text-sm">Đơn đã huỷ. Tồn kho chỉ được hoàn một lần.</p>
          ) : (
            <form
              className="mt-3 space-y-2 print:hidden"
              onSubmit={(e) => {
                e.preventDefault();
                void cancelThisOrder();
              }}
            >
              <label className="block text-sm">
                Lý do huỷ
                <input
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-1 w-full rounded border border-[var(--admin-border)] px-2 py-2"
                />
              </label>
              <AdminButton type="submit" size="sm" variant="secondary">Huỷ đơn</AdminButton>
            </form>
          )}
          {order.status === "CANCELLED" && order.invoices?.some((invoice) => invoice.type === "ORIGINAL" && invoice.status === "ISSUED") ? (
            <p className="mt-2 text-sm text-amber-800">Đơn đã có hoá đơn gốc đã phát hành. Kế toán tạo hoá đơn điều chỉnh hoặc thay thế ở mục Hoá đơn điện tử.</p>
          ) : null}
          <dl className="mt-4 space-y-1 border-t border-[var(--admin-border)] pt-3 text-sm text-[var(--admin-text-muted)]">
            <div className="flex justify-between gap-2">
              <dt>Đặt lúc</dt>
              <dd className="text-right text-neutral-800">{created.toLocaleString("vi-VN")}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Cập nhật lúc</dt>
              <dd className="text-right text-neutral-800">{updated.toLocaleString("vi-VN")}</dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard className="print:border print:shadow-none">
          <h2 className="mb-3 text-sm font-semibold">Khách hàng & giao hàng</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[var(--admin-text-muted)]">Loại khách</dt>
              <dd className="font-medium">
                {order.userId ? "Tài khoản đã đăng ký" : "Khách vãng lai (không đăng nhập)"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--admin-text-muted)]">Họ tên</dt>
              <dd className="font-medium">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-[var(--admin-text-muted)]">Điện thoại</dt>
              <dd>{order.customerPhone}</dd>
            </div>
            <div>
              <dt className="text-[var(--admin-text-muted)]">Email</dt>
              <dd>{order.customerEmail || order.user?.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--admin-text-muted)]">Địa chỉ giao</dt>
              <dd className="whitespace-pre-wrap">{order.address}</dd>
            </div>
            {order.note ? (
              <div>
                <dt className="text-[var(--admin-text-muted)]">Ghi chú khách</dt>
                <dd className="whitespace-pre-wrap">{order.note}</dd>
              </div>
            ) : null}
          </dl>
        </AdminCard>
      </div>

      <AdminCard className="mt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Kiện hàng</h2>
          <AdminButton
            type="button"
            size="sm"
            onClick={() => void createShipment(order)}
          >
            Tạo vận đơn
          </AdminButton>
        </div>
        {order.shipments?.length ? (
          <ul className="space-y-3 text-sm">
            {order.shipments.map((shipment) => (
              <li key={shipment.id} className="rounded border border-[var(--admin-border)] p-3">
                <p className="font-medium">{shipment.shipmentNumber} · {shipment.provider} · {shipment.status}</p>
                <p>Mã vận đơn: {shipment.trackingCode || "Chưa có"} · Phí {formatVnd(shipment.shippingFee || 0)} · COD {formatVnd(shipment.codAmount || 0)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    defaultValue={shipment.trackingCode || ""}
                    placeholder="Nhập mã vận đơn"
                    className="h-9 rounded border border-[var(--admin-border)] px-2"
                    onBlur={(e) => {
                      if (e.target.value.trim() !== (shipment.trackingCode || "")) {
                        void saveTracking(shipment.id, e.target.value);
                      }
                    }}
                  />
                  {shipment.status === "CREATED" ? (
                    <AdminButton type="button" size="sm" variant="secondary" onClick={() => void cancelShipment(shipment.id)}>
                      Huỷ kiện
                    </AdminButton>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--admin-text-muted)]">Chưa có kiện. Bấm tạo vận đơn để mở một kiện cho cả đơn.</p>
        )}
      </AdminCard>

      <AdminCard className="mt-4">
        <h2 className="mb-3 text-sm font-semibold">Lịch sử thanh toán</h2>
        {order.paymentAudits?.length ? (
          <ul className="space-y-2 text-sm">
            {order.paymentAudits.map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="rounded border border-[var(--admin-border)] p-3">
                <p className="font-medium">{entry.action}</p>
                <p className="text-[var(--admin-text-muted)]">{entry.at} · {entry.actor}</p>
                <p>{entry.amount == null ? "—" : formatVnd(entry.amount)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--admin-text-muted)]">{PAYMENT_AUDIT_EMPTY}</p>
        )}
      </AdminCard>

      <AdminCard className="mt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Hoá đơn điện tử</h2>
          <AdminButton type="button" size="sm" onClick={() => void postInvoice({ action: "issue", orderId: order.id })}>
            Tạo / Phát hành hóa đơn
          </AdminButton>
        </div>
        {order.invoiceCompanyName || order.invoiceTaxCode ? (
          <p className="mb-3 text-sm">
            Hoá đơn công ty: {order.invoiceCompanyName || "—"} · MST {order.invoiceTaxCode || "—"}
            {order.invoiceEmail ? ` · ${order.invoiceEmail}` : ""}
          </p>
        ) : (
          <p className="mb-3 text-sm text-[var(--admin-text-muted)]">Khách không yêu cầu hoá đơn công ty.</p>
        )}
        {order.invoices?.length ? (
          <ul className="space-y-2 text-sm">
            {order.invoices.map((invoice) => (
              <li key={invoice.id} className="rounded border border-[var(--admin-border)] p-3">
                <p className="font-medium">{invoice.type} · {invoice.status} · {invoice.invoiceNumber || "Chưa có số"}</p>
                <p>{invoice.buyerName}{invoice.buyerTaxCode ? ` · MST ${invoice.buyerTaxCode}` : ""} · {formatVnd(invoice.totalAmount)} · VAT {formatVnd(invoice.vatAmount)}</p>
                <p>Thử {invoice.retryCount}{invoice.lastError ? ` · ${invoice.lastError}` : ""}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {invoice.status === "FAILED" || invoice.status === "RETRYING" || invoice.status === "PENDING" ? (
                    <AdminButton type="button" size="sm" onClick={() => void postInvoice({ action: "retry", invoiceId: invoice.id })}>Thử lại</AdminButton>
                  ) : null}
                  {invoice.status === "ISSUED" ? (
                    <AdminButton type="button" size="sm" variant="secondary" onClick={() => void postInvoice({ action: "adjust", invoiceId: invoice.id, reason: "Điều chỉnh theo yêu cầu kế toán", amount: invoice.totalAmount })}>Điều chỉnh / Thay thế</AdminButton>
                  ) : null}
                  {invoice.lookupUrl ? <a href={invoice.lookupUrl} className="text-[var(--admin-accent)]">Tra cứu</a> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--admin-text-muted)]">Chưa có hoá đơn cho đơn này.</p>
        )}
      </AdminCard>

      <AdminCard className="mt-4 print:hidden">
        <h2 className="mb-3 text-sm font-semibold">Đổi trả & Hoàn tiền</h2>
        <p className="mb-3 text-sm text-[var(--admin-text-muted)]">
          Thời hạn mặc định 7 ngày kể từ khi giao. Lỗi sản phẩm hoặc giao sai do shop chịu phí; khách đổi ý thì khách chịu phí.
        </p>
        <form
          className="grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void openReturn();
          }}
        >
          <label className="text-sm">Loại
            <select value={returnType} onChange={(e) => setReturnType(e.target.value)} className="mt-1 w-full rounded border px-2 py-2">
              <option value="RETURN_REFUND">Trả hàng hoàn tiền</option>
              <option value="EXCHANGE">Đổi hàng</option>
            </select>
          </label>
          <label className="text-sm">Lý do
            <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="mt-1 w-full rounded border px-2 py-2">
              <option value="DEFECTIVE">Lỗi sản phẩm</option>
              <option value="WRONG_ITEM">Giao sai</option>
              <option value="CHANGE_OF_MIND">Đổi ý</option>
              <option value="OTHER">Khác</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">Ghi chú
            <input value={returnNote} onChange={(e) => setReturnNote(e.target.value)} className="mt-1 w-full rounded border px-2 py-2" />
          </label>
          <AdminButton type="submit" size="sm">Tạo yêu cầu</AdminButton>
          <Link href="/admin/doi-tra" className="text-sm text-[var(--admin-accent)]">Mở danh sách đổi trả</Link>
        </form>
      </AdminCard>

      <AdminCard className="mt-4 print:border print:shadow-none">
        <h2 className="mb-3 text-sm font-semibold">Sản phẩm trong đơn</h2>
        <AdminTable>
          <thead>
            <tr>
              <AdminTh className="w-14" />
              <AdminTh>Sản phẩm</AdminTh>
              <AdminTh>Màu</AdminTh>
              <AdminTh>Size</AdminTh>
              <AdminTh className="text-right">SL</AdminTh>
              <AdminTh className="text-right">Đơn giá</AdminTh>
              <AdminTh className="text-right">Thành tiền</AdminTh>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => {
              const img = orderItemImageUrl(item);
              const slug = item.variant?.product?.slug;
              const line = item.price * item.quantity;
              return (
                <AdminTr key={item.id}>
                  <AdminTd>
                    <div className="relative h-12 w-10 overflow-hidden rounded bg-neutral-100">
                      {img ? (
                        <StorefrontImage src={img} alt="" fill className="object-cover" sizes="40px" />
                      ) : null}
                    </div>
                  </AdminTd>
                  <AdminTd>
                    {slug ? (
                      <Link
                        href={`/san-pham/${slug}`}
                        className="font-medium text-[var(--admin-accent)] hover:underline print:text-neutral-900 print:no-underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </AdminTd>
                  <AdminTd>{item.color || "—"}</AdminTd>
                  <AdminTd>{item.size || "—"}</AdminTd>
                  <AdminTd className="text-right">{item.quantity}</AdminTd>
                  <AdminTd className="text-right">{formatVnd(item.price)}</AdminTd>
                  <AdminTd className="text-right font-medium">{formatVnd(line)}</AdminTd>
                </AdminTr>
              );
            })}
          </tbody>
        </AdminTable>

        <dl className="mt-4 ml-auto max-w-xs space-y-1 border-t border-[var(--admin-border)] pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--admin-text-muted)]">Tạm tính</dt>
            <dd>{formatVnd(order.subtotal)}</dd>
          </div>
          {order.couponCode ? (
            <div className="flex justify-between text-[var(--admin-accent)]">
              <dt>Mã {order.couponCode}</dt>
              <dd>-{formatVnd(order.discount)}</dd>
            </div>
          ) : order.discount > 0 ? (
            <div className="flex justify-between">
              <dt className="text-[var(--admin-text-muted)]">Giảm giá</dt>
              <dd>-{formatVnd(order.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-[var(--admin-text-muted)]">Phí vận chuyển</dt>
            <dd>{formatVnd(order.shippingFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-[var(--admin-border)] pt-2 text-base font-semibold">
            <dt>Tổng cộng</dt>
            <dd>{formatVnd(order.total)}</dd>
          </div>
        </dl>
      </AdminCard>
    </div>
  );
}
