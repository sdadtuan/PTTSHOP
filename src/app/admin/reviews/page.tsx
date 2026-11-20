"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminInput,
  AdminModal,
  AdminPageHeader,
  AdminPagination,
  AdminSelect,
  AdminTable,
  AdminTableSkeleton,
  AdminTd,
  AdminTextarea,
  AdminTh,
  AdminTr,
  paginate,
  useAdminToast,
} from "@/components/admin/ui";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  isPublished: boolean;
  isAdminCreated: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  userName: string;
  user: { name: string | null; email: string } | null;
  product: { id: string; name: string; slug: string };
};

type ProductOption = { id: string; name: string; slug: string };

export default function AdminReviewsPage() {
  const { toast } = useAdminToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterPublished, setFilterPublished] = useState<"" | "1" | "0">("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editReview, setEditReview] = useState<Review | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (filterPublished) sp.set("published", filterPublished);
    const res = await fetch(`/api/admin/reviews?${sp}`);
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không tải được đánh giá");
    else {
      setError("");
      setReviews(data.reviews || []);
    }
    setLoading(false);
  }, [filterPublished]);

  useEffect(() => {
    void load();
    void fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.products || []).map((p: ProductOption) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
        }));
        setProducts(list);
      })
      .catch(() => {});
  }, [load]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return reviews;
    return reviews.filter(
      (r) =>
        r.product.name.toLowerCase().includes(query) ||
        r.userName.toLowerCase().includes(query) ||
        (r.user?.email || "").toLowerCase().includes(query) ||
        (r.comment || "").toLowerCase().includes(query),
    );
  }, [reviews, q]);

  const paged = paginate(filtered, page, 10);

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteId }),
    });
    setDeleting(false);
    setDeleteId(null);
    if (!res.ok) {
      const data = await res.json();
      toast(data.error || "Xóa thất bại", "error");
      return;
    }
    toast("Đã xóa đánh giá");
    await load();
  }

  async function togglePublished(r: Review) {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, isPublished: !r.isPublished }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast(data.error || "Cập nhật thất bại", "error");
      return;
    }
    toast(r.isPublished ? "Đã ẩn đánh giá" : "Đã hiện đánh giá");
    await load();
  }

  async function onAddSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const createdAtRaw = String(form.get("createdAt") || "");
    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: String(form.get("productId")),
        displayName: String(form.get("displayName")),
        rating: Number(form.get("rating")),
        comment: String(form.get("comment") || ""),
        avatarUrl: String(form.get("avatarUrl") || "") || null,
        isPublished: form.get("isPublished") === "on",
        ...(createdAtRaw ? { createdAt: new Date(createdAtRaw).toISOString() } : {}),
      }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Tạo thất bại", "error");
      return;
    }
    toast("Đã thêm đánh giá");
    setAddOpen(false);
    await load();
  }

  async function onEditSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editReview) return;
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const createdAtRaw = String(form.get("createdAt") || "");
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editReview.id,
        displayName: String(form.get("displayName")),
        rating: Number(form.get("rating")),
        comment: String(form.get("comment") || ""),
        avatarUrl: String(form.get("avatarUrl") || "") || null,
        isPublished: form.get("isPublished") === "on",
        ...(createdAtRaw ? { createdAt: new Date(createdAtRaw).toISOString() } : {}),
      }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Lưu thất bại", "error");
      return;
    }
    toast("Đã lưu đánh giá");
    setEditReview(null);
    await load();
  }

  return (
    <div>
      <AdminPageHeader
        title="Đánh giá"
        description="Xem, thêm, ẩn/hiện hoặc xóa đánh giá. Điểm sản phẩm chỉ tính đánh giá đang hiển thị."
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { label: "Đánh giá" },
        ]}
        actions={
          <AdminButton type="button" variant="accent" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Thêm đánh giá
          </AdminButton>
        }
      />

      <AdminCard className="mb-4 grid gap-3 md:grid-cols-3">
        <AdminInput
          label="Tìm kiếm"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Sản phẩm, khách, nội dung…"
        />
        <AdminSelect
          label="Trạng thái"
          value={filterPublished}
          onChange={(e) => setFilterPublished(e.target.value as "" | "1" | "0")}
        >
          <option value="">Tất cả</option>
          <option value="1">Đang hiện</option>
          <option value="0">Đang ẩn</option>
        </AdminSelect>
      </AdminCard>

      {error ? (
        <p className="mb-4 text-sm text-[var(--admin-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <AdminTableSkeleton />
      ) : paged.items.length === 0 ? (
        <AdminEmptyState title="Chưa có đánh giá" description="Thêm đánh giá thủ công hoặc chờ khách gửi từ PDP." />
      ) : (
        <>
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Sản phẩm</AdminTh>
                <AdminTh>Người đánh giá</AdminTh>
                <AdminTh>Sao</AdminTh>
                <AdminTh>Nội dung</AdminTh>
                <AdminTh>Trạng thái</AdminTh>
                <AdminTh />
              </tr>
            </thead>
            <tbody>
              {paged.items.map((r) => (
                <AdminTr key={r.id}>
                  <AdminTd>
                    <Link href={`/san-pham/${r.product.slug}`} className="font-medium hover:text-[var(--admin-accent)]">
                      {r.product.name}
                    </Link>
                    <p className="text-xs text-[var(--admin-text-muted)]">
                      {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </AdminTd>
                  <AdminTd>
                    <p>{r.userName}</p>
                    {r.isAdminCreated ? (
                      <AdminBadge tone="info">Admin tạo</AdminBadge>
                    ) : (
                      <span className="text-xs text-[var(--admin-text-muted)]">{r.user?.email}</span>
                    )}
                  </AdminTd>
                  <AdminTd>
                    <AdminBadge tone="accent">★ {r.rating}</AdminBadge>
                  </AdminTd>
                  <AdminTd className="max-w-xs truncate text-[var(--admin-text-muted)]">
                    {r.comment || "—"}
                  </AdminTd>
                  <AdminTd>
                    <AdminBadge tone={r.isPublished ? "success" : "pending"}>
                      {r.isPublished ? "Hiện" : "Ẩn"}
                    </AdminBadge>
                  </AdminTd>
                  <AdminTd>
                    <div className="flex flex-wrap justify-end gap-1">
                      <AdminButton variant="ghost" size="sm" onClick={() => setEditReview(r)}>
                        Sửa
                      </AdminButton>
                      <AdminButton variant="ghost" size="sm" onClick={() => void togglePublished(r)}>
                        {r.isPublished ? "Ẩn" : "Hiện"}
                      </AdminButton>
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        className="text-[var(--admin-danger)]"
                        onClick={() => setDeleteId(r.id)}
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
            <AdminPagination page={paged.page} totalPages={paged.totalPages} total={paged.total} onChange={setPage} />
          </div>
        </>
      )}

      <AdminModal
        open={addOpen}
        onClose={() => !saving && setAddOpen(false)}
        title="Thêm đánh giá (admin)"
        footer={
          <>
            <AdminButton type="button" variant="ghost" onClick={() => setAddOpen(false)} disabled={saving}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" form="admin-review-add" variant="accent" disabled={saving}>
              {saving ? "Đang lưu…" : "Thêm"}
            </AdminButton>
          </>
        }
      >
        <form id="admin-review-add" onSubmit={onAddSubmit} className="space-y-3">
          <AdminSelect name="productId" label="Sản phẩm" required defaultValue="">
            <option value="" disabled>
              Chọn sản phẩm
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </AdminSelect>
          <AdminInput name="displayName" label="Tên hiển thị" required placeholder="VD: Minh Anh" />
          <AdminSelect name="rating" label="Số sao" defaultValue="5">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} sao
              </option>
            ))}
          </AdminSelect>
          <AdminTextarea name="comment" label="Nội dung" rows={3} />
          <AdminInput name="avatarUrl" label="URL ảnh đại diện (tùy chọn)" />
          <AdminInput name="createdAt" type="datetime-local" label="Ngày hiển thị (tùy chọn)" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPublished" defaultChecked />
            Hiển thị trên cửa hàng
          </label>
        </form>
      </AdminModal>

      <AdminModal
        open={Boolean(editReview)}
        onClose={() => !saving && setEditReview(null)}
        title="Sửa đánh giá"
        footer={
          <>
            <AdminButton type="button" variant="ghost" onClick={() => setEditReview(null)} disabled={saving}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" form="admin-review-edit" variant="accent" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu"}
            </AdminButton>
          </>
        }
      >
        {editReview ? (
          <form id="admin-review-edit" onSubmit={onEditSubmit} className="space-y-3">
            <p className="text-sm text-[var(--admin-text-muted)]">Sản phẩm: {editReview.product.name}</p>
            <AdminInput
              name="displayName"
              label="Tên hiển thị"
              defaultValue={editReview.displayName || editReview.userName}
              required
            />
            <AdminSelect name="rating" label="Số sao" defaultValue={String(editReview.rating)}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} sao
                </option>
              ))}
            </AdminSelect>
            <AdminTextarea name="comment" label="Nội dung" rows={3} defaultValue={editReview.comment || ""} />
            <AdminInput name="avatarUrl" label="URL ảnh" defaultValue={editReview.avatarUrl || ""} />
            <AdminInput
              name="createdAt"
              type="datetime-local"
              label="Ngày hiển thị"
              defaultValue={editReview.createdAt.slice(0, 16)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPublished" defaultChecked={editReview.isPublished} />
              Hiển thị trên cửa hàng
            </label>
          </form>
        ) : null}
      </AdminModal>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Xóa đánh giá?"
        description="Đánh giá sẽ bị gỡ và điểm sản phẩm được tính lại."
        loading={deleting}
      />
    </div>
  );
}