"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { homeImages } from "@/config/home-images";
import { formatVnd } from "@/lib/format";
import { resolveSwatch, swatchBackground } from "@/lib/color-names";
import { primaryImage } from "@/lib/product-media";

export type StyleTabProduct = {
  id: string;
  name: string;
  slug: string;
  category?: { slug: string } | null;
  images: {
    url: string;
    alt: string | null;
    type?: string | null;
    isHidden?: boolean | null;
  }[];
  variants: {
    id: string;
    price: number;
    compareAt: number | null;
    color: string;
    colorHex: string | null;
    size: string;
  }[];
};

const TABS = [
  { id: "all", label: "Tất cả", slug: null },
  { id: "ao-thun", label: "Áo thun", slug: "ao-thun" },
  { id: "quan", label: "Quần", slug: "quan" },
  { id: "hoodie", label: "Hoodie", slug: "hoodie" },
] as const;

export function DemoStyleTabs({ products }: { products: StyleTabProduct[] }) {
  const { addItem } = useCart();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [added, setAdded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const active = TABS.find((t) => t.id === tab);
    const list = !active?.slug
      ? products
      : products.filter((p) => p.category?.slug === active.slug);
    // One compact row (~5) on desktop; tabs + cart still work
    return list.slice(0, 5);
  }, [products, tab]);

  return (
    <div data-testid="demo-v2-style-tabs">
      <div className="dv2-tabs" role="tablist" aria-label="Lọc kiểu dáng">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-active={active ? "true" : "false"}
              onClick={() => setTab(t.id)}
              className="dv2-tab"
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="dv2-style-grid">
        {filtered.map((p, i) => {
          const cover = primaryImage(p.images);
          const useFlat =
            tab === "all" ||
            tab === "quan" ||
            !cover?.url ||
            cover.url.includes("unsplash");
          const imageUrl = useFlat
            ? homeImages.diverse.pants[i % homeImages.diverse.pants.length]
            : cover?.url;
          const prices = p.variants.map((v) => v.price);
          const minPrice = prices.length ? Math.min(...prices) : 0;
          const variant =
            p.variants.find((v) => v.price === minPrice) ?? p.variants[0];
          const compareAt = variant?.compareAt;
          const onSale = Boolean(compareAt && compareAt > minPrice);
          const colors = [
            ...new Map(
              p.variants
                .map((v) => resolveSwatch(v.color ?? "", v.colorHex))
                .filter((sw) => sw.stops.length > 0)
                .map((sw) => {
                  const bg = swatchBackground(sw.stops);
                  return [bg, bg] as const;
                }),
            ).values(),
          ].slice(0, 4);

          return (
            <article
              key={p.id}
              className="dv2-style-card"
              data-testid="demo-v2-style-card"
            >
              <div className="dv2-style-card__media">
                <Link href={`/san-pham/${p.slug}`} className="absolute inset-0">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={cover?.alt || p.name}
                      fill
                      sizes="(max-width:768px) 50vw, 18vw"
                      className="object-cover"
                      style={{ objectFit: "cover" }}
                    />
                  ) : null}
                </Link>
                <button
                  type="button"
                  className="dv2-style-card__cart"
                  aria-label={`Thêm ${p.name} vào giỏ`}
                  disabled={!variant}
                  onClick={() => {
                    if (!variant) return;
                    addItem({
                      variantId: variant.id,
                      productId: p.id,
                      slug: p.slug,
                      name: p.name,
                      color: variant.color,
                      size: variant.size,
                      price: variant.price,
                      compareAt: variant.compareAt,
                      image: imageUrl || "",
                    });
                    setAdded(p.id);
                    window.setTimeout(() => setAdded(null), 1500);
                  }}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                </button>
                {added === p.id ? (
                  <span className="dv2-style-card__toast">Đã thêm</span>
                ) : null}
              </div>
              <Link href={`/san-pham/${p.slug}`} className="dv2-card__name-link">
                <h3 className="dv2-card__name" title={p.name}>
                  {p.name}
                </h3>
              </Link>
              <div className="dv2-card__meta">
                <div className="dv2-style-card__prices">
                  <span className="dv2-card__price">{formatVnd(minPrice)}</span>
                  {onSale ? (
                    <span className="dv2-style-card__compare">
                      {formatVnd(compareAt!)}
                    </span>
                  ) : null}
                </div>
                {colors.length ? (
                  <div className="dv2-dots" aria-label="Màu sắc">
                    {colors.map((bg) => (
                      <span key={bg} className="dv2-dot" style={{ background: bg }} />
                    ))}
                  </div>
                ) : (
                  <div className="dv2-dots dv2-dots--spacer" aria-hidden />
                )}
              </div>
            </article>
          );
        })}
        {filtered.length === 0 ? (
          <p className="dv2-style-empty">Chưa có sản phẩm trong nhóm này.</p>
        ) : null}
      </div>
    </div>
  );
}
