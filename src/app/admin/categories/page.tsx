"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
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

type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count?: { products: number };
};

export default function AdminCategoriesPage() {
  const { toast } = useAdminToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không tải được danh mục");
    else {
      setError("");
      setCategories(data.categories || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.slug.toLowerCase().includes(query),
    );
  }, [categories, q]);

  const paged = paginate(filtered, page, 10);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") || ""),
        slug: String(form.get("slug") || "")
          .toLowerCase()
          .replace(/\s+/g, "-"),
        sortOrder: Number(form.get("sortOrder") || 0),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Tạo thất bại");
      toast(data.error || "Tạo thất bại", "error");
      return;
    }
    e.currentTarget.reset();
    toast("Đã thêm danh mục");
    await load();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch("/api/admin/categories", {
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
    toast("Đã xóa danh mục");
    await load();
  }

  return (
    <div>
      <AdminPageHeader
        title="Danh mục"
        description="Nhóm sản phẩm trên storefront"
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { label: "Danh mục" },
        ]}
      />

      <AdminCard className="mb-4">
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-4">
          <AdminInput name="name" required label="Tên" />
          <AdminInput name="slug" required label="Slug" />
          <AdminInput name="sortOrder" type="number" label="Thứ tự" defaultValue={0} />
          <div className="flex items-end">
            <AdminButton type="submit" variant="accent" className="w-full sm:w-auto">
              Thêm
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
          placeholder="Tên hoặc slug…"
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
        <AdminEmptyState title="Chưa có danh mục" description="Thêm danh mục đầu tiên ở form trên." />
      ) : (
        <>
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Tên</AdminTh>
                <AdminTh>Slug</AdminTh>
                <AdminTh>SP</AdminTh>
                <AdminTh>Thứ tự</AdminTh>
                <AdminTh />
              </tr>
            </thead>
            <tbody>
              {paged.items.map((c) => (
                <AdminTr key={c.id}>
                  <AdminTd className="font-medium">{c.name}</AdminTd>
                  <AdminTd className="text-[var(--admin-text-muted)]">{c.slug}</AdminTd>
                  <AdminTd>{c._count?.products ?? 0}</AdminTd>
                  <AdminTd>{c.sortOrder}</AdminTd>
                  <AdminTd>
                    <AdminButton
                      variant="ghost"
                      size="sm"
                      className="text-[var(--admin-danger)]"
                      onClick={() => setDeleteId(c.id)}
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
        title="Xóa danh mục?"
        description="Chỉ xóa khi danh mục không còn sản phẩm gắn kèm."
        loading={deleting}
      />
    </div>
  );
}
