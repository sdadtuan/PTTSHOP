"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { GAPS } from "@/config/home-frame-specs";
import { homeImages } from "@/config/home-images";

type Product = {
  id: string;
  name: string;
  slug: string;
  category?: { slug: string } | null;
  images: { url: string; alt: string | null }[];
  variants: {
    price: number;
    compareAt: number | null;
    colorHex: string | null;
  }[];
};

const TABS = [
  { id: "all", label: "Tất cả", slug: null },
  { id: "ao-thun", label: "Áo thun", slug: "ao-thun" },
  { id: "quan", label: "Quần", slug: "quan" },
  { id: "hoodie", label: "Hoodie", slug: "hoodie" },
] as const;

type Props = {
  products: Product[];
};

export function HomeStyleTabs({ products }: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");

  const filtered = useMemo(() => {
    const active = TABS.find((t) => t.id === tab);
    const list = !active?.slug
      ? products
      : products.filter((p) => p.category?.slug === active.slug);
    return list.slice(0, 6);
  }, [products, tab]);

  return (
    <div>
      <div
        className="mb-5 flex flex-wrap gap-2 text-sm"
        role="tablist"
        aria-label="Lọc kiểu dáng"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={
                active
                  ? "rounded-lg bg-neutral-900 px-4 py-1.5 font-medium text-white"
                  : "rounded-lg px-4 py-1.5 text-neutral-600 transition hover:bg-black/5 hover:text-neutral-900"
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 min-w-0"
        style={{ gap: GAPS.productGrid.desktop }}
      >
        {filtered.map((p, i) => {
          const useFlat =
            tab === "all" ||
            tab === "quan" ||
            !p.images[0]?.url ||
            p.images[0].url.includes("unsplash");
          return (
            <ProductCard
              key={p.id}
              product={p}
              frame="diversePants"
              imageOverride={
                useFlat
                  ? homeImages.diverse.pants[i % homeImages.diverse.pants.length]
                  : undefined
              }
            />
          );
        })}
        {filtered.length === 0 ? (
          <p className="col-span-full text-sm text-neutral-500">
            Chưa có sản phẩm trong nhóm này.
          </p>
        ) : null}
      </div>
    </div>
  );
}
