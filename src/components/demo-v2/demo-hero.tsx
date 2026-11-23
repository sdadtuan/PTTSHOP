"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { homeImages } from "@/config/home-images";
import type { DemoHeroSlide, HeroContent } from "@/lib/cms/types";
import { displayBrandName } from "@/lib/public-brand";

type Slide = DemoHeroSlide & { key: string };

type Props = {
  content: HeroContent;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  ctaHref?: string;
  ctaLabel?: string;
  image?: string | null;
};

export function DemoHero({
  content,
  eyebrow = "NEW COLLECTION",
  title = "PTT Shop",
  subtitle = "Streetwear hiện đại / Cho phong cách của riêng bạn.",
  ctaHref = "/san-pham",
  ctaLabel = "Khám Phá Ngay",
  image,
}: Props) {
  const labelCta = content.ctaLabel || ctaLabel;
  const primary: Slide = {
    key: "primary",
    eyebrow,
    title: title.includes("PTT Shop") ? "PTT Shop" : title,
    subtitle,
    ctaHref: content.ctaHref || ctaHref,
    ctaLabel: labelCta,
    mainImage: image || content.imageUrl || homeImages.hero.main,
    sideAImage: homeImages.featured.small[0],
    sideBImage: homeImages.diverse.model,
  };

  const extras = (content.demoExtraSlides ?? []).map((s, i) => ({
    ...s,
    key: `extra-${i}`,
    ctaLabel: s.ctaLabel || labelCta,
  }));

  const slides: Slide[] = [primary, ...extras];

  const [index, setIndex] = useState(0);
  const slide = slides[index] ?? slides[0];
  const total = slides.length;
  const label = String(index + 1).padStart(2, "0");

  return (
    <section className="dv2-hero dv2-hero--strike" data-testid="demo-v2-hero" aria-label="Hero">
      <div className="dv2-hero__v" aria-hidden />
      <div className="dv2-hero__grain" aria-hidden />
      <div className="dv2-wrap dv2-hero__inner">
        <div className="dv2-hero__copy">
          <p className="dv2-kicker">{displayBrandName(slide.eyebrow)}</p>
          <h1 className="dv2-hero__title">
            {displayBrandName(slide.title)}
            <span>®</span>
          </h1>
          <p className="dv2-hero__sub">{slide.subtitle}</p>
          <Link href={slide.ctaHref} className="dv2-cta" data-testid="demo-v2-hero-cta">
            {slide.ctaLabel}
            <ArrowRight />
          </Link>

          <div className="dv2-slider" data-testid="demo-v2-slider">
            <button
              type="button"
              className="dv2-icon-btn"
              aria-label="Slide trước"
              onClick={() => setIndex((i) => (i - 1 + total) % total)}
              style={{ width: "1.75rem", height: "1.75rem", color: "#222" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <span>
              {label} / {String(total).padStart(2, "0")}
            </span>
            <div className="dv2-slider__bars" aria-hidden>
              {slides.map((_, i) => (
                <span
                  key={i}
                  className="dv2-slider__bar"
                  data-active={i === index ? "true" : "false"}
                />
              ))}
            </div>
            <div className="dv2-slider__arrows">
              <button
                type="button"
                aria-label="Slide sau"
                onClick={() => setIndex((i) => (i + 1) % total)}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="dv2-hero__stage">
          <div className="dv2-hero__main">
            <Image
              key={slide.mainImage}
              src={slide.mainImage}
              alt="Mẫu streetwear PTT Shop"
              fill
              priority
              sizes="(max-width:900px) 85vw, 48vw"
              className="dv2-hero__media"
            />
          </div>
          <div className="dv2-hero__side dv2-hero__side--a">
            <Image
              src={slide.sideAImage}
              alt=""
              fill
              sizes="180px"
              className="dv2-hero__media"
            />
          </div>
          <div className="dv2-hero__side dv2-hero__side--b">
            <Image
              src={slide.sideBImage}
              alt=""
              fill
              sizes="180px"
              className="dv2-hero__media"
            />
          </div>
        </div>
      </div>
    </section>
  );
}