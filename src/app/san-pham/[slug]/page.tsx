import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { ProductReviews } from "@/components/product/product-reviews";
import { publicCatalogWhere, publicVariants } from "@/lib/catalog-visibility";
import { sellableTotals } from "@/lib/dropship/service";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, jsonLdScript, productJsonLd, siteBaseUrl } from "@/lib/seo";
import { CUSTOMER_RATING_WHERE } from "@/lib/reviews";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, ...publicCatalogWhere },
    include: { images: { where: { isHidden: false }, orderBy: { sortOrder: "asc" } } },
  });
  if (!product) return { title: "Sản phẩm", robots: { index: false, follow: false } };
  const image = product.images.find((item) => item.type !== "video" && !item.isHidden);
  const canonical = `/san-pham/${product.slug}`;
  return {
    title: product.name,
    description: product.description ?? undefined,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      url: canonical,
      type: "website",
      images: image ? [{ url: image.url, alt: image.alt || product.name }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, ...publicCatalogWhere },
    include: {
      images: { where: { isHidden: false }, orderBy: { sortOrder: "asc" } },
      variants: publicVariants(),
      category: true,
    },
  });

  if (!product) notFound();

  const [sellable, rating] = await Promise.all([
    sellableTotals(prisma, product.variants.map((variant) => variant.id)),
    prisma.review.aggregate({
      where: { productId: product.id, ...CUSTOMER_RATING_WHERE },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);
  const customerReviewCount = rating._count.rating;
  const customerRating =
    customerReviewCount > 0 && rating._avg.rating != null
      ? Math.round(rating._avg.rating * 10) / 10
      : null;
  const productView = {
    ...product,
    customerRating,
    customerReviewCount,
    variants: product.variants.map((variant) => ({
      ...variant,
      stock: sellable.get(variant.id) ?? 0,
    })),
  };
  const base = siteBaseUrl();
  const pageUrl = absoluteUrl(`/san-pham/${product.slug}`, base);
  const photo = product.images.find((item) => item.type !== "video" && !item.isHidden);
  const prices = product.variants.map((variant) => variant.price).filter((price) => price > 0);
  const crumbs = [
    { name: "Trang chủ", url: base },
    { name: "Sản phẩm", url: absoluteUrl("/san-pham", base) },
  ];
  if (product.category) {
    crumbs.push({
      name: product.category.name,
      url: absoluteUrl(`/san-pham?category=${product.category.slug}`, base),
    });
  }
  crumbs.push({ name: product.name, url: pageUrl });
  const structured = productJsonLd({
    name: product.name,
    description: product.description,
    url: pageUrl,
    image: photo ? absoluteUrl(photo.url, base) : null,
    sku: product.variants[0]?.sku ?? null,
    price: prices.length ? Math.min(...prices) : null,
    availability: product.variants.some((variant) => (sellable.get(variant.id) ?? 0) > 0)
      ? "InStock"
      : "OutOfStock",
    breadcrumbs: crumbs,
    customerReviewCount,
    customerRating,
  });

  const shippingRow = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { shippingPolicyJson: true },
  });

  const related = await prisma.product.findMany({
    where: {
      ...publicCatalogWhere,
      id: { not: product.id },
      OR: [
        { slug: { contains: "hoodie", mode: "insensitive" } },
        { category: { slug: "hoodie" } },
      ],
    },
    include: {
      images: { where: { isHidden: false }, orderBy: { sortOrder: "asc" } },
      variants: publicVariants(),
    },
    take: 4,
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(structured) }} />
      <nav className="mb-6 text-xs text-neutral-500 md:text-xs">
        <div className="-mx-1 flex flex-wrap items-center gap-x-0 gap-y-1 max-md:text-sm max-md:leading-relaxed max-md:py-0.5">
          <Link href="/" className="rounded px-1 py-1 hover:text-neutral-800 max-md:py-1.5">
            Trang chủ
          </Link>
          <span className="mx-1.5 max-md:mx-2">/</span>
          <Link href="/san-pham" className="rounded px-1 py-1 hover:text-neutral-800 max-md:py-1.5">
            Sản phẩm
          </Link>
          {product.category ? (
            <>
              <span className="mx-1.5 max-md:mx-2">/</span>
              <Link
                href={`/san-pham?category=${product.category.slug}`}
                className="rounded px-1 py-1 hover:text-neutral-800 max-md:py-1.5"
              >
                {product.category.name}
              </Link>
            </>
          ) : null}
          <span className="mx-1.5 max-md:mx-2">/</span>
          <span className="rounded px-1 py-1 text-neutral-800 max-md:py-1.5">{product.name}</span>
        </div>
      </nav>

      <ProductDetailClient product={productView} shippingPolicyJson={shippingRow?.shippingPolicyJson ?? null} />

      <ProductReviews productId={product.id} />

      {related.length > 0 ? (
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="type-title text-2xl font-extrabold">
              Có Thể Bạn Cũng Thích
            </h2>
            <Link href="/san-pham" className="text-sm text-[var(--accent)]">
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
