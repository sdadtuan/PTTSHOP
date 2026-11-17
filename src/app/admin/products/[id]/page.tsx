"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
  AdminTableSkeleton,
  AdminTextarea,
  useAdminToast,
} from "@/components/admin/ui";
import { formatVnd } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  gender: string;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  categoryId?: string | null;
  category?: { name: string } | null;
  images?: { url: string; alt?: string | null }[];
  variants: {
    id: string;
    sku: string;
    stock: number;
    price: number;
    color: string;
    size: string;
  }[];
};

type Category = { id: string; name: string };

export default function AdminProductEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useAdminToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      fetch("/api/admin/products"),
      fetch("/api/admin/categories"),
    ]);
    const pData = await pRes.json();
    const cData = await cRes.json();
    if (!pRes.ok) {
      setError(pData.error || "Không tải được sản phẩm");
      setLoading(false);
      return;
    }
    const found = (pData.products || []).find(
      (p: Product) => p.id === params.id,
    );
    if (!found) {
      setError("Không tìm thấy sản phẩm");
      setProduct(null);
    } else {
      setError("");
      setProduct(found);
    }
    if (cRes.ok) setCategories(cData.categories || []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [params.id]);

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product) return;
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: product.id,
        name: String(form.get("name") || ""),
        description: String(form.get("description") || ""),
        categoryId: String(form.get("categoryId") || "") || null,
        gender: String(form.get("gender") || "UNISEX"),
        isFeatured: form.get("isFeatured") === "on",
        isNew: form.get("isNew") === "on",
        isBestSeller: form.get("isBestSeller") === "on",
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Lưu thất bại");
      toast(data.error || "Lưu thất bại", "error");
      return;
    }
    toast("Đã lưu sản phẩm");
    await load();
  }

  async function updateStock(id: string, stock: number) {
    await fetch("/api/admin/variants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stock }),
    });
    toast("Đã cập nhật tồn");
    await load();
  }

  if (loading) {
    return (
      <div>
        <AdminPageHeader title="Sửa sản phẩm" breadcrumbs={[{ href: "/admin", label: "Admin" }, { href: "/admin/products", label: "Sản phẩm" }, { label: "Sửa" }]} />
        <AdminTableSkeleton rows={4} />
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <AdminPageHeader title="Sửa sản phẩm" breadcrumbs={[{ href: "/admin", label: "Admin" }, { href: "/admin/products", label: "Sản phẩm" }, { label: "Sửa" }]} />
        <AdminEmptyState
          title="Không tìm thấy sản phẩm"
          description={error || "Sản phẩm có thể đã bị xóa."}
          action={
            <AdminButton variant="secondary" onClick={() => router.push("/admin/products")}>
              Về danh sách
            </AdminButton>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Sửa sản phẩm"
        description={product.slug}
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/products", label: "Sản phẩm" },
          { label: product.name },
        ]}
        actions={
          <AdminButton variant="secondary" onClick={() => router.push("/admin/products")}>
            Quay lại
          </AdminButton>
        }
      />

      {error ? (
        <p
          className="mb-4 rounded-[var(--admin-radius-md)] border border-red-200 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form onSubmit={onSave} className="space-y-4">
        <AdminCard>
          <h2 className="mb-4 font-semibold">Thông tin cơ bản</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput name="name" required label="Tên sản phẩm" defaultValue={product.name} />
            <AdminSelect
              name="categoryId"
              label="Danh mục"
              defaultValue={product.categoryId || ""}
            >
              <option value="">— Danh mục —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="gender" label="Giới tính" defaultValue={product.gender}>
              <option value="UNISEX">Unisex</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
            </AdminSelect>
            <div className="flex flex-wrap items-end gap-4 pb-2 text-sm">
              <label className="inline-flex items-center gap-2">
                <input name="isNew" type="checkbox" defaultChecked={product.isNew} className="rounded border-[var(--admin-border)]" />
                Mới
              </label>
              <label className="inline-flex items-center gap-2">
                <input name="isBestSeller" type="checkbox" defaultChecked={product.isBestSeller} className="rounded border-[var(--admin-border)]" />
                Bán chạy
              </label>
              <label className="inline-flex items-center gap-2">
                <input name="isFeatured" type="checkbox" defaultChecked={product.isFeatured} className="rounded border-[var(--admin-border)]" />
                Nổi bật
              </label>
            </div>
            <div className="sm:col-span-2">
              <AdminTextarea
                name="description"
                label="Mô tả"
                defaultValue={product.description || ""}
              />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="mb-4 font-semibold">Giá & biến thể</h2>
          <p className="mb-3 text-sm text-[var(--admin-text-muted)]">
            Cập nhật tồn kho trực tiếp. Giá hiện tại lấy từ biến thể.
          </p>
          <ul className="space-y-3">
            {product.variants.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {v.color} / {v.size}
                  </p>
                  <p className="text-xs text-[var(--admin-text-muted)]">
                    {v.sku} · {formatVnd(v.price)}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  Tồn
                  <input
                    type="number"
                    defaultValue={v.stock}
                    aria-label={`Tồn ${v.color} ${v.size}`}
                    className="w-20 rounded border border-[var(--admin-border)] px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/25"
                    onBlur={(e) => void updateStock(v.id, Number(e.target.value))}
                  />
                </label>
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard>
          <h2 className="mb-4 font-semibold">Ảnh sản phẩm</h2>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(product.images || []).map((img) => (
              <div
                key={img.url}
                className="relative aspect-square overflow-hidden rounded-[var(--admin-radius-md)] bg-[var(--admin-surface-muted)] ring-1 ring-[var(--admin-border)]"
              >
                <Image src={img.url} alt={img.alt || product.name} fill className="object-cover" sizes="160px" unoptimized />
              </div>
            ))}
            {(product.images || []).length === 0 ? (
              <p className="col-span-full text-sm text-[var(--admin-text-muted)]">
                Chưa có ảnh.
              </p>
            ) : null}
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Xem trước upload (kéo-thả)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="block w-full rounded-[var(--admin-radius-md)] border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-surface-muted)] px-4 py-8 text-sm file:mr-3 file:rounded file:border-0 file:bg-[var(--admin-accent)] file:px-3 file:py-1.5 file:text-white"
              onChange={(e) => {
                const files = e.target.files;
                setPreviews(
                  files?.length
                    ? [...files].slice(0, 8).map((f) => URL.createObjectURL(f))
                    : [],
                );
              }}
            />
          </label>
          {previews.length ? (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {previews.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="aspect-square rounded-[var(--admin-radius-md)] object-cover ring-1 ring-[var(--admin-border)]"
                />
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-xs text-[var(--admin-text-muted)]">
            Upload ảnh mới khi tạo sản phẩm; phần này hỗ trợ xem trước lưới khi chọn file.
          </p>
        </AdminCard>

        {/* Video section slot — sibling worker may extend here */}

        <div className="flex flex-wrap gap-2">
          <AdminButton type="submit" variant="accent" disabled={saving}>
            {saving ? "Đang lưu…" : "Lưu thay đổi"}
          </AdminButton>
          <Link
            href={`/san-pham/${product.slug}`}
            className="inline-flex h-10 items-center rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] px-4 text-sm font-medium hover:bg-[var(--admin-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/30"
          >
            Xem trên storefront
          </Link>
        </div>
      </form>
    </div>
  );
}
