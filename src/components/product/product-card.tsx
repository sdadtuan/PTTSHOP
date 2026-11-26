import Link from "next/link";
import { ProductImagePlaceholder } from "@/components/product/product-image-placeholder";
import { StorefrontImage } from "@/components/product/storefront-image";
import { ShoppingBag } from "lucide-react";
import { FRAME_ASPECT, OBJECT_POSITION } from "@/config/home-frame-specs";
import { TYPE_SCALE } from "@/config/home-type-scale";
import { formatVnd } from "@/lib/format";
import { resolveSwatch, swatchBackground } from "@/lib/color-names";
import { shopDisplaySrc } from "@/lib/product-image-placeholder";
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
      color?: string;
    }[];
  };
  large?: boolean;
  /** Homepage display override (home-v2) while link stays the real product. */
  imageOverride?: string;
  /** Fixed frame ratio from mock measurements. */
  frame?: FrameKey;
  /** Below md: alternate frame without changing desktop layout. */
  mobileFrame?: FrameKey;
  /** Eager-load for above/critical homepage slots (avoids gray lazy placeholders). */
  priority?: boolean;
};

export function ProductCard({
  product,
  large,
  imageOverride,
  frame,
  mobileFrame,
  priority,
}: ProductCardProps) {
  const cover = primaryImage(
    product.images.filter((img) => !img.url || shopDisplaySrc(img.url)),
  );
  const imageUrl = shopDisplaySrc(imageOverride || cover?.url);
  const imageAlt = cover?.alt || product.name;
  const prices = product.variants.map((v) => v.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const compareAt = product.variants.find((v) => v.compareAt)?.compareAt;
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
  ].slice(0, 5);
  const desktopFrameKey = frame ?? (large ? "featuredLarge" : "featuredSmall");
  const aspect = FRAME_ASPECT[desktopFrameKey];
  const useSplitMobileFrame = Boolean(mobileFrame && mobileFrame !== desktopFrameKey);
  const objectPosition =
    frame === "diversePants"
      ? OBJECT_POSITION.diversePants
      : OBJECT_POSITION.featured;

  return (
    <article className="group relative">
      <Link href={`/san-pham/${product.slug}`} className="block">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl bg-neutral-100",
            useSplitMobileFrame &&
              mobileFrame === "featuredSmall" &&
              desktopFrameKey === "featuredLarge" &&
              "max-md:aspect-[111/113] md:aspect-[232/217]",
          )}
          style={useSplitMobileFrame ? undefined : { aspectRatio: aspect }}
        >
          {imageUrl ? (
            <StorefrontImage
              src={imageUrl}
              alt={imageAlt}
              emptyName={product.name}
              fill
              sizes={
                large
                  ? "(max-width:768px) 100vw, 50vw"
                  : "(max-width:768px) 50vw, 25vw"
              }
              className="object-cover transition duration-500 group-hover:scale-105"
              style={{ objectPosition }}
              priority={priority}
              loading={priority ? undefined : "lazy"}
            />
          ) : (
            <ProductImagePlaceholder name={product.name} />
          )}
          <span className="absolute right-3 bottom-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-white opacity-95 shadow-sm transition group-hover:scale-105">
            <ShoppingBag className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          {colors.length > 0 ? (
            <div className="flex gap-1.5">
              {colors.map((bg) => (
                <span
                  key={bg}
                  className="h-3.5 w-3.5 rounded-full border border-black/10"
                  style={{ background: bg }}
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
