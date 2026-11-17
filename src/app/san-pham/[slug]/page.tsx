import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { ProductReviews } from "@/components/product/product-reviews";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return { title: "Sản phẩm" };
  return {
    title: product.name,
    description: product.description ?? undefined,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
      category: true,
    },
  });

  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      OR: [
        { slug: { contains: "hoodie" } },
        { category: { slug: "hoodie" } },
      ],
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
    },
    take: 4,
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <nav className="mb-6 text-xs text-neutral-500">
        <Link href="/" className="hover:text-neutral-800">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <Link href="/san-pham" className="hover:text-neutral-800">
          Sản phẩm
        </Link>
        {product.category ? (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/san-pham?category=${product.category.slug}`}
              className="hover:text-neutral-800"
            >
              {product.category.name}
            </Link>
          </>
        ) : null}
        <span className="mx-2">/</span>
        <span className="text-neutral-800">{product.name}</span>
      </nav>

      <ProductDetailClient product={product} />

      <ProductReviews productId={product.id} />

      {related.length > 0 ? (
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
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
