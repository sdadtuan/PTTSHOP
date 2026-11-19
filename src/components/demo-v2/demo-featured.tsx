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
  const overrides = [...largeImages, ...smallImages];

  // One compact row (~5) — no duplicate glance / oversized 2+4 stack
  const row = products.slice(0, 5);

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

        <div className="dv2-products dv2-products--compact">
          {row.map((product, i) => (
            <DemoProductCard
              key={`feat-${product.id}-${i}`}
              product={product}
              imageOverride={overrides[i]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
