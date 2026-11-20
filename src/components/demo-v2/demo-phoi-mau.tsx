import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { homeImages } from "@/config/home-images";
import type { ColorPlayContent } from "@/lib/cms/types";

/** Single editorial lookbook — A color_play content, no empty mosaic gaps. */
export function DemoPhoiMau({ content }: { content: ColorPlayContent }) {
  const main = content.mainImage || homeImages.colorPlay.main;
  const grid = content.gridImages.length
    ? content.gridImages
    : [...homeImages.colorPlay.grid];
  const intro1 = content.introImage1 || homeImages.colorPlay.intro[0];
  const intro2 = content.introImage2 || homeImages.colorPlay.intro[1];

  return (
    <section
      className="dv2-section dv2-lookbook dv2-reveal"
      data-testid="demo-v2-phoi-mau"
      aria-labelledby="dv2-color-play-title"
    >
      <div className="dv2-wrap">
        <div className="dv2-lookbook__head">
          <div>
            <p className="dv2-lookbook__brand">
              {content.brandLine1 || "PHỐI MÀU"} <em>{content.brandEmphasis || "TẠO CHẤT"}</em>
            </p>
            <h2 id="dv2-color-play-title">{content.headline}</h2>
            <p className="dv2-lookbook__lead">{content.paragraph1}</p>
            <p className="dv2-lookbook__lead">{content.paragraph2}</p>
          </div>
          <Link
            href={content.ctaHref || "/bo-suu-tap"}
            className="dv2-cta"
            data-testid="demo-v2-phoi-cta"
          >
            {content.ctaLabel || "Xem Gợi Ý Phối Đồ"}
            <ArrowRight />
          </Link>
        </div>

        <div className="dv2-lookbook__hero">
          <div className="dv2-lookbook__hero-main">
            <Image
              src={main}
              alt="Phối màu tạo chất"
              fill
              sizes="(max-width:900px) 100vw, 55vw"
              className="object-cover object-top"
              style={{ objectFit: "cover", objectPosition: "top" }}
              priority
            />
          </div>
          <div className="dv2-lookbook__hero-side">
            <div className="dv2-lookbook__hero-side-a">
              <Image
                src={grid[0] || main}
                alt=""
                fill
                sizes="25vw"
                className="object-cover"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="dv2-lookbook__hero-side-b">
              <Image
                src={grid[1] || main}
                alt=""
                fill
                sizes="25vw"
                className="object-cover"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
          <div
            className="dv2-lookbook__vline"
            data-testid="demo-v2-phoi-vertical-label"
          >
            <span aria-hidden />
            <p>{content.verticalLabel || "BỘ SƯU TẬP MỚI"}</p>
            <span aria-hidden />
          </div>
        </div>

        {/* 2 tall intro + 6 looks — intros span full mosaic height, no dead band */}
        <div className="dv2-lookbook__mosaic" data-testid="demo-v2-color-play">
          <div className="dv2-lookbook__intros" data-testid="demo-v2-phoi-intro">
            <div
              className="dv2-lookbook__tall"
              data-testid="demo-v2-phoi-intro-1"
            >
              <Image
                src={intro1}
                alt={content.introImage1Alt || "Look phối màu — khung 1"}
                fill
                sizes="22vw"
                className="object-cover"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div
              className="dv2-lookbook__tall"
              data-testid="demo-v2-phoi-intro-2"
            >
              <Image
                src={intro2}
                alt={content.introImage2Alt || "Look phối màu — khung 2"}
                fill
                sizes="22vw"
                className="object-cover"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
          {grid.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="dv2-lookbook__cell"
              data-testid={`demo-v2-phoi-grid-${i + 1}`}
            >
              <Image
                src={src}
                alt={`Look phối màu ${i + 1}`}
                fill
                sizes="16vw"
                className="object-cover"
                style={{ objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
