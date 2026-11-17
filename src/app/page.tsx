import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Shirt, Truck } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const AI = "/images/ai-home";

/** Hero collage 3:4 — theo mock homepage-mau (4 tile). */
const HERO_TILES = [
  {
    src: `${AI}/hero-1-nam-thun-xanh.jpg`,
    alt: "Nam áo thun xanh",
    position: "object-[50%_18%]",
  },
  {
    src: `${AI}/hero-2-nu-thun-trang.jpg`,
    alt: "Nữ áo thun trắng",
    position: "object-[50%_12%]",
  },
  {
    src: `${AI}/hero-3-nam-den-ngoi.jpg`,
    alt: "Nam thun đen ngồi",
    position: "object-[50%_20%]",
  },
  {
    src: `${AI}/hero-4-nu-hoodie-croptop.jpg`,
    alt: "Nữ hoodie crop",
    position: "object-[50%_15%]",
  },
] as const;

/** Lookbook “Phối màu tạo chất” — 3 ảnh 3:4. */
const LOOKBOOK = [
  {
    src: `${AI}/look-1-thun-cam.jpg`,
    alt: "Look thun cam",
    position: "object-[50%_15%]",
  },
  {
    src: `${AI}/look-2-nu-quan-cam.jpg`,
    alt: "Look nữ quần cam",
    position: "object-[50%_12%]",
  },
  {
    src: `${AI}/look-3-raglan.jpg`,
    alt: "Look raglan",
    position: "object-[50%_18%]",
  },
] as const;

const CAT = {
  ao: `${AI}/cat-ao-thun.jpg`,
  quan: `${AI}/cat-quan.jpg`,
  pk: `${AI}/cat-phu-kien.jpg`,
} as const;

/** Khối “Đa dạng kiểu dáng” — reuse cat-quan / look-2 / hero-3. */
const DIVERSE = [
  {
    src: `${AI}/hero-3-nam-den-ngoi.jpg`,
    alt: "Đa dạng — nam đen",
    position: "object-[50%_18%]",
  },
  {
    src: `${AI}/cat-quan.jpg`,
    alt: "Đa dạng — quần cargo",
    position: "object-center",
  },
  {
    src: `${AI}/look-2-nu-quan-cam.jpg`,
    alt: "Đa dạng — nữ quần cam",
    position: "object-[50%_12%]",
  },
] as const;

