import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Gem,
  Leaf,
  Shirt,
  Truck,
} from "lucide-react";
import { HeroShatterCollage } from "@/components/home/hero-shatter-collage";
import { HomeStyleTabs } from "@/components/home/home-style-tabs";
import { PhoiMauType } from "@/components/home/phoi-mau-type";
import { ProductCard } from "@/components/product/product-card";
import { FRAME_ASPECT, GAPS, OBJECT_POSITION } from "@/config/home-frame-specs";
import { homeImages } from "@/config/home-images";
import { TYPE_SCALE } from "@/config/home-type-scale";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TRUST = [
  { icon: Leaf, title: "Chất liệu thoáng mát" },
  { icon: Shirt, title: "Form dáng hiện đại" },
  { icon: Gem, title: "Bền màu" },
  { icon: Truck, title: "Free ship > 500k" },
] as const;

type CardProduct = {
  id: string;
  name: string;
  slug: string;
  images: { url: string; alt: string | null }[];
  variants: {
    price: number;
    compareAt: number | null;
    colorHex: string | null;
  }[];
};

function padProducts(list: CardProduct[], need: number, pool: CardProduct[]) {
  const out = [...list];
  for (const p of pool) {
    if (out.length >= need) break;
    if (!out.some((x) => x.id === p.id)) out.push(p);
  }
  while (out.length < need && out.length > 0) {
    out.push({ ...out[out.length % list.length || 0], id: `${out[0].id}-pad-${out.length}` });
  }
  return out.slice(0, need);
}

