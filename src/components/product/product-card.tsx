import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { FRAME_ASPECT, OBJECT_POSITION } from "@/config/home-frame-specs";
import { TYPE_SCALE } from "@/config/home-type-scale";
import { formatVnd } from "@/lib/format";
import { primaryImage } from "@/lib/product-media";
import { cn } from "@/lib/utils";

type FrameKey = keyof typeof FRAME_ASPECT;

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    images: {
      url: string;
      alt: string | null;
      type?: string | null;
      isHidden?: boolean | null;
    }[];
    variants: {
      price: number;
      compareAt: number | null;
      colorHex: string | null;
    }[];
  };
  large?: boolean;
  /** Homepage display override (home-v2) while link stays the real product. */
  imageOverride?: string;
  /** Fixed frame ratio from mock measurements. */
  frame?: FrameKey;
  /** Eager-load for above/critical homepage slots (avoids gray lazy placeholders). */
  priority?: boolean;
};

export function ProductCard({
  product,
  large,
  imageOverride,
  frame,
  priority,
}: ProductCardProps) {
  const cover = primaryImage(product.images);
  const imageUrl = imageOverride || cover?.url;
  const imageAlt = cover?.alt || product.name;
  const prices = product.variants.map((v) => v.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const compareAt = product.variants.find((v) => v.compareAt)?.compareAt;
  const onSale = Boolean(compareAt && compareAt > minPrice);
  const colors = [
    ...new Map(
      product.variants
        .filter((v) => v.colorHex)
        .map((v) => [v.colorHex, v.colorHex]),
    ).values(),
  ].slice(0, 5);
  const aspect =
    FRAME_ASPECT[
      frame ?? (large ? "featuredLarge" : "featuredSmall")
    ];
  const objectPosition =
    frame === "diversePants"
      ? OBJECT_POSITION.diversePants
      : OBJECT_POSITION.featured;

  return (
    <article className="group relative">
      <Link href={`/san-pham/${product.slug}`} className="block">
        <div
          className="relative overflow-hidden rounded-2xl bg-neutral-100"
          style={{ aspectRatio: aspect }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes={
                large
                  ? "(max-width:768px) 100vw, 50vw"
                  : "(max-width:768px) 50vw, 25vw"
              }
              className="object-cover transition duration-500 group-hover:scale-105"
              style={{ objectPosition }}
              priority={priority}
              loading={
                priority ? undefined : imageOverride ? "eager" : undefined
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              No image
            </div>
          )}
          <span className="absolute right-3 bottom-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-white opacity-95 shadow-sm transition group-hover:scale-105">
            <ShoppingBag className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          {colors.length > 0 ? (
            <div className="flex gap-1.5">
              {colors.map((hex) => (
                <span
                  key={hex}
                  className="h-3.5 w-3.5 rounded-full border border-black/10"
                  style={{ backgroundColor: hex || "#ccc" }}
                />
              ))}
            </div>
          ) : null}
          <h3
            className="font-medium text-neutral-900"
            style={{
              fontSize: large
                ? TYPE_SCALE.productNameLarge.css
                : TYPE_SCALE.productName.css,
            }}
          >
            {product.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "font-semibold",
                onSale ? "text-[var(--accent)]" : "text-neutral-900",
              )}
              style={{ fontSize: TYPE_SCALE.productPrice.css }}
            >
              {formatVnd(minPrice)}
            </p>
            {onSale ? (
              <p
                className="text-neutral-400 line-through"
                style={{ fontSize: `calc(${TYPE_SCALE.productPrice.css} * 0.85)` }}
              >
                {formatVnd(compareAt!)}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
