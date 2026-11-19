import Image from "next/image";
import { homeImages } from "@/config/home-images";
import type { DualBannerContent } from "@/lib/cms/types";

export function DemoPhongCach({ content }: { content: DualBannerContent }) {
  const left = content.leftImage || homeImages.dualBanner.left;
  const right = content.rightImage || homeImages.dualBanner.right;

  return (
    <section
      className="dv2-section dv2-phong"
      data-testid="demo-v2-phong-cach"
      aria-labelledby="dv2-phong-title"
    >
      <div className="dv2-wrap dv2-phong__inner">
        <div className="dv2-phong__blob dv2-phong__blob--tr" aria-hidden />
        <div className="dv2-phong__blob dv2-phong__blob--bl" aria-hidden />

        <div className="dv2-phong__photo dv2-phong__photo--left">
          <Image
            src={left}
            alt="Look đơn giản — banner trái"
            fill
            sizes="(max-width:768px) 38vw, 20vw"
            className="object-cover"
            style={{ objectFit: "cover" }}
          />
        </div>

        <div className="dv2-phong__copy">
          <h2 id="dv2-phong-title">
            <span className="dv2-phong__l1">{content.titleLine1}</span>
            <span className="dv2-phong__l2">{content.titleLine2}</span>
            <span className="dv2-phong__l3">
              {content.titleLine3}
              <span className="dv2-phong__dash" aria-hidden />
            </span>
          </h2>
          <p>{content.description}</p>
        </div>

        <div className="dv2-phong__photo dv2-phong__photo--right">
          <span className="dv2-phong__shadow" aria-hidden />
          <div className="dv2-phong__photo-frame">
            <Image
              src={right}
              alt="Look đơn giản — banner phải"
              fill
              sizes="(max-width:768px) 42vw, 20vw"
              className="object-cover"
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
