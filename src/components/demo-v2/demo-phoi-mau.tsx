import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { homeImages } from "@/config/home-images";
import type { ColorPlayContent } from "@/lib/cms/types";

const strips = [
  "/images/home-v2/phoi-mau-1.jpg",
  "/images/home-v2/phoi-mau-4.jpg",
  "/images/home-v2/phoi-mau-6.jpg",
] as const;

/** Single B-style Phối Màu section — keeps all A color_play content + CTA. */
export function DemoPhoiMau({ content }: { content: ColorPlayContent }) {
  const main = content.mainImage || homeImages.colorPlay.main;
  const grid = content.gridImages.length
    ? content.gridImages
    : [...homeImages.colorPlay.grid];
  const intro1 = content.introImage1 || homeImages.colorPlay.intro[0];
  const intro2 = content.introImage2 || homeImages.colorPlay.intro[1];

  return (
    <section
      className="dv2-section dv2-section--soft"
      data-testid="demo-v2-phoi-mau"
      aria-labelledby="dv2-color-play-title"
    >
      <div className="dv2-wrap dv2-phoi-one">
        <div className="dv2-phoi-one__hero">
          <div className="dv2-phoi-one__model">
            <Image
              src={main}
              alt="Phối màu tạo chất"
              fill
              sizes="(max-width:900px) 100vw, 28vw"
              className="object-cover object-top"
              style={{ objectFit: "cover", objectPosition: "top" }}
              priority
            />
          </div>

          <div className="dv2-phoi-one__center">
            <p className="dv2-phoi-one__brand" aria-hidden>
              PHỐI MÀU <em>TẠO CHẤT</em>
            </p>
            <h2 id="dv2-color-play-title">{content.headline}</h2>
            <p>{content.paragraph1}</p>
            <p>{content.paragraph2}</p>
            <Link href="/bo-suu-tap" className="dv2-cta" data-testid="demo-v2-phoi-cta">
              Xem Gợi Ý Phối Đồ
              <ArrowRight />
            </Link>
          </div>

          <div className="dv2-phoi-one__strips" aria-hidden>
            {strips.map((src) => (
              <div key={src} className="dv2-strip">
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="100px"
                  className="object-cover"
                  style={{ objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="dv2-phoi-one__lower">
          <div className="dv2-color-play__intro" data-testid="demo-v2-phoi-intro">
            <div className="dv2-color-play__intro-cell" data-testid="demo-v2-phoi-intro-1">
              <Image
                src={intro1}
                alt={content.introImage1Alt || "Look phối màu — khung 1"}
                fill
                sizes="20vw"
                className="object-cover"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="dv2-color-play__intro-cell" data-testid="demo-v2-phoi-intro-2">
              <Image
                src={intro2}
                alt={content.introImage2Alt || "Look phối màu — khung 2"}
                fill
                sizes="20vw"
                className="object-cover"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>

          <div className="dv2-color-play__grid" data-testid="demo-v2-color-play">
            {grid.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="dv2-color-play__cell"
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

          <div className="dv2-color-play__vline" data-testid="demo-v2-phoi-vertical-label">
            <span className="dv2-color-play__vbar" aria-hidden />
            <p>{content.verticalLabel || "BỘ SƯU TẬP MỚI"}</p>
            <span className="dv2-color-play__vbar" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
