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

export function DemoPhoiMau({ content }: { content: ColorPlayContent }) {
  const main = content.mainImage || homeImages.colorPlay.main;
  const grid = content.gridImages.length
    ? content.gridImages
    : [...homeImages.colorPlay.grid];
  const intro1 = content.introImage1 || homeImages.colorPlay.intro[0];
  const intro2 = content.introImage2 || homeImages.colorPlay.intro[1];

  return (
    <>
      {/* B promo strip (angled photos + CTA) — same CTAs as A color story */}
      <section className="dv2-section dv2-section--soft" data-testid="demo-v2-phoi-mau">
        <div className="dv2-wrap">
          <div className="dv2-phoi">
            <div className="dv2-phoi__photo">
              <Image
                src={main}
                alt="Phối đồ VIZFAS"
                fill
                sizes="30vw"
                className="object-cover"
                style={{ objectFit: "cover" }}
              />
            </div>

            <div className="dv2-phoi__copy">
              <h2>
                Phối Màu
                <br />
                <em>Tạo Chất</em>
              </h2>
              <p>Gợi ý outfit thời thượng cùng VIZFAS</p>
              <Link href="/bo-suu-tap" className="dv2-cta">
                Xem Gợi Ý Phối Đồ
                <ArrowRight />
              </Link>
            </div>

            <div className="dv2-phoi__strips" aria-hidden>
              {strips.map((src) => (
                <div key={src} className="dv2-strip">
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Full A color_play content — CMS intro + grid + vertical label */}
      <section
        className="dv2-section"
        data-testid="demo-v2-color-play"
        aria-labelledby="dv2-color-play-title"
      >
        <div className="dv2-wrap dv2-color-play">
          <div className="dv2-color-play__model">
            <Image
              src={main}
              alt="Phối màu tạo chất"
              fill
              sizes="(max-width:1024px) 100vw, 26vw"
              className="object-cover object-top"
              style={{ objectFit: "cover", objectPosition: "top" }}
              priority
            />
          </div>

          <div className="dv2-color-play__type" aria-hidden>
            <span>PHỐI</span>
            <span>MÀU</span>
          </div>

          <div className="dv2-color-play__copy">
            <h2 id="dv2-color-play-title">{content.headline}</h2>
            <p>{content.paragraph1}</p>
            <p>{content.paragraph2}</p>
            <div className="dv2-color-play__intro" data-testid="demo-v2-phoi-intro">
              <div className="dv2-color-play__intro-cell" data-testid="demo-v2-phoi-intro-1">
                <Image
                  src={intro1}
                  alt={content.introImage1Alt || "Look phối màu — khung 1"}
                  fill
                  sizes="18vw"
                  className="object-cover"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="dv2-color-play__intro-cell" data-testid="demo-v2-phoi-intro-2">
                <Image
                  src={intro2}
                  alt={content.introImage2Alt || "Look phối màu — khung 2"}
                  fill
                  sizes="18vw"
                  className="object-cover"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
          </div>

          <div className="dv2-color-play__grid">
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
                  sizes="18vw"
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
      </section>
    </>
  );
}
