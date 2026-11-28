"use client";

import { useRef, useState } from "react";
import { ProductCard } from "@/components/product/product-card";

type Item = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  compareAt?: number | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  color?: string | null;
  colorHex?: string | null;
  label: string | null;
};

/** Tải sau khi khối vào gần khung nhìn, không chặn ảnh đầu trang. */
export function RecommendationBlock({
  placement,
  productId,
}: {
  placement: "pdp" | "cart" | "home";
  productId?: string;
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  function watch(node: HTMLElement | null) {
    observer.current?.disconnect();
    if (!node || items) return;
    observer.current = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.current?.disconnect();
      const params = new URLSearchParams({ placement });
      if (productId) params.set("productId", productId);
      void fetch(`/api/recommendations?${params}`)
        .then((res) => res.json())
        .then((data: { items?: Item[] }) => setItems(data.items || []))
        .catch(() => setItems([]));
    }, { rootMargin: "200px" });
    observer.current.observe(node);
  }

  if (items && items.length === 0) return null;
  return (
    <section ref={watch} className="mx-auto mt-16 min-h-px max-w-7xl px-4 md:px-6" data-testid={`recommendations-${placement}`}>
      {items && items.length > 0 ? (
        <>
          <h2 className="type-title mb-6 text-2xl font-extrabold">Gợi ý thêm</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {items.map((item) => (
              <div key={item.id}>
                {item.label ? <p className="mb-1 text-xs font-semibold text-neutral-700">{item.label}</p> : null}
                <ProductCard
                  product={{
                    id: item.id,
                    name: item.name,
                    slug: item.slug,
                    images: item.imageUrl ? [{ url: item.imageUrl, alt: item.imageAlt ?? null }] : [],
                    variants: item.price == null ? [] : [{
                      price: item.price,
                      compareAt: item.compareAt ?? null,
                      colorHex: item.colorHex ?? null,
                      color: item.color ?? undefined,
                    }],
                  }}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
