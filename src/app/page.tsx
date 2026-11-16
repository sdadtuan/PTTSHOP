import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Countdown } from "@/components/home/countdown";
import { ProductCard } from "@/components/product/product-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured, bestSellers, newest, flashSale] =
    await Promise.all([
      prisma.category.findMany({ orderBy: { sortOrder: "asc" }, take: 4 }),
      prisma.product.findMany({
        where: { isFeatured: true },
        include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
        take: 8,
      }),
      prisma.product.findMany({
        where: { isBestSeller: true },
        include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
        take: 8,
      }),
      prisma.product.findMany({
        where: { isNew: true },
        include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      prisma.flashSale.findFirst({
        where: { isActive: true, endsAt: { gt: new Date() } },
        orderBy: { endsAt: "asc" },
      }),
    ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[78vh] overflow-hidden bg-neutral-900 text-white md:min-h-[88vh]">
        <Image
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80"
          alt="VIZFAS fashion"
          fill
          priority
          className="animate-hero-ken object-cover opacity-70"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-4 pb-16 md:min-h-[88vh] md:justify-center md:px-6 md:pb-0">
          <div className="animate-fade-up max-w-xl">
            <p className="mb-3 text-xs tracking-[0.35em] text-white/70 uppercase">
              VIZFAS
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl leading-[1.05] font-extrabold tracking-tight md:text-6xl">
              Thời trang cho tất cả,
              <span className="mt-1 block text-[var(--accent)]">
                mỗi ngày đều chất
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/80 md:text-base">
              Khám phá phong cách mới cho chính bạn — chất liệu bền, form hiện đại,
              phụ kiện dễ phối.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/san-pham"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Mua ngay
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/bo-suu-tap"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Bộ sưu tập
              </Link>
            </div>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs backdrop-blur">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>4.8 · Chất liệu cực tốt, vải siêu bền</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold md:text-3xl">
              Khám phá danh mục
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Đa dạng phong cách cho mọi hoàn cảnh
            </p>
          </div>
          <Link
            href="/san-pham"
            className="hidden text-sm font-medium text-[var(--accent)] md:inline"
          >
            Xem tất cả
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/san-pham?category=${cat.slug}`}
              className="group relative aspect-[3/4] overflow-hidden bg-neutral-200"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <p className="absolute bottom-4 left-4 right-4 font-[family-name:var(--font-display)] text-lg font-semibold text-white">
                {cat.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold md:text-3xl">
                Sản phẩm nổi bật
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Những item dễ phối nhất tuần này
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {[
                { href: "/san-pham", label: "Tất cả" },
                { href: "/san-pham?gender=MALE", label: "Nam" },
                { href: "/san-pham?gender=FEMALE", label: "Nữ" },
                { href: "/san-pham?category=phu-kien", label: "Phụ kiện" },
              ].map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="rounded-full border border-neutral-200 px-4 py-1.5 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Flash sale */}
      {flashSale ? (
        <section className="border-y border-black/5 bg-[var(--accent-soft)] py-14">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold md:text-3xl">
                  {flashSale.title}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Kết thúc sau
                </p>
              </div>
              <Countdown endsAt={flashSale.endsAt.toISOString()} />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {bestSellers.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Lookbook strip */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80"
            alt="Lookbook"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-white md:px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-white/70">
            Non-limit Style
          </p>
          <h2 className="mt-3 max-w-lg font-[family-name:var(--font-display)] text-3xl font-bold md:text-5xl">
            Mặc đơn giản vẫn nổi bật
          </h2>
          <p className="mt-4 max-w-md text-sm text-white/80">
            Phong cách đơn giản mang đậm tính cá nhân — chất liệu cao cấp, giao hàng
            tận nơi, đổi trả dễ dàng.
          </p>
          <Link
            href="/bo-suu-tap"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-[var(--accent)] hover:text-white"
          >
            Khám phá BST
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold md:text-3xl">
              Hàng mới về
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Cập nhật liên tục mỗi tuần
            </p>
          </div>
          <Link href="/san-pham?new=1" className="text-sm font-medium text-[var(--accent)]">
            Xem tất cả
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {newest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-neutral-950 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 md:flex-row md:items-center md:px-6">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-wide">
              ĐĂNG KÝ NGAY
            </h2>
            <p className="mt-2 max-w-md text-sm text-neutral-400">
              Nhận thông tin BST mới và ưu đãi độc quyền từ VIZFAS.
            </p>
          </div>
          <form className="flex w-full max-w-md gap-2">
            <input
              type="email"
              placeholder="Email của bạn"
              className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-neutral-500 focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold whitespace-nowrap"
            >
              Đăng ký
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
