"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
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
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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
        slug: String(form.get("slug") || "").trim() || undefined,
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

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editCat) return;
    setSavingEdit(true);
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editCat.id, name: editName.trim() }),
    });
    setSavingEdit(false);
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Cập nhật thất bại", "error");
      return;
    }
    toast("Đã đổi tên danh mục");
    setEditCat(null);
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
          <AdminInput name="slug" label="Slug (tùy chọn)" placeholder="Để trống = tự tạo từ tên" />
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
                    <div className="flex justify-end gap-1">
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        aria-label="Đổi tên"
                        onClick={() => {
                          setEditCat(c);
                          setEditName(c.name);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </AdminButton>
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        className="text-[var(--admin-danger)]"
                        disabled={(c._count?.products ?? 0) > 0}
                        title={
                          (c._count?.products ?? 0) > 0
                            ? "Chuyển sản phẩm sang danh mục khác trước khi xóa"
                            : undefined
                        }
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

      {editCat ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-neutral-900/40 p-4">
          <div className="w-full max-w-md rounded-[var(--admin-radius-xl)] border border-[var(--admin-border)] bg-white p-5 shadow-lg">
            <h3 className="type-title text-lg font-semibold">Đổi tên danh mục</h3>
            <form onSubmit={saveEdit} className="mt-4 space-y-3">
              <AdminInput
                label="Tên"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                autoFocus
              />
              <p className="text-xs text-[var(--admin-text-muted)]">
                Slug: <span className="font-mono">{editCat.slug}</span> — đổi slug trong form sản phẩm «Đổi tên» nếu cần.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <AdminButton type="button" variant="ghost" onClick={() => setEditCat(null)}>
                  Hủy
                </AdminButton>
                <AdminButton type="submit" variant="accent" disabled={savingEdit}>
                  {savingEdit ? "Đang lưu…" : "Lưu"}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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
