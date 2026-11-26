import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  DemoStyleTabs,
  type StyleTabProduct,
} from "@/components/demo-v2/demo-style-tabs";
import { homeImages } from "@/config/home-images";
import type { DiverseContent } from "@/lib/cms/types";
import { publicWatermark } from "@/lib/public-brand";

export function DemoDiverse({
  content,
  products,
}: {
  content: DiverseContent;
  products: StyleTabProduct[];
}) {
  const model = content.modelImage || homeImages.diverse.model;

  return (
    <section
      className="dv2-section dv2-reveal"
      data-testid="demo-v2-diverse"
      aria-labelledby="dv2-diverse-title"
    >
      <div className="dv2-wrap dv2-diverse dv2-diverse--editorial">
        <div className="dv2-diverse__left">
          <p className="dv2-diverse__eyebrow">{content.eyebrow}</p>
          <h2 id="dv2-diverse-title">
            <span>{content.titleLine1}</span>
            <span>{content.titleLine2}</span>
            <span className="dv2-diverse__accent">{content.titleLine3}</span>
          </h2>
          <p className="dv2-diverse__desc">{content.description}</p>
          <Link href={content.ctaHref || "/san-pham"} className="dv2-diverse__cta">
            <span className="dv2-round-btn" aria-hidden>
              <ArrowRight className="h-4 w-4" />
            </span>
            {content.ctaLabel}
          </Link>
          <div className="dv2-diverse__model">
            <Image
              src={model}
              alt="Đa dạng kiểu dáng"
              fill
              sizes="22vw"
              className="object-cover object-top"
              style={{ objectFit: "cover", objectPosition: "top" }}
            />
          </div>
          {publicWatermark(content.watermark) ? (
            <p className="dv2-diverse__watermark" aria-hidden>
              {publicWatermark(content.watermark)}
            </p>
          ) : null}
        </div>

        <div className="dv2-diverse__right">
          <DemoStyleTabs products={products} />
        </div>
      </div>
    </section>
  );
}
