"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
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
  paginate,
  useAdminToast,
} from "@/components/admin/ui";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrder: number;
  usedCount: number;
  maxUses: number | null;
  isActive: boolean;
};

export default function AdminCouponsPage() {
  const { toast } = useAdminToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không tải được mã giảm");
    else {
      setError("");
      setCoupons(data.coupons || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return coupons;
    return coupons.filter(
      (c) =>
        c.code.toLowerCase().includes(query) ||
        (c.description || "").toLowerCase().includes(query),
    );
  }, [coupons, q]);

  const paged = paginate(filtered, page, 10);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: String(form.get("code") || ""),
        description: String(form.get("description") || ""),
        discountType: String(form.get("discountType") || "PERCENT"),
        discountValue: Number(form.get("discountValue") || 0),
        minOrder: Number(form.get("minOrder") || 0),
        maxUses: form.get("maxUses") ? Number(form.get("maxUses")) : null,
        isActive: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Tạo thất bại");
      toast(data.error || "Tạo thất bại", "error");
      return;
    }
    e.currentTarget.reset();
    toast("Đã thêm mã giảm");
    await load();
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    toast(isActive ? "Đã bật mã" : "Đã tắt mã");
    await load();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch("/api/admin/coupons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteId }),
    });
    setDeleting(false);
    setDeleteId(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Xóa thất bại");
      toast(data.error || "Xóa thất bại", "error");
      return;
    }
    toast("Đã xóa mã");
    await load();
  }

  return (
    <div>
      <AdminPageHeader
        title="Mã giảm giá"
        description="Tạo và quản lý coupon cửa hàng"
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { label: "Mã giảm" },
        ]}
      />

      <AdminCard className="mb-4">
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-3">
          <AdminInput name="code" required label="Mã" placeholder="SALE10" />
          <AdminInput name="description" label="Mô tả" />
          <AdminSelect name="discountType" label="Loại">
            <option value="PERCENT">PERCENT</option>
            <option value="FIXED">FIXED</option>
          </AdminSelect>
          <AdminInput name="discountValue" type="number" required label="Giá trị" />
          <AdminInput name="minOrder" type="number" label="Đơn tối thiểu" defaultValue={0} />
          <AdminInput name="maxUses" type="number" label="Giới hạn lượt" />
          <div className="sm:col-span-3">
            <AdminButton type="submit" variant="accent">
              Thêm mã
            </AdminButton>
          </div>
        </form>
      </AdminCard>

      <AdminCard className="mb-4">
        <AdminInput
          label="Tìm kiếm"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Mã hoặc mô tả…"
        />
      </AdminCard>

      {error ? (
        <p
          className="mb-4 rounded-[var(--admin-radius-md)] border border-red-200 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <AdminTableSkeleton />
      ) : paged.items.length === 0 ? (
        <AdminEmptyState title="Chưa có mã giảm" description="Thêm mã mới ở form phía trên." />
      ) : (
        <>
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Mã</AdminTh>
                <AdminTh>Giảm</AdminTh>
                <AdminTh>Đã dùng</AdminTh>
                <AdminTh>Trạng thái</AdminTh>
                <AdminTh />
              </tr>
            </thead>
            <tbody>
              {paged.items.map((c) => (
                <AdminTr key={c.id}>
                  <AdminTd>
                    <div className="font-medium">{c.code}</div>
                    <div className="text-xs text-[var(--admin-text-muted)]">
                      {c.description || "—"} · min {c.minOrder}đ
                    </div>
                  </AdminTd>
                  <AdminTd>
                    {c.discountType} {c.discountValue}
                  </AdminTd>
                  <AdminTd>
                    {c.usedCount}
                    {c.maxUses != null ? `/${c.maxUses}` : ""}
                  </AdminTd>
                  <AdminTd>
                    <AdminBadge tone={c.isActive ? "success" : "neutral"}>
                      {c.isActive ? "Đang bật" : "Đã tắt"}
                    </AdminBadge>
                  </AdminTd>
                  <AdminTd>
                    <div className="flex gap-2">
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        onClick={() => void toggle(c.id, !c.isActive)}
                      >
                        {c.isActive ? "Tắt" : "Bật"}
                      </AdminButton>
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        className="text-[var(--admin-danger)]"
                        onClick={() => setDeleteId(c.id)}
                      >
                        Xóa
                      </AdminButton>
                    </div>
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>
          <div className="mt-4">
            <AdminPagination
              page={paged.page}
              totalPages={paged.totalPages}
              total={paged.total}
              onChange={setPage}
            />
          </div>
        </>
      )}

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Xóa mã giảm?"
        description="Mã sẽ không còn dùng được cho đơn mới."
        loading={deleting}
      />
    </div>
  );
}
