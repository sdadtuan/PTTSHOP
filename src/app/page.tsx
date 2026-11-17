import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Shirt, Truck } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const HERO_TILES = [
  "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=85",
];

const LOOKBOOK = [
  "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=600&q=85",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=85",
  "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=85",
  "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&w=600&q=85",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=85",
];

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
          <div className="decor-dot -top-4 -right-2 h-12 w-12 bg-[var(--accent)] md:h-16 md:w-16" />
          <div className="decor-dot -bottom-3 left-8 h-8 w-8 bg-neutral-200" />
          <div className="hero-mosaic aspect-[5/6] overflow-hidden rounded-sm">
            {HERO_TILES.map((src, i) => (
              <div key={src} className="relative overflow-hidden bg-neutral-200">
                <Image
                  src={src}
                  alt={`Look VIZFAS ${i + 1}`}
                  fill
                  priority={i < 2}
                  sizes="(max-width:768px) 33vw, 16vw"
                  className="object-cover"
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

      {/* Secondary banner */}
      <section className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-14 md:grid-cols-[1fr_1.2fr_1fr] md:px-6 md:py-20">
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-200">
          <Image
            src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85"
            alt="Look trái"
            fill
            sizes="25vw"
            className="object-cover"
          />
        </div>
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight md:text-5xl">
            Phong Cách Đơn Giản
            <span className="mt-2 block text-[var(--accent)]">Mang Đậm Tính</span>
            <span className="mt-2 block">Cá Nhân</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm text-neutral-500">
            Tối giản không nhàm chán — mỗi outfit là một tuyên ngôn phong cách.
          </p>
        </div>
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-200">
          <Image
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85"
            alt="Look phải"
            fill
            sizes="25vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* Collections mosaic */}
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
            href={mosaicCats.ao ? `/san-pham?category=${mosaicCats.ao.slug}` : "/san-pham"}
            className="group relative min-h-[320px] overflow-hidden bg-neutral-200 md:row-span-2"
          >
            <Image
              src={mosaicCats.ao?.image || HERO_TILES[2]}
              alt={mosaicCats.ao?.name || "Áo thun"}
              fill
              sizes="(max-width:768px) 100vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <p className="absolute bottom-4 left-4 font-[family-name:var(--font-display)] text-xl font-bold text-white">
              {mosaicCats.ao?.name || "Áo thun"}
            </p>
            <span className="absolute right-4 bottom-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            href={mosaicCats.quan ? `/san-pham?category=${mosaicCats.quan.slug}` : "/san-pham"}
            className="group relative min-h-[200px] overflow-hidden bg-neutral-200 md:col-span-2"
          >
            <Image
              src={mosaicCats.quan?.image || HERO_TILES[4]}
              alt={mosaicCats.quan?.name || "Quần"}
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            <p className="absolute bottom-4 left-4 font-[family-name:var(--font-display)] text-xl font-bold text-white">
              {mosaicCats.quan?.name || "Quần"}
            </p>
            <span className="absolute right-4 bottom-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            href={mosaicCats.pk ? `/san-pham?category=${mosaicCats.pk.slug}` : "/san-pham"}
            className="group relative min-h-[200px] overflow-hidden bg-neutral-200"
          >
            <Image
              src={mosaicCats.pk?.image || HERO_TILES[5]}
              alt={mosaicCats.pk?.name || "Phụ kiện"}
              fill
              sizes="(max-width:768px) 100vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            <p className="absolute bottom-4 left-4 font-[family-name:var(--font-display)] text-lg font-bold text-white">
              {mosaicCats.pk?.name || "Phụ kiện"}
            </p>
          </Link>

          <div className="flex min-h-[200px] flex-col justify-between border border-black/5 bg-white p-5">
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

      {/* Category + new products */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[0.9fr_1.4fr] md:px-6 md:py-14">
        <div className="relative min-h-[420px] overflow-hidden bg-neutral-200">
          <Image
            src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1200&q=85"
            alt="Đa dạng kiểu dáng"
            fill
            sizes="40vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <h2 className="absolute right-5 bottom-6 left-5 font-[family-name:var(--font-display)] text-2xl font-extrabold text-white md:text-3xl">
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
            <Link href="/san-pham" className="text-sm font-semibold tracking-wide">
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

      {/* Lookbook */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative">
            <p className="pointer-events-none absolute -left-2 top-0 z-10 hidden max-w-[4.5rem] font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[0.95] tracking-tight md:block lg:text-5xl">
              PHỐI
              <span className="block text-[var(--accent)]">MÀU</span>
              TẠO
              <span className="block text-[var(--accent)]">CHẤT</span>
            </p>
            <div className="grid grid-cols-3 gap-3 md:pl-24">
              <div className="relative col-span-2 row-span-2 min-h-[360px] overflow-hidden bg-neutral-200">
                <Image src={LOOKBOOK[0]} alt="Lookbook chính" fill sizes="40vw" className="object-cover" />
              </div>
              {LOOKBOOK.slice(1).map((src, i) => (
                <div key={src} className="relative aspect-square overflow-hidden bg-neutral-200">
                  <Image src={src} alt={`Lookbook ${i + 2}`} fill sizes="15vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold md:text-3xl">
              Xu Hướng Màu Sắc: Tự Do Thể Hiện Phong Cách Riêng
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
