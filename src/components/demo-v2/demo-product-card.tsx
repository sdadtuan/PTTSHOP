import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
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
    price: number;
    colorHex: string | null;
    color?: string;
  }[];
};

export function DemoProductCard({ product }: { product: DemoProduct }) {
  const cover = primaryImage(product.images);
  const prices = product.variants.map((v) => v.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
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

  return (
    <article className="dv2-card" data-testid="demo-v2-product-card">
      <div className="dv2-card__media">
        {badge ? <span className="dv2-badge">{badge}</span> : null}
        <Link
          href="/yeu-thich"
          className="dv2-heart"
          aria-label={`Yêu thích ${product.name}`}
        >
          <Heart className="h-3.5 w-3.5" />
        </Link>
        <Link href={`/san-pham/${product.slug}`} className="absolute inset-0 block">
          {cover?.url ? (
            <Image
              src={cover.url}
              alt={cover.alt || product.name}
              fill
              sizes="(max-width:768px) 50vw, 18vw"
              className="object-cover"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-neutral-400">
              No image
            </div>
          )}
        </Link>
      </div>
      <div className="dv2-card__body">
        <Link href={`/san-pham/${product.slug}`}>
          <h3 className="dv2-card__name">{product.name}</h3>
        </Link>
        <p className="dv2-card__price">{formatVnd(minPrice)}</p>
        {colors.length > 0 ? (
          <div className="dv2-dots" aria-label="Màu sắc">
            {colors.map((bg) => (
              <span key={bg} className="dv2-dot" style={{ background: bg }} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
