"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CategoryProductPicker, type CategoryOpt, type ProductOpt } from "@/components/admin/category-product-picker";
import {
  ReviewSearchCombobox,
  type ReviewSearchSuggestion,
} from "@/components/admin/review-search-combobox";
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

export default function AdminReviewsPage() {
  const { toast } = useAdminToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<CategoryOpt[]>([]);
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [reviewers, setReviewers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterProductId, setFilterProductId] = useState("");
  const [filterRating, setFilterRating] = useState("");
  const [filterPublished, setFilterPublished] = useState<"" | "1" | "0">("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editReview, setEditReview] = useState<Review | null>(null);
  const [saving, setSaving] = useState(false);
  const [addCategoryId, setAddCategoryId] = useState("");
  const [addProductId, setAddProductId] = useState("");
  const [addProductQuery, setAddProductQuery] = useState("");

  const suggestions = useMemo((): ReviewSearchSuggestion[] => {
    const items: ReviewSearchSuggestion[] = [];
    for (const c of categories) {
      items.push({
        key: `cat-${c.id}`,
        kind: "category",
        label: c.name,
        categoryId: c.id,
      });
    }
    for (const p of products) {
      if ((p.reviewCount ?? 0) === 0) continue;
      items.push({
        key: `prod-${p.id}`,
        kind: "product",
        label: p.name,
        productId: p.id,
        categoryId: p.categoryId || undefined,
        meta: p.category?.name
          ? `${p.category.name} · ${p.reviewCount} đánh giá`
          : `${p.reviewCount} đánh giá`,
      });
    }
    for (const name of reviewers) {
      items.push({ key: `rev-${name}`, kind: "reviewer", label: name, meta: "Người đánh giá" });
    }
    return items;
  }, [categories, products, reviewers]);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (filterPublished) sp.set("published", filterPublished);
    if (filterCategoryId) sp.set("categoryId", filterCategoryId);
    if (filterProductId) sp.set("productId", filterProductId);
    if (filterRating) sp.set("rating", filterRating);
    if (q.trim()) sp.set("q", q.trim());
    const res = await fetch(`/api/admin/reviews?${sp}`);
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không tải được đánh giá");
    else {
      setError("");
      setReviews(data.reviews || []);
    }
    setLoading(false);
  }, [filterPublished, filterCategoryId, filterProductId, filterRating, q]);

  useEffect(() => {
    void fetch("/api/admin/reviews/meta")
      .then((r) => r.json())
      .then((d) => {
        if (d.categories) setCategories(d.categories);
        if (d.products) setProducts(d.products);
        if (d.reviewers) setReviewers(d.reviewers);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), q.trim() ? 280 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const paged = paginate(reviews, page, 10);

  function handleSearchPick(item: ReviewSearchSuggestion) {
    if (item.kind === "category" && item.categoryId) {
      setFilterCategoryId(item.categoryId);
      setFilterProductId("");
      setQ("");
    } else if (item.kind === "product" && item.productId) {
      if (item.categoryId) setFilterCategoryId(item.categoryId);
      setFilterProductId(item.productId);
      setQ("");
    } else if (item.kind === "reviewer") {
      setQ(item.label);
    }
    setPage(1);
  }

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
    if (!addProductId) {
      toast("Chọn sản phẩm", "error");
      return;
    }
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const createdAtRaw = String(form.get("createdAt") || "");
    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: addProductId,
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
    setAddCategoryId("");
    setAddProductId("");
    setAddProductQuery("");
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

  const closeAddModal = useCallback(() => {
    if (!saving) setAddOpen(false);
  }, [saving]);

  const closeEditModal = useCallback(() => {
    if (!saving) setEditReview(null);
  }, [saving]);

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

      <AdminCard className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <ReviewSearchCombobox
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          suggestions={suggestions}
          onPick={handleSearchPick}
        />
        <CategoryProductPicker
          categories={categories}
          products={products}
          categoryId={filterCategoryId}
          productId={filterProductId}
          onCategoryIdChange={(id) => {
            setFilterCategoryId(id);
            setFilterProductId("");
            setPage(1);
          }}
          onProductIdChange={(id) => {
            setFilterProductId(id);
            setPage(1);
          }}
          onlyWithReviews
        />
        <AdminSelect
          label="Số sao"
          value={filterRating}
          onChange={(e) => {
            setFilterRating(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={String(n)}>
              {n} sao
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Trạng thái"
          value={filterPublished}
          onChange={(e) => {
            setFilterPublished(e.target.value as "" | "1" | "0");
            setPage(1);
          }}
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
        onClose={closeAddModal}
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
          <CategoryProductPicker
            categories={categories}
            products={products}
            categoryId={addCategoryId}
            productId={addProductId}
            onCategoryIdChange={setAddCategoryId}
            onProductIdChange={setAddProductId}
            productQuery={addProductQuery}
            onProductQueryChange={setAddProductQuery}
            required
          />
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
        onClose={closeEditModal}
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