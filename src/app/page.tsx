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
      {/* Hero */}
      <section className="relative bg-[#f3f3f3]/70">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:gap-12 md:px-6 md:py-16 lg:py-20">
          <div className="decor-dot top-10 left-6 h-10 w-10 rounded-xl bg-[var(--accent)] animate-float-soft md:left-2" />
          <div className="decor-dot top-28 left-[42%] hidden h-8 w-8 rounded-full bg-neutral-300/80 md:block" />

          <div className="animate-fade-up relative z-10 max-w-xl">
            <p className="mb-5 inline-flex items-center gap-2.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold tracking-[0.14em] text-neutral-800 uppercase shadow-sm ring-1 ring-black/5">
              <span className="inline-block h-3.5 w-3.5 rotate-12 rounded-[4px] bg-[var(--accent)]" />
              Bộ sưu tập mới 2026
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-5xl leading-[0.98] font-black tracking-tight text-neutral-900 sm:text-6xl md:text-7xl lg:text-[5.25rem]">
              {heroTitle}
              <span className="mt-2 inline-block text-[var(--accent)]">
                {heroSubtitle}
                <span
                  className="mt-1 block h-1.5 w-[72%] rounded-full bg-[var(--accent)]"
                  aria-hidden
                />
              </span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-600 md:text-lg">
              Những chiếc áo thun dành cho phong cách hiện đại, thoải mái và tự
              tin mỗi ngày.
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
                  <span className="text-[11px] leading-snug font-bold tracking-wide text-neutral-800">
                    {item.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -top-4 -right-2 z-20 h-14 w-14 rotate-6 rounded-2xl bg-[var(--accent)] md:-top-5 md:-right-3 md:h-16 md:w-16" />
            <div className="decor-dot -bottom-2 left-6 z-10 h-9 w-9 rounded-xl bg-neutral-300" />
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

      {/* Dual banner — title center, tilted left above, right + orange block */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 py-16 md:px-6 md:py-24">
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-black tracking-tight text-neutral-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Phong Cách Đơn Giản
            <span className="mt-2 block text-[var(--accent)]">
              Mang Đậm Tính Cá Nhân
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base text-neutral-500">
            Tối giản không nhàm chán — mỗi outfit là một tuyên ngôn phong cách.
          </p>
        </div>

        <div className="relative mt-14 flex flex-col items-center justify-center md:mt-16 md:flex-row md:items-end md:justify-center md:gap-10 lg:gap-16">
          <div className="decor-dot top-0 left-[4%] z-0 hidden h-12 w-12 rounded-2xl bg-[var(--accent)] md:block" />
          <div className="decor-dot right-[6%] bottom-8 z-0 hidden h-10 w-10 rounded-2xl bg-neutral-300 md:block" />

          <div className="relative z-10 mb-6 w-[min(100%,280px)] -translate-y-4 -rotate-6 overflow-hidden rounded-2xl bg-neutral-200 shadow-md md:mb-10 md:w-[300px] md:-translate-y-10">
            <div className="relative" style={{ aspectRatio: FRAME_ASPECT.bannerLeft }}>
              <Image
                src={homeImages.dualBanner.left}
                alt="Look đơn giản — banner trái"
                fill
                sizes="300px"
                className="object-cover"
                style={{ objectPosition: OBJECT_POSITION.bannerLeft }}
              />
            </div>
          </div>

          <div className="relative z-10 w-[min(100%,380px)] md:w-[420px]">
            <div
              className="absolute -right-4 -bottom-4 h-[78%] w-[82%] rounded-2xl bg-[var(--accent)] md:-right-6 md:-bottom-6"
              aria-hidden
            />
            <div className="relative z-10 rotate-3 overflow-hidden rounded-2xl bg-neutral-200 shadow-lg">
              <div className="relative" style={{ aspectRatio: FRAME_ASPECT.bannerRight }}>
                <Image
                  src={homeImages.dualBanner.right}
                  alt="Look đơn giản — banner phải"
                  fill
                  sizes="420px"
                  className="object-cover"
                  style={{ objectPosition: OBJECT_POSITION.bannerRight }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collections mosaic */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-16">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-4xl leading-[1.05] font-black md:text-5xl lg:text-6xl">
            <span className="block text-neutral-900">Khám Phá Các</span>
            <span className="block text-[var(--accent)]">Bộ Sưu Tập</span>
          </h2>
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
              <p className="font-[family-name:var(--font-display)] text-2xl font-black text-neutral-900 md:text-3xl">
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
              <p className="font-[family-name:var(--font-display)] text-xl font-black text-neutral-900 md:text-2xl">
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
              <p className="font-[family-name:var(--font-display)] text-xl font-black text-neutral-900 md:text-2xl">
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

      {/* Đa dạng kiểu dáng */}
      <section className="relative mx-auto grid max-w-7xl gap-10 overflow-hidden px-4 py-14 md:grid-cols-[0.9fr_1.1fr] md:gap-12 md:px-6 md:py-20">
        <p className="pointer-events-none absolute top-10 left-0 z-0 hidden font-[family-name:var(--font-display)] text-[7.5rem] leading-none font-black tracking-[0.06em] text-neutral-200 select-none md:block lg:top-6 lg:text-[9.5rem]">
          WEARLY
        </p>

        <div className="relative z-10 flex flex-col">
          <p className="mb-3 text-xs font-bold tracking-[0.18em] text-[var(--accent)] uppercase">
            Gợi ý mix
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-black tracking-tight text-neutral-900 md:text-5xl">
            Đa Dạng Kiểu Dáng
            <span className="mt-1 block text-[var(--accent)]">Dễ Phối Đồ</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-600">
            Những mẫu quần dành cho phong cách hiện đại, thoải mái và phù hợp mỗi
            ngày.
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

          <div className="relative mt-8 flex-1 md:mt-10">
            <div
              className="relative w-full overflow-hidden rounded-t-[2rem] bg-gradient-to-b from-neutral-100 to-neutral-200/40"
              style={{ aspectRatio: FRAME_ASPECT.diverseModel }}
            >
              <Image
                src={homeImages.diverse.model}
                alt="Đa dạng kiểu dáng"
                fill
                sizes="(max-width:768px) 100vw, 40vw"
                className="object-cover"
                style={{ objectPosition: OBJECT_POSITION.diverseModel }}
              />
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <HomeStyleTabs products={catalog} />
        </div>
      </section>

      {/* Featured 2 + 4 — always 6 slots with home-v2 images */}
      <section className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-10 flex items-end justify-between gap-4">
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-black md:text-5xl">
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

      {/* PHỐI MÀU — model trái + type chồng giữa + text/grid phải (~60%) */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 py-14 md:px-6 md:py-20">
        <div className="grid items-stretch gap-6 lg:grid-cols-[0.95fr_1.35fr] lg:gap-4 lg:pr-12">
          <div className="relative min-h-[420px] lg:min-h-[640px]">
            <div className="absolute inset-0 overflow-hidden bg-white">
              <Image
                src={homeImages.colorPlay.main}
                alt="Phối màu tạo chất"
                fill
                sizes="(max-width:1024px) 100vw, 40vw"
                className="object-contain object-bottom"
                style={{ objectPosition: "50% 100%" }}
                priority
              />
            </div>
            <div className="pointer-events-none absolute top-[8%] left-[42%] z-10 -translate-x-1/2 lg:left-[58%]">
              <PhoiMauType />
            </div>
          </div>

          <div className="relative flex w-full flex-col justify-between gap-8 lg:w-[92%] lg:max-w-none lg:justify-self-end">
            <div className="max-w-xl">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-black leading-snug text-neutral-900 md:text-3xl lg:text-[2rem]">
                Xu Hướng Màu Sắc: Tự Do Thể Hiện Phong Cách Riêng
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600 md:text-[15px]">
                Từ kem trung tính đến đen tối giản hay cam nổi bật — VIZFAS giúp
                bạn phối màu tạo chất mà vẫn mặc được mỗi ngày.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 md:text-[15px]">
                Chọn một item Essential, thêm phụ kiện, và hoàn thiện look trong
                vài phút — giữ form sạch, điểm nhấn rõ.
              </p>
            </div>

            <div
              className="grid w-full grid-cols-3"
              style={{ gap: Math.max(4, Math.round(GAPS.phoiGrid.desktop * 0.45)) }}
            >
              {homeImages.colorPlay.grid.map((src, i) => (
                <div
                  key={src}
                  className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100 sm:aspect-[4/3]"
                  data-testid={`phoi-grid-cell-${i + 1}`}
                >
                  <Image
                    src={src}
                    alt={`Look phối màu ${i + 1}`}
                    fill
                    sizes="(max-width:768px) 30vw, 12vw"
                    className="object-cover"
                    style={{ objectPosition: OBJECT_POSITION.phoiGrid }}
                    loading="eager"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute top-1/2 right-3 z-20 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex lg:right-1"
          data-testid="phoi-vertical-label"
        >
          <span className="h-10 w-0.5 bg-[var(--accent)]" aria-hidden />
          <p className="rotate-180 text-[11px] font-black tracking-[0.38em] text-[var(--accent)] [writing-mode:vertical-rl]">
            BỘ SƯU TẬP MỚI
          </p>
          <span className="h-10 w-0.5 bg-[var(--accent)]" aria-hidden />
        </div>
      </section>
    </div>
  );
}
