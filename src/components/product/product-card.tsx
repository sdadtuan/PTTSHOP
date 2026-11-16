import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { formatVnd } from "@/lib/format";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string; alt: string | null }[];
    variants: { price: number; compareAt: number | null; colorHex: string | null }[];
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0];
  const prices = product.variants.map((v) => v.price);
  const minPrice = Math.min(...prices);
  const compareAt = product.variants.find((v) => v.compareAt)?.compareAt;
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
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt || product.name}
              fill
              sizes="(max-width:768px) 50vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              No image
            </div>
          )}
          <button
            type="button"
            className="absolute top-3 right-3 rounded-full bg-white/90 p-2 opacity-0 shadow-sm transition group-hover:opacity-100"
            aria-label="Yêu thích"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 space-y-1.5">
          <h3 className="text-sm font-medium text-neutral-900 md:text-[15px]">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-neutral-900">
              {formatVnd(minPrice)}
            </p>
            {compareAt && compareAt > minPrice ? (
              <p className="text-xs text-neutral-400 line-through">
                {formatVnd(compareAt)}
              </p>
            ) : null}
          </div>
          {colors.length > 0 ? (
            <div className="flex gap-1.5 pt-1">
              {colors.map((hex) => (
                <span
                  key={hex}
                  className="h-3.5 w-3.5 rounded-full border border-black/10"
                  style={{ backgroundColor: hex || "#ccc" }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
