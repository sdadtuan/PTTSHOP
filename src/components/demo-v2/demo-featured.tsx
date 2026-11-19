import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  DemoProductCard,
  type DemoProduct,
} from "@/components/demo-v2/demo-product-card";
import { homeImages } from "@/config/home-images";
import type { FeaturedContent } from "@/lib/cms/types";

export function DemoFeatured({
  content,
  products,
}: {
  content: FeaturedContent;
  products: DemoProduct[];
}) {
  const largeImages = content.largeImages.length
    ? content.largeImages
    : [...homeImages.featured.large];
  const smallImages = content.smallImages.length
    ? content.smallImages
    : [...homeImages.featured.small];
  const large = products.slice(0, 2);
  const small = products.slice(2, 6);

  return (
    <section
      className="dv2-section"
      data-testid="demo-v2-featured"
      aria-labelledby="dv2-featured-title"
    >
      <div className="dv2-wrap">
        <div className="dv2-section__head">
          <h2 id="dv2-featured-title" className="dv2-section__title">
            <span className="dv2-slashes" aria-hidden>
              ///
            </span>
            {content.titlePrefix} {content.titleAccent}
          </h2>
          <Link href={content.ctaHref || "/san-pham"} className="dv2-all">
            {content.ctaLabel || "Xem Tất Cả"} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="dv2-feat-large">
          {large.map((product, i) => (
            <DemoProductCard
              key={`feat-l-${product.id}`}
              product={product}
              imageOverride={largeImages[i]}
              large
            />
          ))}
        </div>

        <div className="dv2-feat-small">
          {smallImages.map((src, i) => {
            const product =
              small[i] ||
              products[i % Math.max(products.length, 1)] ||
              ({
                id: `feat-fallback-${i}`,
                name: ["Áo Hoodie Basic", "Áo Khoác Dù", "Áo Polo", "Quần Cargo"][i],
                slug: "ao-hoodie-essential",
                images: [],
                variants: [
                  {
                    id: "fallback",
                    price: 549000,
                    compareAt: 799000,
                    color: "Đen",
                    colorHex: "#111",
                    size: "M",
                  },
                ],
              } as DemoProduct);
            return (
              <DemoProductCard
                key={`feat-s-${product.id}-${i}`}
                product={product}
                imageOverride={src}
              />
            );
          })}
        </div>

        {/* Compact row also kept for B “5-up” glance — uses same product links */}
        <div className="dv2-products dv2-products--glance" data-testid="demo-v2-featured-glance">
          {products.slice(0, 5).map((product) => (
            <DemoProductCard key={`glance-${product.id}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Decorative cover helper for optional promo (unused by default). */
export function DemoPromoCover({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-40 w-full overflow-hidden rounded-xl md:h-48 md:w-72">
      <Image src={src} alt={alt} fill sizes="288px" className="object-cover" />
    </div>
  );
}
