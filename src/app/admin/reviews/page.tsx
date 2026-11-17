"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminInput,
  AdminPageHeader,
  AdminPagination,
  AdminTable,
  AdminTableSkeleton,
  AdminTd,
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
  user: { name: string | null; email: string };
  product: { name: string; slug: string };
};

export default function AdminReviewsPage() {
  const { toast } = useAdminToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/reviews");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không tải được đánh giá");
    else {
      setError("");
      setReviews(data.reviews || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return reviews;
    return reviews.filter(
      (r) =>
        r.product.name.toLowerCase().includes(query) ||
        (r.user.name || "").toLowerCase().includes(query) ||
        r.user.email.toLowerCase().includes(query) ||
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
      setError(data.error || "Xóa thất bại");
      toast(data.error || "Xóa thất bại", "error");
      return;
    }
    toast("Đã xóa đánh giá");
    await load();
  }

  return (
    <div>
      <AdminPageHeader
        title="Đánh giá"
        description="Kiểm duyệt phản hồi từ khách hàng"
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { label: "Đánh giá" },
        ]}
      />

      <AdminCard className="mb-4">
        <AdminInput
          label="Tìm kiếm"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Sản phẩm, khách, nội dung…"
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
        <AdminEmptyState title="Chưa có đánh giá" description="Khi khách gửi review, chúng sẽ hiện tại đây." />
      ) : (
        <>
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Sản phẩm</AdminTh>
                <AdminTh>Khách</AdminTh>
                <AdminTh>Sao</AdminTh>
                <AdminTh>Nội dung</AdminTh>
                <AdminTh />
              </tr>
            </thead>
            <tbody>
              {paged.items.map((r) => (
                <AdminTr key={r.id}>
                  <AdminTd>
                    <Link
                      href={`/san-pham/${r.product.slug}`}
                      className="font-medium hover:text-[var(--admin-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/30"
                    >
                      {r.product.name}
                    </Link>
                    <p className="text-xs text-[var(--admin-text-muted)]">
                      {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </AdminTd>
                  <AdminTd>{r.user.name || r.user.email}</AdminTd>
                  <AdminTd>
                    <AdminBadge tone="accent">★ {r.rating}</AdminBadge>
                  </AdminTd>
                  <AdminTd className="max-w-xs truncate text-[var(--admin-text-muted)]">
                    {r.comment || "—"}
                  </AdminTd>
                  <AdminTd>
                    <AdminButton
                      variant="ghost"
                      size="sm"
                      className="text-[var(--admin-danger)]"
                      onClick={() => setDeleteId(r.id)}
                    >
                      Xóa
                    </AdminButton>
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
        title="Xóa đánh giá?"
        description="Đánh giá sẽ bị gỡ khỏi trang sản phẩm."
        loading={deleting}
      />
    </div>
  );
}
