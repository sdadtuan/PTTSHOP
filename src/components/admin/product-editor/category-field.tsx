"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import {
  AdminButton,
  AdminInput,
  AdminModal,
  AdminSelect,
  useAdminToast,
} from "@/components/admin/ui";
import { useAutoSlugField } from "@/hooks/use-auto-slug-field";
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
  const addFields = useAutoSlugField({ fallback: "" });
  const renameFields = useAutoSlugField({ fallback: "" });
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  );

  useEffect(() => {
    if (addOpen) addFields.reset();
  }, [addOpen, addFields.reset]);

  const closeAddModal = useCallback(() => {
    if (!saving) setAddOpen(false);
  }, [saving]);

  const closeRenameModal = useCallback(() => {
    if (!saving) setRenameOpen(false);
  }, [saving]);

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
    if (!addFields.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addFields.name.trim(),
          slug: addFields.slug.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Tạo danh mục thất bại");
      const created = data.category as AdminCategory;
      await refreshCategories();
      onCategoryIdChange(created.id);
      toast(`Đã thêm danh mục «${created.name}»`);
      setAddOpen(false);
      addFields.reset();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Tạo danh mục thất bại", "error");
    } finally {
      setSaving(false);
    }
  }

  function openRename() {
    if (!selected) return;
    renameFields.reset({ name: selected.name, slug: selected.slug, preserveSlug: true });
    setRenameOpen(true);
  }

  async function onRenameSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const nextSlug = renameFields.slug.trim()
        ? slugify(renameFields.slug, { fallback: selected.slug })
        : undefined;
      const slugBody = nextSlug && nextSlug !== selected.slug ? { slug: nextSlug } : {};
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          name: renameFields.name.trim(),
          ...slugBody,
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
      onClose={closeAddModal}
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
          value={addFields.name}
          onChange={(e) => addFields.setName(e.target.value)}
          required
          autoFocus
          placeholder="VD: Áo sơ mi"
        />
        <AdminInput
          label="Slug"
          value={addFields.slug}
          onChange={(e) => addFields.setSlug(e.target.value)}
          onBlur={addFields.onSlugBlur}
          hint="Tự điền từ tên; có thể sửa hoặc xóa hết để bật lại tự động"
        />
      </form>
    </AdminModal>

    <AdminModal
      open={renameOpen}
      onClose={closeRenameModal}
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
          value={renameFields.name}
          onChange={(e) => renameFields.setName(e.target.value)}
          required
        />
        <AdminInput
          label="Slug (link lọc /san-pham?category=…)"
          value={renameFields.slug}
          onChange={(e) => renameFields.setSlug(e.target.value)}
          onBlur={renameFields.onSlugBlur}
          hint="Đổi tên không đổi slug; xóa slug để tạo lại từ tên hoặc sửa tay."
        />
      </form>
    </AdminModal>
  </>
  );
}