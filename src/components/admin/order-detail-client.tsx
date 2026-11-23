"use client";

import Link from "next/link";
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
import { formatVnd } from "@/lib/format";
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
              {ORDER_STATUS_FLOW.map((s) => (
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
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="h-full w-full object-cover" />
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
