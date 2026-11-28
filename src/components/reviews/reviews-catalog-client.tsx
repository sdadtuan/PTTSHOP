"use client";

import { StorefrontImage } from "@/components/product/storefront-image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StarRating } from "@/components/reviews/star-rating";
import { cn } from "@/lib/utils";

type CatalogReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userName: string;
  avatarUrl: string | null;
  product: { id: string; name: string; slug: string; image: string | null };
};

type CatalogData = {
  page: number;
  totalPages: number;
  total: number;
  summary: { average: number | null; total: number; starCounts: Record<number, number> };
  reviews: CatalogReview[];
};

type ProductOption = {
  id: string;
  name: string;
  slug: string;
  categoryId?: string | null;
  reviewCount?: number;
};
type CategoryOption = { id: string; name: string; slug: string };

export function ReviewsCatalogClient({
  intro,
  categories,
  products,
  initial,
}: {
  intro?: string | null;
  categories: CategoryOption[];
  products: ProductOption[];
  initial: CatalogData;
}) {
  const [data, setData] = useState(initial);
  const [rating, setRating] = useState<number | "">("");
  const [categorySlug, setCategorySlug] = useState("");
  const [productSlug, setProductSlug] = useState("");
  const [loading, setLoading] = useState(false);

  const productOptions = useMemo(() => {
    if (!categorySlug) return products;
    return products.filter((p) => {
      const cat = categories.find((c) => c.slug === categorySlug);
      return cat ? p.categoryId === cat.id : true;
    });
  }, [products, categories, categorySlug]);

  const load = useCallback(
    async (page: number) => {
      setLoading(true);
      const sp = new URLSearchParams({ page: String(page), pageSize: "12" });
      if (rating) sp.set("rating", String(rating));
      if (productSlug) sp.set("productSlug", productSlug);
      else if (categorySlug) sp.set("categorySlug", categorySlug);
      const res = await fetch(`/api/reviews/catalog?${sp}`);
      const json = await res.json();
      if (res.ok) setData(json);
      setLoading(false);
    },
    [rating, productSlug, categorySlug],
  );

  useEffect(() => {
    void load(1);
  }, [rating, productSlug, categorySlug, load]);

  const s = data.summary;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="max-w-2xl">
        <h1 className="type-title text-3xl font-extrabold md:text-4xl">Đánh Giá</h1>
        {intro ? <p className="mt-3 text-sm leading-relaxed text-neutral-600">{intro}</p> : null}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="border border-neutral-100 bg-white p-5">
            {s.total > 0 && s.average != null ? (
              <>
                <p className="text-4xl font-bold text-neutral-900">{s.average.toFixed(1)}</p>
                <StarRating rating={s.average} size="md" className="mt-1" />
              </>
            ) : (
              <p className="text-lg font-semibold text-neutral-700">Chưa có đánh giá.</p>
            )}
            <p className="mt-2 text-sm text-neutral-500">{s.total} đánh giá công khai</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = s.starCounts[star] ?? 0;
                const pct = s.total ? Math.round((count / s.total) * 100) : 0;
                return (
                  <li key={star} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRating(rating === star ? "" : star)}
                      className={cn(
                        "w-12 text-left text-neutral-600 hover:text-[var(--accent)]",
                        rating === star && "font-semibold text-[var(--accent)]",
                      )}
                    >
                      {star} ★
                    </button>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs text-neutral-400">{count}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-neutral-800">Danh mục</span>
            <select
              value={categorySlug}
              onChange={(e) => {
                setCategorySlug(e.target.value);
                setProductSlug("");
              }}
              className="w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-neutral-800">Sản phẩm</span>
            <select
              value={productSlug}
              onChange={(e) => setProductSlug(e.target.value)}
              className="w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tất cả sản phẩm</option>
              {productOptions.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name}
                  {(p.reviewCount ?? 0) > 0 ? ` (${p.reviewCount})` : ""}
                </option>
              ))}
            </select>
          </label>
        </aside>

        <div className={cn("space-y-4", loading && "opacity-60")} aria-busy={loading}>
          {data.reviews.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-500">Chưa có đánh giá phù hợp bộ lọc.</p>
          ) : (
            data.reviews.map((r) => (
              <article
                key={r.id}
                className="flex gap-4 border border-neutral-100 bg-white p-4 md:p-5"
              >
                <Link
                  href={`/san-pham/${r.product.slug}`}
                  className="relative h-20 w-16 shrink-0 overflow-hidden bg-neutral-100"
                >
                  {r.product.image ? (
                    <StorefrontImage src={r.product.image} alt="" fill className="object-cover" sizes="64px" />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-neutral-900">{r.userName}</span>
                    <StarRating rating={r.rating} />
                    <time className="text-xs text-neutral-400" dateTime={r.createdAt}>
                      {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                    </time>
                  </div>
                  {r.comment ? (
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">{r.comment}</p>
                  ) : null}
                  <Link
                    href={`/san-pham/${r.product.slug}`}
                    className="mt-2 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    {r.product.name}
                  </Link>
                </div>
              </article>
            ))
          )}

          {data.totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                disabled={data.page <= 1 || loading}
                onClick={() => void load(data.page - 1)}
                className="rounded border border-neutral-200 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Trước
              </button>
              <span className="text-sm text-neutral-500">
                Trang {data.page} / {data.totalPages}
              </span>
              <button
                type="button"
                disabled={data.page >= data.totalPages || loading}
                onClick={() => void load(data.page + 1)}
                className="rounded border border-neutral-200 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}