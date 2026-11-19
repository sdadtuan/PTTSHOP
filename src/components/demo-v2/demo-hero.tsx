"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

type Slide = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaHref: string;
  ctaLabel: string;
  main: string;
  sideA: string;
  sideB: string;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "NEW COLLECTION",
    title: "VIZFAS",
    subtitle: "Streetwear hiện đại / Cho phong cách của riêng bạn.",
    ctaHref: "/san-pham",
    ctaLabel: "Khám Phá Ngay",
    main: "/images/home-v2/hero-main.jpg",
    sideA: "/images/home-v2/featured-hoodie.jpg",
    sideB: "/images/home-v2/mix-model.jpg",
  },
  {
    eyebrow: "ESSENTIALS",
    title: "VIZFAS",
    subtitle: "Form rộng, chất dày — dễ mặc mỗi ngày.",
    ctaHref: "/san-pham?category=hoodie",
    ctaLabel: "Khám Phá Ngay",
    main: "/images/home-v2/featured-1.jpg",
    sideA: "/images/home-v2/featured-jacket.jpg",
    sideB: "/images/home-v2/phoi-mau-main.jpg",
  },
  {
    eyebrow: "COLOR PLAY",
    title: "VIZFAS",
    subtitle: "Phối màu tạo chất — nổi bật mà vẫn tối giản.",
    ctaHref: "/bo-suu-tap",
    ctaLabel: "Khám Phá Ngay",
    main: "/images/home-v2/featured-2.jpg",
    sideA: "/images/home-v2/phoi-mau-3.jpg",
    sideB: "/images/home-v2/banner-right.jpg",
  },
];

export function DemoHero() {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index] ?? SLIDES[0];
  const total = SLIDES.length;
  const label = String(index + 1).padStart(2, "0");

  return (
    <section className="dv2-hero" data-testid="demo-v2-hero" aria-label="Hero">
      <div className="dv2-hero__v" aria-hidden />
      <div className="dv2-wrap dv2-hero__inner">
        <div className="dv2-hero__copy">
          <p className="dv2-kicker">{slide.eyebrow}</p>
          <h1 className="dv2-hero__title">
            {slide.title}
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
              {SLIDES.map((_, i) => (
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
              key={slide.main}
              src={slide.main}
              alt="Mẫu streetwear VIZFAS"
              fill
              priority
              sizes="(max-width:900px) 80vw, 420px"
              className="dv2-hero__media"
            />
          </div>
          <div className="dv2-hero__side dv2-hero__side--a">
            <Image
              src={slide.sideA}
              alt=""
              fill
              sizes="160px"
              className="dv2-hero__media"
            />
          </div>
          <div className="dv2-hero__side dv2-hero__side--b">
            <Image
              src={slide.sideB}
              alt=""
              fill
              sizes="160px"
              className="dv2-hero__media"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
