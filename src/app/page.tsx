import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, RefreshCw, Truck, Wallet } from "lucide-react";
import { HomeStyleTabs } from "@/components/home/home-style-tabs";
import { PhoiMauType } from "@/components/home/phoi-mau-type";
import { ProductCard } from "@/components/product/product-card";
import { homeImages } from "@/config/home-images";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TRUST = [
  { icon: Truck, title: "FREE SHIP đơn hàng > 500k" },
  { icon: Wallet, title: "THANH TOÁN khi nhận hàng" },
  { icon: RefreshCw, title: "ĐỔI TRẢ 30 ngày" },
] as const;

export default async function HomePage() {
  const [categories, featured, catalog] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, take: 6 }),
    prisma.product.findMany({
      where: { isFeatured: true },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
      take: 8,
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
  ]);

  const mosaicCats = {
    ao: categories.find((c) => c.slug === "ao-thun") ?? categories[0],
    quan: categories.find((c) => c.slug === "quan") ?? categories[1],
    pk: categories.find((c) => c.slug === "phu-kien") ?? categories[2],
  };

  const countFor = (slug?: string | null) =>
    catalog.filter((p) => p.category?.slug === slug).length || undefined;

  // Prefer enough featured rows; pad from catalog so home-v2 slots always fill.
  const featuredPool =
    featured.length >= 6
      ? featured
      : [...featured, ...catalog.filter((p) => !featured.some((f) => f.id === p.id))].slice(
          0,
          6,
        );
  const featuredLarge = featuredPool.slice(0, 2);
  const featuredSmall = featuredPool.slice(2, 6);

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative bg-[#f3f3f3]/70">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:gap-12 md:px-6 md:py-16 lg:py-20">
          <div className="decor-dot top-10 left-6 h-9 w-9 bg-[var(--accent)] animate-float-soft md:left-2" />
          <div className="decor-dot top-28 left-[42%] hidden h-7 w-7 bg-neutral-300/80 md:block" />

          <div className="animate-fade-up relative z-10 max-w-xl">
            <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-neutral-700 uppercase">
              <span className="inline-block h-3 w-3 rounded-[3px] bg-[var(--accent)]" />
              BỘ SƯU TẬP Hè 2024
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl leading-[1.05] font-extrabold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl lg:text-[3.75rem]">
              Mặc Đơn Giản
              <span className="mt-1 block text-[var(--accent)]">Vẫn Nổi Bật</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-neutral-600 md:text-[15px]">
              Phong cách tối giản, chất liệu bền và form hiện đại — giúp bạn nổi
              bật theo cách riêng mỗi ngày.
            </p>
            <Link
              href="/san-pham"
              className="mt-8 inline-flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm transition hover:bg-[var(--accent)]"
              aria-label="Xem sản phẩm"
            >
              <ArrowRight className="h-5 w-5" />
            </Link>

            <ul className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-3">
              {TRUST.map((item) => (
                <li key={item.title} className="flex items-start gap-2.5">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-800" />
                  <span className="text-[11px] leading-snug font-semibold tracking-wide text-neutral-800 uppercase">
                    {item.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="decor-dot -top-3 -right-1 z-10 h-12 w-12 bg-[var(--accent)] md:h-14 md:w-14" />
            <div className="decor-dot -bottom-2 left-6 z-10 h-8 w-8 bg-neutral-300" />
            <div
              className="hero-mosaic-6"
              style={
                {
                  ["--hero-src"]: `url(${homeImages.hero.main})`,
                } as CSSProperties
              }
              role="img"
              aria-label="Hero collage VIZFAS"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} />
              ))}
            </div>
            {/* Preload hero for LCP */}
            <Image
              src={homeImages.hero.main}
              alt=""
              width={864}
              height={1152}
              priority
              className="sr-only"
            />
          </div>
        </div>
      </section>

      {/* Dual banner */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
            Phong Cách Đơn Giản
            <span className="mt-1 block text-[var(--accent)]">
              Mang Đậm Tính Cá Nhân
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-neutral-500">
            Tối giản không nhàm chán — mỗi outfit là một tuyên ngôn phong cách.
          </p>
        </div>

        <div className="relative mt-12 flex flex-col items-center justify-center gap-8 md:mt-14 md:flex-row md:gap-14">
          <div className="decor-dot top-6 left-[6%] hidden h-10 w-10 bg-[var(--accent)] md:block" />
          <div className="decor-dot right-[8%] bottom-2 hidden h-8 w-8 bg-neutral-300 md:block" />

          <div className="relative z-10 w-full max-w-[280px] -rotate-3 overflow-hidden rounded-2xl bg-neutral-200 shadow-sm md:max-w-[300px]">
            <div className="relative aspect-[3/4]">
              <Image
                src={homeImages.dualBanner.left}
                alt="Look đơn giản — banner trái"
                fill
                sizes="300px"
                className="object-cover object-[50%_12%]"
              />
            </div>
          </div>

          <div className="relative w-full max-w-[360px] md:max-w-[400px]">
            {/* Orange square behind right photo (mock) */}
            <div
              className="absolute -right-3 -bottom-3 h-[72%] w-[78%] rounded-2xl bg-[var(--accent)] md:-right-5 md:-bottom-5"
              aria-hidden
            />
            <div className="relative z-10 rotate-2 overflow-hidden rounded-2xl bg-neutral-200 shadow-md">
              <div className="relative aspect-square">
                <Image
                  src={homeImages.dualBanner.right}
                  alt="Look đơn giản — banner phải"
                  fill
                  sizes="400px"
                  className="object-cover object-[50%_20%]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collections mosaic */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-8 grid gap-4 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold md:text-4xl">
            Khám Phá Các{" "}
            <span className="text-[var(--accent)]">Bộ Sưu Tập</span>
          </h2>
          <p className="max-w-md text-sm text-neutral-500 md:justify-self-end md:text-right">
            Áo thun, quần, phụ kiện — chọn nhanh theo nhu cầu phối đồ hàng ngày.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:grid-rows-2 md:gap-5">
          <Link
            href={
              mosaicCats.ao
                ? `/san-pham?category=${mosaicCats.ao.slug}`
                : "/san-pham"
            }
            className="group relative min-h-[360px] overflow-hidden rounded-2xl bg-neutral-200 md:row-span-2"
          >
            <Image
              src={homeImages.collections.aoThun}
              alt={mosaicCats.ao?.name || "Áo thun"}
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover object-[50%_18%] transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between gap-3">
              <div>
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                  {mosaicCats.ao?.name || "Áo Thun"}
                </p>
                <p className="mt-1 text-xs text-white/80">
                  {countFor(mosaicCats.ao?.slug)
                    ? `${countFor(mosaicCats.ao?.slug)} sản phẩm`
                    : "Form rộng, dễ layer"}
                </p>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          <Link
            href={
              mosaicCats.quan
                ? `/san-pham?category=${mosaicCats.quan.slug}`
                : "/san-pham"
            }
            className="group relative min-h-[220px] overflow-hidden rounded-2xl bg-neutral-200"
          >
            <Image
              src={homeImages.collections.quan}
              alt={mosaicCats.quan?.name || "Quần"}
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover object-center transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between gap-3">
              <div>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
                  {mosaicCats.quan?.name || "Quần"}
                </p>
                <p className="mt-1 text-xs text-white/80">Cargo &amp; easy fit</p>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          <Link
            href={
              mosaicCats.pk
                ? `/san-pham?category=${mosaicCats.pk.slug}`
                : "/san-pham"
            }
            className="group relative min-h-[220px] overflow-hidden rounded-2xl bg-neutral-200"
          >
            <Image
              src={homeImages.collections.phuKien}
              alt={mosaicCats.pk?.name || "Phụ kiện"}
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover object-center transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between gap-3">
              <div>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
                  {mosaicCats.pk?.name || "Phụ Kiện"}
                </p>
                <p className="mt-1 text-xs text-white/80">Hoàn thiện outfit</p>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Đa dạng kiểu dáng */}
      <section className="relative mx-auto grid max-w-7xl gap-10 overflow-hidden px-4 py-14 md:grid-cols-[0.85fr_1.15fr] md:gap-12 md:px-6 md:py-20">
        <p className="pointer-events-none absolute top-8 left-2 hidden font-[family-name:var(--font-display)] text-[7rem] leading-none font-extrabold tracking-[0.12em] text-neutral-200/80 select-none md:block lg:text-[9rem]">
          WEARLY
        </p>

        <div className="relative z-10 flex flex-col">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
            Đa Dạng Kiểu Dáng
            <span className="mt-1 block">Dễ Phối Đồ</span>
          </h2>
          <Link
            href="/san-pham"
            className="mt-6 inline-flex w-fit items-center gap-3 rounded-full border border-neutral-200 bg-white py-1.5 pr-1.5 pl-5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:border-neutral-900"
          >
            Xem tất cả sản phẩm
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <div className="relative mt-8 min-h-[400px] flex-1 md:mt-10">
            <div className="absolute inset-x-0 bottom-0 h-[90%] overflow-hidden rounded-t-[2rem] bg-gradient-to-b from-neutral-100 to-neutral-200/40">
              <Image
                src={homeImages.diverse.model}
                alt="Đa dạng kiểu dáng"
                fill
                sizes="(max-width:768px) 100vw, 40vw"
                className="object-cover object-[50%_12%]"
              />
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <HomeStyleTabs products={catalog} />
        </div>
      </section>

      {/* Featured 2 + 4 */}
      <section className="bg-white py-14 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold md:text-3xl">
              Sản phẩm <span className="text-[var(--accent)]">Nổi Bật</span>
            </h2>
            <Link
              href="/san-pham"
              className="text-xs font-bold tracking-[0.14em] text-neutral-800 uppercase"
            >
              XEM TẤT CẢ →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            {featuredLarge.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                large
                imageOverride={homeImages.featured.large[i]}
              />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:mt-6 md:grid-cols-4 md:gap-6">
            {featuredSmall.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                imageOverride={homeImages.featured.small[i]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* PHỐI MÀU TẠO CHẤT */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 py-14 md:px-6 md:py-20">
        <p className="pointer-events-none absolute top-1/2 right-1 hidden origin-center -translate-y-1/2 rotate-180 text-[10px] font-bold tracking-[0.35em] text-neutral-400 [writing-mode:vertical-rl] md:block lg:right-0">
          BỘ SƯU TẬP MỚI
        </p>

        <div className="grid items-start gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-12 lg:pr-8">
          <div className="relative grid gap-4 md:grid-cols-[auto_1fr] md:gap-5">
            <PhoiMauType />

            <div className="grid gap-3 sm:grid-cols-[1.05fr_0.95fr]">
              <div className="relative min-h-[380px] overflow-hidden rounded-2xl bg-neutral-200 sm:min-h-[460px] sm:row-span-2">
                <Image
                  src={homeImages.colorPlay.main}
                  alt="Phối màu tạo chất"
                  fill
                  sizes="(max-width:768px) 100vw, 30vw"
                  className="object-cover object-[50%_15%]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:col-start-2">
                {homeImages.colorPlay.grid.map((src, i) => (
                  <div
                    key={src}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-200"
                  >
                    <Image
                      src={src}
                      alt={`Look phối màu ${i + 1}`}
                      fill
                      sizes="(max-width:768px) 40vw, 12vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:pt-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold md:text-3xl">
              Xu Hướng Màu Sắc: Tự Do Thể Hiện Phong Cách
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              Từ kem trung tính đến đen tối giản hay cam nổi bật — VIZFAS giúp
              bạn phối màu tạo chất mà vẫn mặc được mỗi ngày.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              Chọn một item Essential, thêm phụ kiện, và hoàn thiện look trong
              vài phút — giữ form sạch, điểm nhấn rõ.
            </p>
            <Link
              href="/bo-suu-tap"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
            >
              Khám phá lookbook
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
