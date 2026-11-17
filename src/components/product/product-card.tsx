import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string; alt: string | null }[];
    variants: {
      price: number;
      compareAt: number | null;
      colorHex: string | null;
    }[];
  };
  large?: boolean;
};

export function ProductCard({ product, large }: ProductCardProps) {
  const image = product.images[0];
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

  return (
    <article className="group relative">
      <Link href={`/san-pham/${product.slug}`} className="block">
        <div
          className={cn(
            "relative overflow-hidden bg-neutral-100",
            large ? "aspect-[4/5]" : "aspect-[3/4]",
          )}
        >
          {image ? (
            <Image
              src={image.url}
              alt={image.alt || product.name}
              fill
              sizes={
                large
                  ? "(max-width:768px) 100vw, 50vw"
                  : "(max-width:768px) 50vw, 25vw"
              }
              className="object-cover transition duration-500 group-hover:scale-105"
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
            className={cn(
              "font-medium text-neutral-900",
              large ? "text-base md:text-lg" : "text-sm md:text-[15px]",
            )}
          >
            {product.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "text-sm font-semibold",
                onSale ? "text-[var(--accent)]" : "text-neutral-900",
              )}
            >
              {formatVnd(minPrice)}
            </p>
            {onSale ? (
              <p className="text-xs text-neutral-400 line-through">
                {formatVnd(compareAt!)}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
