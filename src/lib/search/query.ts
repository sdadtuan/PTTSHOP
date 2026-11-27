import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { foldKey, foldVi } from "@/lib/search/fold";
import { parseSearchQuery, suggestionPhrase, type ParsedSearch } from "@/lib/search/parse";
import { FUZZY_MIN, rankSearchHits } from "@/lib/search/rank";

const NEAR_MIN = 0.25;

export type SearchFilters = {
  category?: string;
  color?: string;
  size?: string;
  priceMin?: number;
  priceMax?: number;
  gender?: string;
  isNew?: boolean;
  onSale?: boolean;
  collection?: string;
};

export type CatalogHit = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image: string | null;
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function resolvedFilters(parsed: ParsedSearch, explicit: SearchFilters): SearchFilters & { keywords: string[] } {
  return {
    category: explicit.category || parsed.category,
    color: explicit.color || parsed.color,
    size: explicit.size || parsed.size,
    priceMin: explicit.priceMin ?? parsed.priceMin,
    priceMax: explicit.priceMax ?? parsed.priceMax,
    gender: explicit.gender || parsed.gender,
    isNew: explicit.isNew || parsed.isNew,
    onSale: explicit.onSale || parsed.onSale,
    keywords: parsed.keywords,
  };
}

function variantMatches(
  variant: { color: string; size: string; price: number; compareAt: number | null },
  filters: SearchFilters,
) {
  if (filters.color && !foldKey(variant.color).includes(filters.color)) return false;
  if (filters.size && variant.size.toUpperCase() !== filters.size.toUpperCase()) return false;
  if (filters.priceMin != null && variant.price < filters.priceMin) return false;
  if (filters.priceMax != null && variant.price > filters.priceMax) return false;
  if (filters.onSale && !(variant.compareAt != null && variant.compareAt > variant.price)) return false;
  return true;
}

async function textMatchIds(keywords: string[], fuzzy: string) {
  if (!keywords.length && fuzzy.length < 4) return null;
  const likes = keywords.map((keyword) => `%${escapeLike(keyword)}%`);
  const likeSql =
    likes.length > 0
      ? Prisma.join(
          likes.map((like) => Prisma.sql`COALESCE(p."searchText", '') ILIKE ${like}`),
          " AND ",
        )
      : Prisma.sql`FALSE`;
  const fuzzySql =
    fuzzy.length >= 4
      ? Prisma.sql`word_similarity(${fuzzy}, COALESCE(p."searchText", '')) > ${FUZZY_MIN}`
      : Prisma.sql`FALSE`;
  const rows = await prisma.$queryRaw<{ id: string; score: number }[]>(Prisma.sql`
    SELECT p.id, word_similarity(${fuzzy}, COALESCE(p."searchText", '')) AS score
    FROM "Product" p
    WHERE p."saleStatus" = 'SELLING'
      AND p."isDemo" = FALSE
      AND (${likeSql} OR ${fuzzySql})
    LIMIT 100
  `);
  return rows.map((row) => ({ id: row.id, score: Number(row.score) }));
}

export async function searchCatalog(input: { q?: string; filters?: SearchFilters; limit?: number }) {
  const parsed = parseSearchQuery(input.q || "");
  const filters = resolvedFilters(parsed, input.filters ?? {});
  const limit = Math.min(10, Math.max(1, input.limit || 8));
  const gender =
    filters.gender === "MALE" || filters.gender === "FEMALE" || filters.gender === "UNISEX"
      ? filters.gender
      : undefined;
  let textHits: { id: string; score: number }[] | null = null;
  if (filters.keywords.length) {
    textHits = await textMatchIds(filters.keywords, parsed.normalized);
  }
  const fuzzy = new Map((textHits ?? []).map((hit) => [hit.id, hit.score]));
  const products = textHits && textHits.length === 0 ? [] : await prisma.product.findMany({
    where: {
      saleStatus: "SELLING",
      isDemo: false,
      ...(textHits ? { id: { in: textHits.map((hit) => hit.id) } } : {}),
      ...(filters.category ? { category: { slug: filters.category } } : {}),
      ...(gender === "MALE" ? { gender: { in: ["MALE", "UNISEX"] } } : {}),
      ...(gender === "FEMALE" ? { gender: { in: ["FEMALE", "UNISEX"] } } : {}),
      ...(gender === "UNISEX" ? { gender: "UNISEX" } : {}),
      ...(filters.isNew ? { isNew: true } : {}),
      ...(filters.collection ? { collections: { some: { collection: { slug: filters.collection } } } } : {}),
    },
    include: {
      images: { where: { isHidden: false }, orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { select: { color: true, size: true, price: true, compareAt: true, colorHex: true } },
      category: { select: { name: true, slug: true } },
    },
  });
  const matched = products
    .map((product) => {
      const variants = product.variants.filter((variant) => variantMatches(variant, filters));
      return { product, variants };
    })
    .filter((row) => row.variants.length > 0);
  const ranked = rankSearchHits(
    input.q || "",
    matched.map(({ product }) => ({
      id: product.id,
      name: product.name,
      categoryName: product.category?.name,
      categorySlug: product.category?.slug,
      gender: product.gender,
      colors: product.variants.map((variant) => variant.color),
      sizes: product.variants.map((variant) => variant.size),
      createdAt: product.createdAt,
      fuzzy: fuzzy.get(product.id) ?? 0,
    })),
  );
  const byId = new Map(matched.map((row) => [row.product.id, row]));
  const rows = ranked.map((hit) => {
    const row = byId.get(hit.id)!;
    return { ...row.product, variants: row.variants };
  });
  const items = rows.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Math.min(...product.variants.map((variant) => variant.price)),
    image: product.images[0]?.url ?? null,
  }));

  return {
    normalizedQuery: parsed.normalized,
    parsedFilters: {
      category: filters.category ?? null,
      color: filters.color ?? null,
      size: filters.size ?? null,
      priceMin: filters.priceMin ?? null,
      priceMax: filters.priceMax ?? null,
      gender: gender ?? null,
      isNew: Boolean(filters.isNew),
      onSale: Boolean(filters.onSale),
      keywords: filters.keywords,
    },
    phrase: suggestionPhrase(parsed),
    products: rows,
    items,
    total: items.length,
    limit,
  };
}

export async function nearSuggestions(q: string) {
  const folded = foldVi(q);
  if (folded.length < 2) return [];
  const rows = await prisma.$queryRaw<{ name: string; slug: string; score: number }[]>(Prisma.sql`
    SELECT p.name, p.slug,
      word_similarity(${folded}, COALESCE(p."searchText", '')) AS score
    FROM "Product" p
    WHERE p."saleStatus" = 'SELLING' AND p."isDemo" = FALSE
    ORDER BY score DESC
    LIMIT 3
  `);
  return rows.filter((row) => Number(row.score) >= NEAR_MIN).map((row) => ({ name: row.name, slug: row.slug }));
}

export function emptySearch(q: string) {
  const parsed = parseSearchQuery(q);
  return {
    normalizedQuery: parsed.normalized,
    parsedFilters: {},
    phrase: "",
    items: [] as CatalogHit[],
    total: 0,
    near: [] as { name: string; slug: string }[],
  };
}