export default async function HomePage() {
  const [categories, featured, catalog, heroBanner] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, take: 6 }),
    prisma.product.findMany({
      where: { isFeatured: true },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
      take: 12,
    }),
    prisma.product.findMany({
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        category: { select: { slug: true } },
      },
      take: 24,
      orderBy: [{ isNew: "desc" }, { createdAt: "desc" }],
    }),
    prisma.heroBanner.findFirst({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const heroSrc = heroBanner?.imageUrl || homeImages.hero.main;
  const heroTitle = heroBanner?.title || "Mặc Đơn Giản";
  const heroSubtitle = heroBanner?.subtitle || "Vẫn Nổi Bật";
  const heroCtaHref = heroBanner?.ctaHref || "/san-pham";

  const mosaicCats = {
    ao: categories.find((c) => c.slug === "ao-thun") ?? categories[0],
    quan: categories.find((c) => c.slug === "quan") ?? categories[1],
    pk: categories.find((c) => c.slug === "phu-kien") ?? categories[2],
  };

  const pool = padProducts(featured, 6, catalog);
  const featuredLarge = pool.slice(0, 2);
  const featuredSmall = pool.slice(2, 6);

  return (
    <div className="overflow-x-hidden">
      {/* Hero — text ~45% / collage ~50%; title vertically mid-collage */}
      <section className="relative bg-[#f0f0f0]">
        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 py-12 md:grid-cols-[0.45fr_0.5fr] md:gap-[5%] md:px-6 md:py-16 lg:py-20">
          <div className="absolute top-8 left-4 z-0 h-12 w-12 rotate-[14deg] rounded-xl bg-[var(--accent)] md:left-2 md:h-14 md:w-14" />
          <div className="absolute top-24 left-[38%] z-0 hidden h-10 w-10 rounded-full bg-neutral-300/90 md:block" />

          <div className="animate-fade-up relative z-10 w-full min-w-0 md:max-w-[45vw]">
            <div
              className="mb-6 inline-flex items-center gap-3"
              data-testid="hero-badge"
              style={{ fontSize: TYPE_SCALE.heroBadge.css }}
            >
              <span className="inline-block h-[2.4em] w-[2.4em] shrink-0 rotate-12 rounded-lg bg-[var(--accent)]" />
              <p className="text-[1em] leading-[1.2] font-bold tracking-[0.06em] text-neutral-800 uppercase">
                <span className="block">Bộ sưu tập</span>
                <span className="block">mới 2026</span>
              </p>
            </div>
            <h1
              className="w-full font-[family-name:var(--font-display)] leading-[0.95] font-black tracking-tight text-neutral-900"
              style={{ fontSize: TYPE_SCALE.heroH1.css }}
              data-testid="hero-h1"
            >
              <span className="block md:whitespace-nowrap">{heroTitle}</span>
              <span className="mt-1 block text-[var(--accent)] md:whitespace-nowrap">
                {heroSubtitle}
                <span
                  className="mt-2 block h-2 w-[70%] rounded-full bg-[var(--accent)]"
                  aria-hidden
                />
              </span>
            </h1>
            <p className="mt-6 max-w-[36ch] text-base leading-relaxed text-neutral-600 md:text-lg">
              Những chiếc áo thun dành cho phong cách hiện đại, thoải mái và tự tin mỗi ngày.
            </p>
            <Link
              href={heroCtaHref}
              className="mt-10 inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md transition hover:bg-[var(--accent)]"
              aria-label={heroBanner?.ctaLabel || "Xem sản phẩm"}
            >
              <ArrowRight className="h-6 w-6" />
            </Link>

            <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-3">
              {TRUST.map((item) => (
                <li key={item.title} className="flex items-start gap-2.5">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-800" />
                  <span
                    className="leading-snug font-bold tracking-wide text-neutral-800"
                    style={{ fontSize: TYPE_SCALE.heroFeature.css }}
                  >
                    {item.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative min-w-0 self-center">
            <div className="absolute -top-6 -left-3 z-20 h-12 w-12 -rotate-6 rounded-xl bg-neutral-300 md:h-14 md:w-14" />
            <div className="absolute -top-4 -right-1 z-20 h-14 w-14 rotate-[18deg] rounded-2xl bg-[var(--accent)] md:-right-3 md:h-16 md:w-16" />
            <div className="absolute -bottom-3 left-8 z-10 h-10 w-10 rotate-12 rounded-xl bg-neutral-300" />
            <HeroShatterCollage src={heroSrc} />
            <Link
              href={heroCtaHref}
              className="absolute -right-2 bottom-8 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition hover:bg-[var(--accent)] md:-right-4 md:bottom-12 md:h-16 md:w-16"
              aria-label="Khám phá bộ sưu tập"
            >
              <ArrowUpRight className="h-6 w-6" />
            </Link>
            <Image
              src={heroSrc}
              alt=""
              width={864}
              height={1152}
              priority
              className="sr-only"
            />
          </div>
        </div>
      </section>

      {/* Banner Phong Cách — desktop layered; mobile stacked (no overflow) */}
      <section className="relative overflow-hidden bg-[#f3f3f3]" data-testid="banner-phong-cach">
        {/* —— Desktop —— */}
        <div className="relative mx-auto hidden min-h-[min(42vw,480px)] max-w-7xl px-6 py-12 md:block">
          <div className="pointer-events-none absolute top-2 right-[10%] z-0 h-24 w-24 rotate-[20deg] rounded-2xl bg-[var(--accent)]" />
          <div className="pointer-events-none absolute bottom-5 left-[2%] z-0 h-20 w-20 -rotate-[16deg] rounded-2xl bg-[var(--accent)]" />

          {/* Left photo — only touches title edge */}
          <div className="absolute top-6 left-[1%] z-10 w-[20%] max-w-[260px] -rotate-[8deg] overflow-hidden rounded-xl bg-neutral-200 shadow-md">
            <div className="relative" style={{ aspectRatio: FRAME_ASPECT.bannerLeft }}>
              <Image
                src={homeImages.dualBanner.left}
                alt="Look đơn giản — banner trái"
                fill
                sizes="20vw"
                className="object-cover"
                style={{ objectPosition: OBJECT_POSITION.bannerLeft }}
              />
            </div>
          </div>

          {/* Title above images; starts clear of left photo */}
          <div className="relative z-40 ml-[22%] w-[58%] max-w-[760px] pt-[10%]">
            <h2
              className="font-[family-name:var(--font-display)] leading-[0.95] font-black tracking-tight text-neutral-900"
              style={{ fontSize: TYPE_SCALE.bannerH2.css }}
              data-testid="banner-title"
            >
              <span className="block whitespace-nowrap">Phong Cách Đơn Giản</span>
              <span className="mt-1 block whitespace-nowrap text-[var(--accent)]">
                Mang Đậm Tính
              </span>
              <span className="mt-1 flex items-center gap-4 whitespace-nowrap text-[var(--accent)]">
                Cá Nhân
                <span
                  className="h-2 w-[28%] min-w-[6rem] max-w-[12rem] rounded-full bg-[var(--accent)]"
                  aria-hidden
                />
              </span>
            </h2>
            <p
              className="mt-4 w-[77%] min-w-[22rem] max-w-[36rem] leading-relaxed text-neutral-600"
              style={{ fontSize: TYPE_SCALE.bannerDesc.css }}
            >
              Những bộ trang phục dành cho phong cách hiện đại, thoải mái và tự tin mỗi ngày.
            </p>
          </div>

          {/* Right photo — top ngang Cá Nhân (thấp hơn dòng 1), dưới chữ */}
          <div className="absolute top-[54%] right-[2%] z-10 w-[20%] max-w-[260px] rotate-[5deg]">
            <div
              className="absolute -right-3 -bottom-3 h-[82%] w-[88%] rotate-2 rounded-2xl bg-[var(--accent)]"
              aria-hidden
            />
            <div className="relative z-10 overflow-hidden rounded-xl bg-neutral-200 shadow-lg">
              <div className="relative" style={{ aspectRatio: FRAME_ASPECT.bannerRight }}>
                <Image
                  src={homeImages.dualBanner.right}
                  alt="Look đơn giản — banner phải"
                  fill
                  sizes="20vw"
                  className="object-cover"
                  style={{ objectPosition: OBJECT_POSITION.bannerRight }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* —— Mobile: ảnh tách riêng, chữ wrap —— */}
        <div className="mx-auto max-w-7xl px-4 py-8 md:hidden">
          <div className="mb-5 flex items-end justify-center gap-4">
            <div className="w-[38%] -rotate-[6deg] overflow-hidden rounded-xl bg-neutral-200 shadow-md">
              <div className="relative" style={{ aspectRatio: FRAME_ASPECT.bannerLeft }}>
                <Image
                  src={homeImages.dualBanner.left}
                  alt="Look đơn giản — banner trái"
                  fill
                  sizes="38vw"
                  className="object-cover"
                  style={{ objectPosition: OBJECT_POSITION.bannerLeft }}
                />
              </div>
            </div>
            <div className="relative w-[42%] rotate-[4deg]">
              <div
                className="absolute -right-2 -bottom-2 h-[80%] w-[84%] rounded-2xl bg-[var(--accent)]"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-xl bg-neutral-200 shadow-md">
                <div className="relative" style={{ aspectRatio: FRAME_ASPECT.bannerRight }}>
                  <Image
                    src={homeImages.dualBanner.right}
                    alt="Look đơn giản — banner phải"
                    fill
                    sizes="42vw"
                    className="object-cover"
                    style={{ objectPosition: OBJECT_POSITION.bannerRight }}
                  />
                </div>
              </div>
            </div>
          </div>
          <h2
            className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,8vw,2.5rem)] leading-[1.05] font-black tracking-tight break-words text-neutral-900"
            data-testid="banner-title-mobile"
          >
            <span className="block">Phong Cách Đơn Giản</span>
            <span className="mt-1 block text-[var(--accent)]">Mang Đậm Tính</span>
            <span className="mt-1 block text-[var(--accent)]">Cá Nhân</span>
          </h2>
          <p className="mt-3 text-base leading-relaxed break-words text-neutral-600">
            Những bộ trang phục dành cho phong cách hiện đại, thoải mái và tự tin mỗi ngày.
          </p>
        </div>
      </section>

      {/* Collections mosaic */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-16">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold text-[var(--accent)]">Bộ sưu tập</p>
            <h2
              className="font-[family-name:var(--font-display)] leading-[1.02] font-black"
              style={{ fontSize: TYPE_SCALE.collectionsH2.css }}
            >
              <span className="block text-neutral-900">Khám Phá Các</span>
              <span className="block text-[var(--accent)]">Bộ Sưu Tập</span>
            </h2>
          </div>
          <Link
            href="/bo-suu-tap"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-4"
          >
            Xem tất cả bộ sưu tập
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div
          className="grid md:grid-cols-2 md:grid-rows-2"
          style={{ gap: GAPS.collections.desktop }}
        >
          <Link
            href={
              mosaicCats.ao
                ? `/san-pham?category=${mosaicCats.ao.slug}`
                : "/san-pham"
            }
            className="group relative overflow-hidden rounded-2xl bg-neutral-200 md:row-span-2"
            style={{ aspectRatio: FRAME_ASPECT.catAoThun }}
          >
            <Image
              src={homeImages.collections.aoThun}
              alt={mosaicCats.ao?.name || "Áo thun"}
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-105"
              style={{ objectPosition: OBJECT_POSITION.catAoThun }}
            />
            <div className="absolute top-5 left-5 z-10 max-w-[70%]">
              <p
                className="font-[family-name:var(--font-display)] font-black text-neutral-900"
                style={{ fontSize: TYPE_SCALE.tileLabel.css }}
              >
                {mosaicCats.ao?.name || "Áo Thun"}
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-800">
                BST mới với nhiều màu sắc
              </p>
            </div>
            <span className="absolute right-5 bottom-5 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md transition group-hover:bg-[var(--accent)]">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </Link>

          <Link
            href={
              mosaicCats.quan
                ? `/san-pham?category=${mosaicCats.quan.slug}`
                : "/san-pham"
            }
            className="group relative overflow-hidden rounded-2xl bg-neutral-200"
            style={{ aspectRatio: FRAME_ASPECT.catQuan }}
          >
            <Image
              src={homeImages.collections.quan}
              alt={mosaicCats.quan?.name || "Quần"}
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-105"
              style={{ objectPosition: OBJECT_POSITION.catQuan }}
            />
            <div className="absolute top-4 left-4 z-10 max-w-[65%]">
              <p
                className="font-[family-name:var(--font-display)] font-black text-neutral-900"
                style={{ fontSize: TYPE_SCALE.tileLabel.css }}
              >
                {mosaicCats.quan?.name || "Quần"}
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-800">
                Đa dạng kiểu dáng, dễ phối đồ
              </p>
            </div>
            <span className="absolute right-4 bottom-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md transition group-hover:bg-[var(--accent)]">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            href={
              mosaicCats.pk
                ? `/san-pham?category=${mosaicCats.pk.slug}`
                : "/san-pham"
            }
            className="group relative overflow-hidden rounded-2xl bg-neutral-200"
            style={{ aspectRatio: FRAME_ASPECT.catPhuKien }}
          >
            <Image
              src={homeImages.collections.phuKien}
              alt={mosaicCats.pk?.name || "Phụ kiện"}
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-105"
              style={{ objectPosition: OBJECT_POSITION.catPhuKien }}
            />
            <div className="absolute top-4 left-4 z-10 max-w-[65%]">
              <p
                className="font-[family-name:var(--font-display)] font-black text-neutral-900"
                style={{ fontSize: TYPE_SCALE.tileLabel.css }}
              >
                {mosaicCats.pk?.name || "Phụ Kiện"}
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-800">
                Hoàn thiện phong cách của bạn
              </p>
            </div>
            <span className="absolute right-4 bottom-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md transition group-hover:bg-[var(--accent)]">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* Đa dạng — trái ~45% / phải ~52%; title đúng 3 dòng; model ~15–18% ngang */}
      <section className="relative mx-auto overflow-hidden px-4 py-14 md:px-6 md:py-20">
        <div className="mx-auto grid max-w-7xl items-start gap-6 md:grid-cols-[0.45fr_0.52fr] md:gap-[3%]">
          <div className="relative z-10 flex min-w-0 flex-col">
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-[var(--accent)] uppercase">
              BST quần
            </p>
            <div className="relative flex min-h-[480px] items-start gap-3 md:min-h-[560px]">
              <div className="relative z-20 min-w-0 flex-1 pr-[36%] md:pr-[38%]">
                <h2
                  className="font-[family-name:var(--font-display)] leading-[1.02] font-black tracking-tight text-neutral-900"
                  style={{ fontSize: TYPE_SCALE.diverseH2.css }}
                  data-testid="diverse-title"
                >
                  <span className="block md:whitespace-nowrap">Đa Dạng</span>
                  <span className="block md:whitespace-nowrap">Kiểu Dáng</span>
                  <span className="mt-0.5 block text-[var(--accent)] md:whitespace-nowrap">
                    Dễ Phối Đồ
                  </span>
                </h2>
                <p className="mt-4 max-w-[28ch] text-sm leading-relaxed text-neutral-600 md:text-[15px]">
                  Những mẫu quần dành cho phong cách hiện đại, thoải mái và phù hợp mỗi ngày.
                </p>
                <Link
                  href="/san-pham"
                  className="mt-6 inline-flex w-fit items-center gap-3 text-sm font-semibold text-neutral-900"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm transition hover:bg-[var(--accent)]">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  Xem tất cả sản phẩm
                </Link>
              </div>
              {/* Model ~15–18% page ≈ ~38% of left col; tall nearly full card */}
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[36%] max-w-[220px] min-w-[130px] md:w-[38%]">
                <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-neutral-100/60 to-transparent">
                  <Image
                    src={homeImages.diverse.model}
                    alt="Đa dạng kiểu dáng"
                    fill
                    sizes="18vw"
                    className="object-cover object-top"
                    style={{ objectPosition: OBJECT_POSITION.diverseModel }}
                  />
                </div>
              </div>
            </div>
            <p className="pointer-events-none mt-auto pt-1 font-[family-name:var(--font-display)] text-[4rem] leading-none font-black tracking-[0.04em] text-neutral-200 select-none md:text-[5.5rem]">
              WEARLY
            </p>
          </div>

          <div className="relative z-10 min-w-0 overflow-hidden">
            <HomeStyleTabs products={catalog} />
          </div>
        </div>
      </section>

      {/* Featured 2 + 4 — always 6 slots with home-v2 images */}
      <section className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-10 flex items-end justify-between gap-4">
            <h2
              className="font-[family-name:var(--font-display)] font-black"
              style={{ fontSize: TYPE_SCALE.featuredH2.css }}
            >
              Sản phẩm <span className="text-[var(--accent)]">Nổi Bật</span>
            </h2>
            <Link
              href="/san-pham"
              className="text-sm font-bold tracking-[0.14em] text-neutral-800 uppercase"
            >
              XEM TẤT CẢ →
            </Link>
          </div>

          <div
            className="grid md:grid-cols-2"
            style={{ gap: GAPS.featured.desktop }}
          >
            {featuredLarge.map((p, i) => (
              <ProductCard
                key={`feat-l-${p.id}-${i}`}
                product={p}
                large
                frame="featuredLarge"
                imageOverride={homeImages.featured.large[i]}
                priority
              />
            ))}
          </div>
          <div
            className="mt-5 grid grid-cols-2 md:mt-6 md:grid-cols-4"
            style={{ gap: GAPS.featured.desktop }}
          >
            {homeImages.featured.small.map((src, i) => {
              const p =
                featuredSmall[i] ||
                catalog[i] ||
                featuredLarge[0] ||
                ({
                  id: `feat-fallback-${i}`,
                  name: ["Áo Hoodie Basic", "Áo Khoác Dù", "Áo Polo", "Quần Cargo"][i],
                  slug: "ao-hoodie-essential",
                  images: [],
                  variants: [{ price: 549000, compareAt: 799000, colorHex: "#111" }],
                } as CardProduct);
              return (
                <ProductCard
                  key={`feat-s-${p.id}-${i}`}
                  product={p}
                  frame="featuredSmall"
                  imageOverride={src}
                  priority
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* PHỐI MÀU — model full height; type clear; lưới spans under CHẤT (not over type) */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 py-14 md:px-6 md:py-20">
        <div className="relative grid grid-cols-1 gap-x-3 gap-y-4 lg:grid-cols-[minmax(200px,0.26fr)_minmax(220px,0.3fr)_minmax(0,0.44fr)] lg:[grid-template-areas:'model_type_copy'_'model_grid_grid'] lg:pr-14">
          <div className="relative z-10 h-[420px] lg:h-auto lg:[grid-area:model]">
            <Image
              src={homeImages.colorPlay.main}
              alt="Phối màu tạo chất"
              fill
              sizes="(max-width:1024px) 100vw, 26vw"
              className="object-cover object-top"
              priority
            />
          </div>

          <div className="relative z-30 lg:[grid-area:type]">
            <PhoiMauType />
          </div>

          <div className="relative z-20 min-w-0 pt-1 lg:[grid-area:copy]">
            <h2
              className="font-[family-name:var(--font-display)] font-black leading-snug text-neutral-900"
              style={{ fontSize: TYPE_SCALE.phoiXuHuong.css }}
            >
              Xu Hướng Màu Sắc: Tự Do Thể Hiện Phong Cách Riêng
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600 md:text-[15px]">
              Từ kem trung tính đến đen tối giản hay cam nổi bật — VIZFAS giúp bạn
              phối màu tạo chất mà vẫn mặc được mỗi ngày.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 md:text-[15px]">
              Chọn một item Essential, thêm phụ kiện, và hoàn thiện look trong vài
              phút — giữ form sạch, điểm nhấn rõ.
            </p>
          </div>

          <div className="relative z-10 w-full lg:[grid-area:grid]">
            <div className="grid grid-cols-3 gap-1 md:gap-1.5">
              {homeImages.colorPlay.grid.map((src, i) => (
                <div
                  key={src}
                  className="relative aspect-[4/5] overflow-hidden bg-neutral-100 sm:aspect-[4/3]"
                  data-testid={`phoi-grid-cell-${i + 1}`}
                >
                  <Image
                    src={src}
                    alt={`Look phối màu ${i + 1}`}
                    fill
                    sizes="(max-width:768px) 30vw, 18vw"
                    className="object-cover"
                    style={{ objectPosition: OBJECT_POSITION.phoiGrid }}
                    loading="eager"
                  />
                </div>
              ))}
            </div>
            {/* Vertical label = đúng cao lưới + vạch cam; 1 dòng nowrap */}
            <div
              className="pointer-events-none absolute inset-y-0 -right-3 z-20 hidden flex-col items-center md:flex lg:-right-6"
              data-testid="phoi-vertical-label"
            >
              <span className="w-1.5 flex-1 rounded-full bg-[var(--accent)]" aria-hidden />
              <p
                className="my-2 rotate-180 whitespace-nowrap font-black tracking-[0.22em] text-[var(--accent)] [writing-mode:vertical-rl]"
                style={{ fontSize: TYPE_SCALE.verticalLabel.css }}
              >
                BỘ SƯU TẬP MỚI
              </p>
              <span className="w-1.5 flex-1 rounded-full bg-[var(--accent)]" aria-hidden />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
