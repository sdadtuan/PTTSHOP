import Image from "next/image";
import { homeImages } from "@/config/home-images";
import type { DualBannerContent } from "@/lib/cms/types";

export function DemoPhongCach({ content }: { content: DualBannerContent }) {
  const left = content.leftImage || homeImages.dualBanner.left;
  const right = content.rightImage || homeImages.dualBanner.right;

  return (
    <section
      className="dv2-section dv2-phong dv2-reveal"
      data-testid="demo-v2-phong-cach"
      aria-labelledby="dv2-phong-title"
    >
      <div className="dv2-wrap dv2-phong__stage">
        <div className="dv2-phong__rail" aria-hidden>
          <span />
          <span />
          <span />
        </div>

        <figure className="dv2-phong__polaroid dv2-phong__polaroid--a">
          <div className="dv2-phong__shot">
            <Image
              src={left}
              alt="Look đơn giản — banner trái"
              fill
              sizes="(max-width:768px) 42vw, 22vw"
              className="object-cover"
              style={{ objectFit: "cover" }}
            />
          </div>
          <figcaption>ESSENTIAL</figcaption>
        </figure>

        <div className="dv2-phong__copy">
          <p className="dv2-phong__kicker">INTRO LOOK</p>
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

        <figure className="dv2-phong__polaroid dv2-phong__polaroid--b">
          <span className="dv2-phong__accent" aria-hidden />
          <div className="dv2-phong__shot">
            <Image
              src={right}
              alt="Look đơn giản — banner phải"
              fill
              sizes="(max-width:768px) 46vw, 24vw"
              className="object-cover"
              style={{ objectFit: "cover" }}
            />
          </div>
          <figcaption>SIGNATURE</figcaption>
        </figure>
      </div>
    </section>
  );
}
