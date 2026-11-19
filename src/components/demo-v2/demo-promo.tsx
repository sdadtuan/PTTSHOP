import Image from "next/image";
import Link from "next/link";
import type { PromoBannerContent } from "@/lib/cms/types";

export function DemoPromo({ content }: { content: PromoBannerContent }) {
  return (
    <section className="dv2-promo" data-testid="demo-v2-promo">
      <div className="dv2-wrap dv2-promo__inner">
        <div className="dv2-promo__media">
          <Image
            src={content.imageUrl}
            alt={content.title}
            fill
            sizes="(max-width:768px) 100vw, 288px"
            className="object-cover"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className="dv2-promo__copy">
          <h2>{content.title}</h2>
          <p>{content.subtitle}</p>
          <Link href={content.ctaHref || "/san-pham"} className="dv2-cta">
            {content.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
