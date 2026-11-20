"use client";

import { useMemo } from "react";
import { AdminInput, AdminSelect } from "@/components/admin/ui";

export type CategoryOpt = { id: string; name: string; slug: string };
export type ProductOpt = {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  reviewCount?: number;
  category?: { name: string } | null;
};

type Props = {
  categories: CategoryOpt[];
  products: ProductOpt[];
  categoryId: string;
  productId: string;
  onCategoryIdChange: (id: string) => void;
  onProductIdChange: (id: string) => void;
  productLabel?: string;
  categoryLabel?: string;
  productName?: string;
  required?: boolean;
  onlyWithReviews?: boolean;
  productQuery?: string;
  onProductQueryChange?: (q: string) => void;
};

export function CategoryProductPicker({
  categories,
  products,
  categoryId,
  productId,
  onCategoryIdChange,
  onProductIdChange,
  productLabel = "Sản phẩm",
  categoryLabel = "Danh mục",
  productName,
  required,
  onlyWithReviews,
  productQuery = "",
  onProductQueryChange,
}: Props) {
  const filteredProducts = useMemo(() => {
    let list = products;
    if (categoryId) list = list.filter((p) => p.categoryId === categoryId);
    if (onlyWithReviews) list = list.filter((p) => (p.reviewCount ?? 0) > 0);
    const q = productQuery.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list;
  }, [products, categoryId, onlyWithReviews, productQuery]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <AdminSelect
        label={categoryLabel}
        value={categoryId}
        onChange={(e) => {
          onCategoryIdChange(e.target.value);
          onProductIdChange("");
        }}
      >
        <option value="">Tất cả danh mục</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </AdminSelect>
      {onProductQueryChange ? (
        <AdminInput
          label="Lọc tên sản phẩm"
          value={productQuery}
          onChange={(e) => onProductQueryChange(e.target.value)}
          placeholder="Gõ để lọc danh sách bên dưới…"
        />
      ) : null}
      {productName ? (
        <p className="text-sm text-[var(--admin-text-muted)] sm:col-span-2">
          {productLabel}: {productName}
        </p>
      ) : (
        <AdminSelect
          label={productLabel}
          name="productId"
          value={productId}
          required={required}
          onChange={(e) => onProductIdChange(e.target.value)}
        >
          <option value="">{required ? "Chọn sản phẩm" : "Tất cả sản phẩm"}</option>
          {filteredProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {(p.reviewCount ?? 0) > 0 ? ` (${p.reviewCount} đánh giá)` : ""}
              {!categoryId && p.category?.name ? ` · ${p.category.name}` : ""}
            </option>
          ))}
        </AdminSelect>
      )}
    </div>
  );
}