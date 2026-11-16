import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import type { Gender } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  category?: string;
  gender?: string;
  new?: string;
  q?: string;
}>;

const genderLabels: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  UNISEX: "Unisex",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const products = await prisma.product.findMany({
    where: {
      ...(params.category ? { category: { slug: params.category } } : {}),
      ...(params.gender && ["MALE", "FEMALE", "UNISEX"].includes(params.gender)
        ? { gender: params.gender as Gender }
        : {}),
      ...(params.new === "1" ? { isNew: true } : {}),
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q } },
              { slug: { contains: params.q } },
            ],
          }
        : {}),
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
          Sản phẩm
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {products.length} sản phẩm
          {params.gender ? ` · ${genderLabels[params.gender] ?? params.gender}` : ""}
          {params.category
            ? ` · ${categories.find((c) => c.slug === params.category)?.name ?? params.category}`
            : ""}
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <FilterChip href="/san-pham" active={!params.category && !params.gender && !params.new}>
          Tất cả
        </FilterChip>
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            href={`/san-pham?category=${c.slug}`}
            active={params.category === c.slug}
          >
            {c.name}
          </FilterChip>
        ))}
        <FilterChip href="/san-pham?gender=MALE" active={params.gender === "MALE"}>
          Nam
        </FilterChip>
        <FilterChip href="/san-pham?gender=FEMALE" active={params.gender === "FEMALE"}>
          Nữ
        </FilterChip>
        <FilterChip href="/san-pham?new=1" active={params.new === "1"}>
          Hàng mới
        </FilterChip>
      </div>

      {products.length === 0 ? (
        <p className="py-20 text-center text-neutral-500">
          Không tìm thấy sản phẩm phù hợp.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm transition",
        active
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
      )}
    >
      {children}
    </Link>
  );
}
