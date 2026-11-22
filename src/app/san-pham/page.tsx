import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { publicVariants } from "@/lib/catalog-visibility";
import { prisma } from "@/lib/prisma";
import { buildProductWhere, sortProductsByPrice } from "@/lib/products-query";
import { cn } from "@/lib/utils";
import type { ProductSort } from "@/lib/validation";
import { getStorefrontUi } from "@/lib/storefront/ui-copy";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  category?: string;
  gender?: string;
  collection?: string;
  new?: string;
  q?: string;
  sort?: string;
  page?: string;
}>;

const genderLabels: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  UNISEX: "Unisex",
};

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá tăng" },
  { value: "price_desc", label: "Giá giảm" },
  { value: "name_asc", label: "Tên A–Z" },
  { value: "bestseller", label: "Bán chạy" },
];

function buildQuery(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const q = sp.toString();
  return q ? `/san-pham?${q}` : "/san-pham";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const ui = (await getStorefrontUi()).products;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 12;
  const sort = (sortOptions.some((s) => s.value === params.sort)
    ? params.sort
    : "newest") as ProductSort;

  const [categories, collections, all] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.collection.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: buildProductWhere({
        category: params.category,
        gender: params.gender,
        collection: params.collection,
        q: params.q,
        isNew: params.new === "1",
      }),
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: publicVariants(),
        category: true,
      },
    }),
  ]);

  const sorted = sortProductsByPrice(all, sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const products = sorted.slice((page - 1) * pageSize, page * pageSize);

  const baseParams = {
    category: params.category,
    gender: params.gender,
    collection: params.collection,
    new: params.new,
    q: params.q,
    sort,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-title text-3xl font-bold md:text-4xl">
            {ui.title}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {total} {ui.countSuffix}
            {params.gender
              ? ` · ${genderLabels[params.gender] ?? params.gender}`
              : ""}
            {params.category
              ? ` · ${categories.find((c) => c.slug === params.category)?.name ?? params.category}`
              : ""}
            {params.collection
              ? ` · ${collections.find((c) => c.slug === params.collection)?.name ?? params.collection}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          <span>{ui.sortLabel}</span>
          {sortOptions.map((o) => (
            <Link
              key={o.value}
              href={buildQuery({ ...baseParams, sort: o.value, page: "1" })}
              className={cn(
                "rounded px-2 py-1 text-xs",
                "max-md:inline-flex max-md:min-h-11 max-md:items-center max-md:px-3 max-md:py-2.5 max-md:text-sm",
                sort === o.value
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-500 hover:text-neutral-900",
              )}
            >
              {o.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <FilterChip
          href="/san-pham"
          active={
            !params.category &&
            !params.gender &&
            !params.new &&
            !params.collection
          }
        >
          {ui.filterAll}
        </FilterChip>
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            href={buildQuery({ category: c.slug, sort })}
            active={params.category === c.slug}
          >
            {c.name}
          </FilterChip>
        ))}
        <FilterChip
          href={buildQuery({ gender: "MALE", sort })}
          active={params.gender === "MALE"}
        >
          {ui.filterMen}
        </FilterChip>
        <FilterChip
          href={buildQuery({ gender: "FEMALE", sort })}
          active={params.gender === "FEMALE"}
        >
          {ui.filterWomen}
        </FilterChip>
        <FilterChip
          href={buildQuery({ new: "1", sort })}
          active={params.new === "1"}
        >
          {ui.filterNew}
        </FilterChip>
        {collections.map((c) => (
          <FilterChip
            key={c.id}
            href={buildQuery({ collection: c.slug, sort })}
            active={params.collection === c.slug}
          >
            {c.name}
          </FilterChip>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="py-20 text-center text-neutral-500">
          {ui.emptyMessage}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-10 flex items-center justify-center gap-2">
          {page > 1 ? (
            <Link
              href={buildQuery({ ...baseParams, page: String(page - 1) })}
              className="rounded border border-neutral-200 px-3 py-1.5 text-sm"
            >
              {ui.pagePrev}
            </Link>
          ) : null}
          <span className="text-sm text-neutral-500">
            {ui.pageOf} {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildQuery({ ...baseParams, page: String(page + 1) })}
              className="rounded border border-neutral-200 px-3 py-1.5 text-sm"
            >
              {ui.pageNext}
            </Link>
          ) : null}
        </div>
      ) : null}
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
        "max-md:inline-flex max-md:min-h-11 max-md:items-center max-md:px-4 max-md:py-2.5",
        active
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
      )}
    >
      {children}
    </Link>
  );
}
