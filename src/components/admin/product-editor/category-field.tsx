"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import {
  AdminButton,
  AdminInput,
  AdminModal,
  AdminSelect,
  useAdminToast,
} from "@/components/admin/ui";
import { slugify } from "@/lib/slug";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
};

type Props = {
  categoryId: string;
  categories: AdminCategory[];
  onCategoryIdChange: (id: string) => void;
  onCategoriesUpdated: (categories: AdminCategory[]) => void;
};

export function CategoryField({
  categoryId,
  categories,
  onCategoryIdChange,
  onCategoriesUpdated,
}: Props) {
  const { toast } = useAdminToast();
  const [addOpen, setAddOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [renameSlug, setRenameSlug] = useState("");
  const [renameSlugTouched, setRenameSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  );

  const addSlugPreview = useMemo(
    () => slugify(newName, { fallback: "danh-muc" }),
    [newName],
  );

  async function refreshCategories(): Promise<AdminCategory[]> {
    const res = await fetch("/api/admin/categories");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Không tải được danh mục");
    const list = (data.categories || []) as AdminCategory[];
    onCategoriesUpdated(list);
    return list;
  }

  async function onAddSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Tạo danh mục thất bại");
      const created = data.category as AdminCategory;
      await refreshCategories();
      onCategoryIdChange(created.id);
      toast(`Đã thêm danh mục «${created.name}»`);
      setAddOpen(false);
      setNewName("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Tạo danh mục thất bại", "error");
    } finally {
      setSaving(false);
    }
  }

  function openRename() {
    if (!selected) return;
    setRenameName(selected.name);
    setRenameSlug(selected.slug);
    setRenameSlugTouched(false);
    setRenameOpen(true);
  }

  async function onRenameSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const slug = renameSlugTouched
        ? slugify(renameSlug, { fallback: selected.slug })
        : undefined;
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          name: renameName.trim(),
          ...(slug ? { slug } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Cập nhật thất bại");
      await refreshCategories();
      toast("Đã cập nhật danh mục");
      setRenameOpen(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Cập nhật thất bại", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <div className="space-y-2 sm:col-span-2">
      <AdminSelect
        name="categoryId"
        label="Danh mục"
        value={categoryId}
        onChange={(e) => onCategoryIdChange(e.target.value)}
      >
        <option value="">— Danh mục —</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </AdminSelect>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <AdminButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Thêm danh mục
        </AdminButton>
        {selected ? (
          <AdminButton type="button" variant="ghost" size="sm" onClick={openRename}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Đổi tên
          </AdminButton>
        ) : null}
        <Link
          href="/admin/categories"
          className="text-[var(--admin-accent)] hover:underline"
        >
          Quản lý danh mục
        </Link>
      </div>
    </div>

    <AdminModal
      open={addOpen}
      onClose={() => !saving && setAddOpen(false)}
      title="Thêm danh mục mới"
      footer={
        <>
          <AdminButton type="button" variant="ghost" onClick={() => setAddOpen(false)} disabled={saving}>
            Hủy
          </AdminButton>
          <AdminButton type="submit" form="pe-add-category" variant="accent" disabled={saving}>
            {saving ? "Đang lưu…" : "Thêm và chọn"}
          </AdminButton>
        </>
      }
    >
      <form id="pe-add-category" onSubmit={onAddSubmit} className="space-y-3">
        <AdminInput
          label="Tên danh mục"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
          autoFocus
          placeholder="VD: Áo sơ mi"
        />
        <p className="text-xs text-[var(--admin-text-muted)]">
          Slug tự tạo: <span className="font-mono">{addSlugPreview || "—"}</span>
        </p>
      </form>
    </AdminModal>

    <AdminModal
      open={renameOpen}
      onClose={() => !saving && setRenameOpen(false)}
      title="Đổi tên danh mục"
      footer={
        <>
          <AdminButton type="button" variant="ghost" onClick={() => setRenameOpen(false)} disabled={saving}>
            Hủy
          </AdminButton>
          <AdminButton type="submit" form="pe-rename-category" variant="accent" disabled={saving}>
            {saving ? "Đang lưu…" : "Lưu"}
          </AdminButton>
        </>
      }
    >
      <form id="pe-rename-category" onSubmit={onRenameSubmit} className="space-y-3">
        <AdminInput
          label="Tên hiển thị"
          value={renameName}
          onChange={(e) => setRenameName(e.target.value)}
          required
        />
        <AdminInput
          label="Slug (link lọc /san-pham?category=…)"
          value={renameSlug}
          onChange={(e) => {
            setRenameSlugTouched(true);
            setRenameSlug(e.target.value);
          }}
          hint="Chỉ đổi slug khi cần; tên đổi là đủ cho hầu hết trường hợp."
        />
      </form>
    </AdminModal>
  </>
  );
}