export default async function HomePage() {
  const [categories, featured, newest] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, take: 4 }),
    prisma.product.findMany({
      where: { isFeatured: true },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isNew: true },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const mosaicCats = {
    ao: categories.find((c) => c.slug === "ao-thun") ?? categories[0],
    quan: categories.find((c) => c.slug === "quan") ?? categories[1],
    pk: categories.find((c) => c.slug === "phu-kien") ?? categories[2],
  };

  const featuredLarge = featured.slice(0, 2);
  const featuredSmall = featured.slice(2, 6);

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 md:grid-cols-2 md:gap-12 md:px-6 md:py-16">
        <div className="decor-dot top-8 left-8 h-10 w-10 bg-[var(--accent)]/80 animate-float-soft md:left-0" />
        <div className="decor-dot top-24 right-[48%] hidden h-8 w-8 bg-neutral-200 md:block" />

        <div className="animate-fade-up relative z-10 max-w-xl">
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-[1.05] font-extrabold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
            Mặc Đơn Giản
            <span className="mt-1 block text-[var(--accent)]">Vẫn Nổi Bật</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-neutral-600 md:text-base">
            Phong cách tối giản, chất liệu bền và form hiện đại — giúp bạn nổi
            bật theo cách riêng mỗi ngày.
          </p>
          <Link
            href="/san-pham"
            className="mt-8 inline-flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:bg-[var(--accent)]"
            aria-label="Xem sản phẩm"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="relative">
          <div className="decor-dot -top-4 -right-2 z-10 h-12 w-12 bg-[var(--accent)] md:h-16 md:w-16" />
          <div className="decor-dot -bottom-3 left-8 z-10 h-8 w-8 bg-neutral-200" />
          <div className="hero-mosaic">
            {HERO_TILES.map((tile, i) => (
              <div key={tile.src} className="relative overflow-hidden">
                <Image
                  src={tile.src}
                  alt={tile.alt}
                  fill
                  priority={i < 2}
                  sizes="(max-width:768px) 45vw, 22vw"
                  className={`object-cover ${tile.position}`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section className="mx-auto grid max-w-7xl gap-6 border-y border-black/5 px-4 py-8 sm:grid-cols-3 md:px-6">
        {[
          {
            icon: Truck,
            title: "GIAO HÀNG TOÀN QUỐC",
            desc: "Nhanh chóng, đúng hẹn",
          },
          {
            icon: Shirt,
            title: "CHẤT LIỆU CAO CẤP",
            desc: "Bền màu, thoải mái cả ngày",
          },
          {
            icon: MapPin,
            title: "ĐỊA CHỈ SHOWROOM",
            desc: "123 Nguyễn Huệ, Q.1, TP.HCM",
          },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-neutral-800" />
            <div>
              <p className="text-xs font-bold tracking-wide text-neutral-900">
                {item.title}
              </p>
              <p className="mt-1 text-xs text-neutral-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Banner ngang 16:9 — kem bên phải cho chữ/CTA */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-[#ebe6dc] sm:aspect-[16/9]">
          <Image
            src={`${AI}/banner-16x9.jpg`}
            alt="Phong cách đơn giản mang đậm tính cá nhân"
            fill
            sizes="100vw"
            className="object-cover object-left"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#ebe6dc]/95 md:via-[#ebe6dc]/25 md:to-[#ebe6dc]" />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col justify-center px-6 py-8 text-left sm:px-10 md:w-[48%] md:max-w-none md:text-left">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl md:text-4xl lg:text-5xl">
              Phong Cách Đơn Giản
              <span className="mt-1 block text-[var(--accent)]">
                Mang Đậm Tính Cá Nhân
              </span>
            </h2>
            <p className="mt-4 max-w-sm text-sm text-neutral-600">
              Tối giản không nhàm chán — mỗi outfit là một tuyên ngôn phong cách.
            </p>
            <Link
              href="/san-pham"
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
            >
              Khám phá ngay
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Collections mosaic 4:3 */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold md:text-3xl">
              Khám Phá Các Bộ Sưu Tập
            </h2>
            <p className="mt-2 max-w-md text-sm text-neutral-500">
              Áo thun, quần, phụ kiện — chọn nhanh theo nhu cầu phối đồ.
            </p>
          </div>
          <Link
            href="/bo-suu-tap"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900"
          >
            Xem tất cả bộ sưu tập
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-3 md:grid-rows-2 md:gap-4">
          <Link
            href={
              mosaicCats.ao
                ? `/san-pham?category=${mosaicCats.ao.slug}`
                : "/san-pham"
            }
            className="group relative min-h-[320px] overflow-hidden rounded-sm bg-neutral-200 md:row-span-2"
          >
            <Image
              src={CAT.ao}
              alt={mosaicCats.ao?.name || "Áo thun"}
              fill
              sizes="(max-width:768px) 100vw, 33vw"
              className="object-cover object-[50%_20%] transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-3">
              <div>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
                  {mosaicCats.ao?.name || "Áo Thun"}
                </p>
                <p className="mt-1 text-xs text-white/80">Form rộng, dễ layer</p>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
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
            className="group relative min-h-[200px] overflow-hidden rounded-sm bg-neutral-200 md:col-span-2"
          >
            <Image
              src={CAT.quan}
              alt={mosaicCats.quan?.name || "Quần"}
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover object-center transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-3">
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
            className="group relative min-h-[200px] overflow-hidden rounded-sm bg-neutral-200"
          >
            <Image
              src={CAT.pk}
              alt={mosaicCats.pk?.name || "Phụ kiện"}
              fill
              sizes="(max-width:768px) 100vw, 25vw"
              className="object-cover object-center transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            <p className="absolute bottom-4 left-4 font-[family-name:var(--font-display)] text-lg font-bold text-white">
              {mosaicCats.pk?.name || "Phụ Kiện"}
            </p>
          </Link>

          <div className="flex min-h-[200px] flex-col justify-between rounded-sm border border-black/5 bg-white p-5">
            <p className="text-sm leading-relaxed text-neutral-600">
              Bộ sưu tập Essentials giúp bạn mặc nhanh, phối dễ và luôn chỉn chu
              trong mọi hoàn cảnh.
            </p>
            <Link
              href="/bo-suu-tap"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]"
            >
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Đa dạng kiểu dáng — reuse cat-quan / look-2 / hero-3 */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[0.9fr_1.4fr] md:px-6 md:py-14">
        <div className="relative grid min-h-[420px] grid-cols-2 grid-rows-2 gap-2 overflow-hidden rounded-sm">
          <div className="relative row-span-2 overflow-hidden bg-neutral-200">
            <Image
              src={DIVERSE[0].src}
              alt={DIVERSE[0].alt}
              fill
              sizes="30vw"
              className={`object-cover ${DIVERSE[0].position}`}
            />
          </div>
          <div className="relative overflow-hidden bg-neutral-200">
            <Image
              src={DIVERSE[1].src}
              alt={DIVERSE[1].alt}
              fill
              sizes="20vw"
              className={`object-cover ${DIVERSE[1].position}`}
            />
          </div>
          <div className="relative overflow-hidden bg-neutral-200">
            <Image
              src={DIVERSE[2].src}
              alt={DIVERSE[2].alt}
              fill
              sizes="20vw"
              className={`object-cover ${DIVERSE[2].position}`}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <p className="pointer-events-none absolute top-8 left-4 font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-widest text-white/20 md:text-7xl">
            WEEKLY
          </p>
          <h2 className="absolute right-5 bottom-6 left-5 z-10 font-[family-name:var(--font-display)] text-2xl font-extrabold text-white md:text-3xl">
            Đa Dạng Kiểu Dáng Dễ Phối Đồ
          </h2>
        </div>
        <div>
          <div className="mb-5 flex flex-wrap gap-2 text-sm">
            {[
              { href: "/san-pham", label: "Tất cả", active: true },
              { href: "/san-pham?category=ao-thun", label: "Áo thun" },
              { href: "/san-pham?category=quan", label: "Quần" },
              { href: "/san-pham?category=phu-kien", label: "Phụ kiện" },
            ].map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={
                  tab.active
                    ? "rounded-full bg-neutral-900 px-4 py-1.5 text-white"
                    : "rounded-full border border-neutral-200 px-4 py-1.5 text-neutral-700 transition hover:border-neutral-900"
                }
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {newest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="bg-white py-14 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold md:text-3xl">
              Sản phẩm <span className="text-[var(--accent)]">Nổi Bật</span>
            </h2>
            <Link
              href="/san-pham"
              className="text-sm font-semibold tracking-wide"
            >
              XEM TẤT CẢ
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            {featuredLarge.map((p) => (
              <ProductCard key={p.id} product={p} large />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:mt-6 md:grid-cols-4 md:gap-6">
            {featuredSmall.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Lookbook — Phối màu tạo chất */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 py-14 md:px-6 md:py-20">
        <p className="pointer-events-none absolute top-1/2 right-2 hidden origin-center -translate-y-1/2 rotate-180 font-[family-name:var(--font-display)] text-xs font-bold tracking-[0.35em] text-neutral-400 [writing-mode:vertical-rl] md:block lg:right-0">
          BỘ SƯU TẬP MỚI
        </p>
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:pr-10">
          <div className="relative">
            <p className="pointer-events-none absolute -left-1 top-0 z-10 hidden max-w-[5rem] font-[family-name:var(--font-display)] text-4xl leading-[0.92] font-extrabold tracking-tight md:block lg:-left-3 lg:text-5xl">
              <span className="text-[var(--accent)]">PHỐI</span>
              <span className="block text-neutral-900">MÀU</span>
              <span className="block text-[var(--accent)]">TẠO</span>
              <span className="block text-neutral-900">CHẤT</span>
            </p>
            <div className="grid grid-cols-2 gap-3 md:pl-24 lg:pl-28">
              <div className="relative col-span-2 min-h-[380px] overflow-hidden rounded-sm bg-neutral-200 sm:min-h-[440px]">
                <Image
                  src={LOOKBOOK[0].src}
                  alt={LOOKBOOK[0].alt}
                  fill
                  priority
                  sizes="(max-width:768px) 100vw, 45vw"
                  className={`object-cover ${LOOKBOOK[0].position}`}
                />
              </div>
              {LOOKBOOK.slice(1).map((tile) => (
                <div
                  key={tile.src}
                  className="relative aspect-[3/4] overflow-hidden rounded-sm bg-neutral-200"
                >
                  <Image
                    src={tile.src}
                    alt={tile.alt}
                    fill
                    sizes="(max-width:768px) 50vw, 20vw"
                    className={`object-cover ${tile.position}`}
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold md:text-3xl">
              Xu Hướng Màu Sắc: Tự Tin Thể Hiện Phong Cách Riêng
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              Từ kem trung tính đến đen tối giản hay hồng nổi bật — VIZFAS giúp
              bạn phối màu tạo chất mà vẫn mặc được mỗi ngày. Chọn một item
              Essential, thêm phụ kiện, và hoàn thiện look trong vài phút.
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
