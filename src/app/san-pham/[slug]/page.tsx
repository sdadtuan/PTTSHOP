import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
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
        { categoryId: product.categoryId ?? undefined },
        { gender: product.gender },
      ],
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
    },
    take: 4,
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

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} name={product.name} />
        <ProductPurchase product={product} />
      </div>

      <section className="mt-16 grid gap-8 border-t border-neutral-100 pt-10 md:grid-cols-2">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Chi tiết sản phẩm
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            {product.description}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm" id="bang-size">
            <div className="border border-neutral-100 bg-white p-3">
              <dt className="text-neutral-500">Chất liệu</dt>
              <dd className="mt-1 font-medium">{product.material ?? "—"}</dd>
            </div>
            <div className="border border-neutral-100 bg-white p-3">
              <dt className="text-neutral-500">Form</dt>
              <dd className="mt-1 font-medium">{product.fit ?? "—"}</dd>
            </div>
            <div className="border border-neutral-100 bg-white p-3">
              <dt className="text-neutral-500">Độ dày</dt>
              <dd className="mt-1 font-medium">{product.thickness ?? "—"}</dd>
            </div>
            <div className="border border-neutral-100 bg-white p-3">
              <dt className="text-neutral-500">Xuất xứ</dt>
              <dd className="mt-1 font-medium">{product.origin ?? "—"}</dd>
            </div>
          </dl>
        </div>
        <div className="relative min-h-[280px] overflow-hidden bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              product.images[1]?.url ||
              product.images[0]?.url ||
              "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80"
            }
            alt="Chi tiết chất liệu"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
              Có thể bạn cũng thích
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
