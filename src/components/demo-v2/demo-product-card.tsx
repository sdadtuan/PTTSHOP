"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCart, WISHLIST_GUEST_KEY } from "@/components/cart/cart-context";
import { formatVnd } from "@/lib/format";
import { resolveSwatch, swatchBackground } from "@/lib/color-names";
import { primaryImage } from "@/lib/product-media";

export type DemoProduct = {
  id: string;
  name: string;
  slug: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  images: {
    url: string;
    alt: string | null;
    type?: string | null;
    isHidden?: boolean | null;
  }[];
  variants: {
    id?: string;
    price: number;
    compareAt?: number | null;
    colorHex: string | null;
    color?: string;
    size?: string;
  }[];
};

export function DemoProductCard({
  product,
  imageOverride,
  large,
}: {
  product: DemoProduct;
  imageOverride?: string;
  large?: boolean;
}) {
  const { addItem } = useCart();
  const { status } = useSession();
  const [wishSaved, setWishSaved] = useState(false);
  const [added, setAdded] = useState(false);

  const cover = primaryImage(product.images);
  const imageUrl = imageOverride || cover?.url;
  const prices = product.variants.map((v) => v.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const variant =
    product.variants.find((v) => v.price === minPrice) ?? product.variants[0];
  const compareAt = variant?.compareAt ?? null;
  const onSale = Boolean(compareAt && compareAt > minPrice);
  const colors = [
    ...new Map(
      product.variants
        .map((v) => resolveSwatch(v.color ?? "", v.colorHex))
        .filter((sw) => sw.stops.length > 0)
        .map((sw) => {
          const bg = swatchBackground(sw.stops);
          return [bg, bg] as const;
        }),
    ).values(),
  ].slice(0, 4);

  const badge = product.isNew
    ? "Mới"
    : product.isBestSeller
      ? "Bán chạy"
      : null;

  async function toggleWishlist() {
    const variantId = variant?.id;
    if (!variantId || variantId === "fallback") {
      window.location.href = "/yeu-thich";
      return;
    }
    if (status === "authenticated") {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });
    } else {
      try {
        const raw = localStorage.getItem(WISHLIST_GUEST_KEY);
        const list = raw ? (JSON.parse(raw) as { variantId: string }[]) : [];
        if (!list.some((x) => x.variantId === variantId)) {
          list.push({ variantId });
          localStorage.setItem(WISHLIST_GUEST_KEY, JSON.stringify(list));
        }
      } catch {
        /* ignore */
      }
    }
    setWishSaved(true);
  }

  function handleAdd() {
    if (!variant?.id || variant.id === "fallback") {
      window.location.href = `/san-pham/${product.slug}`;
      return;
    }
    addItem({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      color: variant.color || "",
      size: variant.size || "M",
      price: variant.price,
      compareAt: variant.compareAt,
      image: imageUrl || "",
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article
      className={`dv2-card${large ? " dv2-card--large" : ""}`}
      data-testid="demo-v2-product-card"
    >
      <div className="dv2-card__media">
        {badge ? <span className="dv2-badge">{badge}</span> : null}
        <button
          type="button"
          className="dv2-heart"
          aria-label={
            wishSaved ? `Đã lưu ${product.name}` : `Yêu thích ${product.name}`
          }
          onClick={() => void toggleWishlist()}
        >
          <Heart
            className="h-3.5 w-3.5"
            fill={wishSaved ? "currentColor" : "none"}
          />
        </button>
        <Link href={`/san-pham/${product.slug}`} className="absolute inset-0 block">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={cover?.alt || product.name}
              fill
              sizes={large ? "(max-width:768px) 100vw, 50vw" : "(max-width:768px) 50vw, 18vw"}
              className="object-cover"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-neutral-400">
              No image
            </div>
          )}
        </Link>
        <button
          type="button"
          className="dv2-card__cart"
          aria-label={`Thêm ${product.name} vào giỏ`}
          onClick={handleAdd}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
        </button>
        {added ? <span className="dv2-style-card__toast">Đã thêm</span> : null}
      </div>
      <div className="dv2-card__body">
        <Link href={`/san-pham/${product.slug}`} className="dv2-card__name-link">
          <h3 className="dv2-card__name" title={product.name}>
            {product.name}
          </h3>
        </Link>
        <div className="dv2-card__meta">
          <div className="dv2-style-card__prices">
            <p className="dv2-card__price">{formatVnd(minPrice)}</p>
            {onSale ? (
              <span className="dv2-style-card__compare">{formatVnd(compareAt!)}</span>
            ) : null}
          </div>
          {colors.length > 0 ? (
            <div className="dv2-dots" aria-label="Màu sắc">
              {colors.map((bg) => (
                <span key={bg} className="dv2-dot" style={{ background: bg }} />
              ))}
            </div>
          ) : (
            <div className="dv2-dots dv2-dots--spacer" aria-hidden />
          )}
        </div>
      </div>
    </article>
  );
}
