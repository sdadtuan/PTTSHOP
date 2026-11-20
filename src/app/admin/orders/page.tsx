"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminInput,
  AdminPageHeader,
  AdminPagination,
  AdminSelect,
  AdminTable,
  AdminTableSkeleton,
  AdminTd,
  AdminTh,
  AdminTr,
  orderStatusTone,
  paginate,
  useAdminToast,
} from "@/components/admin/ui";
import Link from "next/link";
import { formatVnd } from "@/lib/format";
import { orderLineSummary } from "@/lib/admin-orders";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/lib/order-status";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: keyof typeof ORDER_STATUS_LABELS;
  createdAt: string;
  items?: { name: string; quantity: number }[];
};

export default function AdminOrdersPage() {
  const { toast } = useAdminToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không tải được đơn hàng");
      setLoading(false);
      return;
    }
    setError("");
    setOrders(data.orders || []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== "ALL" && o.status !== status) return false;
      if (!query) return true;
      return (
        o.orderNumber.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query) ||
        o.customerPhone.toLowerCase().includes(query)
      );
    });
  }, [orders, q, status]);

  const paged = paginate(filtered, page, 10);

  async function updateStatus(id: string, next: string) {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Cập nhật thất bại");
      toast(data.error || "Cập nhật thất bại", "error");
      return;
    }
    toast("Đã cập nhật trạng thái đơn");
    await load();
  }

  async function confirmPaid(id: string) {
    if (!confirm("Xác nhận đã nhận tiền / chuyển khoản cho đơn này?")) return;
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, paymentStatus: "PAID", confirmPaid: true }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Không cập nhật được thanh toán");
      toast(data.error || "Không cập nhật được thanh toán", "error");
      return;
    }
    toast("Đã xác nhận thanh toán");
    await load();
  }

  return (
    <div>
      <AdminPageHeader
        title="Đơn hàng"
        description="Theo dõi và cập nhật trạng thái đơn"
        breadcrumbs={[{ href: "/admin", label: "Admin" }, { label: "Đơn hàng" }]}
      />

      <AdminCard className="mb-4" padding={false}>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <AdminInput
              label="Tìm kiếm"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Mã đơn, tên, SĐT…"
            />
          </div>
          <div className="sm:w-52">
            <AdminSelect
              label="Trạng thái"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Tất cả</option>
              {ORDER_STATUS_FLOW.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </AdminSelect>
          </div>
        </div>
      </AdminCard>

      {error ? (
        <p className="mb-4 rounded-[var(--admin-radius-md)] border border-red-200 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <AdminTableSkeleton rows={6} />
      ) : paged.items.length === 0 ? (
        <AdminEmptyState title="Không có đơn hàng" description="Thử đổi bộ lọc hoặc từ khóa tìm kiếm." />
      ) : (
        <>
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Mã</AdminTh>
                <AdminTh>Khách</AdminTh>
                <AdminTh>Tổng</AdminTh>
                <AdminTh>TT</AdminTh>
                <AdminTh>Thanh toán</AdminTh>
                <AdminTh>Trạng thái</AdminTh>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((o) => {
                const summary = orderLineSummary(o.items ?? []);
                return (
                <AdminTr key={o.id} className="hover:bg-[var(--admin-surface-soft)]">
                  <AdminTd>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="block font-medium text-[var(--admin-accent)] hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    {o.items?.length ? (
                      <div className="mt-0.5 text-xs text-[var(--admin-text-muted)]">{summary.label}</div>
                    ) : null}
                  </AdminTd>
                  <AdminTd>
                    <Link href={`/admin/orders/${o.id}`} className="block min-w-0">
                      <div>{o.customerName}</div>
                      <div className="text-xs text-[var(--admin-text-muted)]">{o.customerPhone}</div>
                    </Link>
                  </AdminTd>
                  <AdminTd>{formatVnd(o.total)}</AdminTd>
                  <AdminTd>{o.paymentMethod}</AdminTd>
                  <AdminTd>
                    <div
                      onClick={(e: MouseEvent) => e.stopPropagation()}
                    >
                    <AdminBadge tone={o.paymentStatus === "PAID" ? "success" : "pending"}>
                      {o.paymentStatus}
                    </AdminBadge>
                    {o.paymentStatus !== "PAID" ? (
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-auto px-0 text-[var(--admin-accent)]"
                        onClick={() => void confirmPaid(o.id)}
                      >
                        Xác nhận đã nhận tiền
                      </AdminButton>
                    ) : null}
                    </div>
                  </AdminTd>
                  <AdminTd>
                    <div onClick={(e: MouseEvent) => e.stopPropagation()}>
                    <div className="mb-2">
                      <AdminBadge tone={orderStatusTone(o.status)}>
                        {ORDER_STATUS_LABELS[o.status]}
                      </AdminBadge>
                    </div>
                    <AdminSelect
                      value={o.status}
                      aria-label={`Trạng thái đơn ${o.orderNumber}`}
                      onChange={(e) => void updateStatus(o.id, e.target.value)}
                    >
                      {ORDER_STATUS_FLOW.map((s) => (
                        <option key={s} value={s}>
                          {ORDER_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </AdminSelect>
                    </div>
                  </AdminTd>
                </AdminTr>
              );
              })}
            </tbody>
          </AdminTable>
          <div className="mt-4">
            <AdminPagination page={paged.page} totalPages={paged.totalPages} total={paged.total} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}