import { prisma } from "@/lib/prisma";
import { allowSearch, clipLimit, readQuery, searchJson } from "@/lib/search/http";
import { parseSearchQuery, searchPath } from "@/lib/search/parse";
import { foldVi } from "@/lib/search/fold";
import { searchCatalog } from "@/lib/search/query";
import { recordSearchEvent, searchSessionKey } from "@/lib/search/events";
import { randomBytes } from "crypto";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = readQuery(url.searchParams.get("q"));
  const limit = clipLimit(url.searchParams.get("limit"));
  const sessionKey = searchSessionKey(req) || randomBytes(16).toString("hex");
  const cookie = searchSessionKey(req) ? undefined : sessionKey;
  if (!q || q.length < 2 || !allowSearch(req, "search-suggest", 90)) {
    return searchJson({ products: [], categories: [], phrases: [] }, cookie);
  }
  try {
    const parsed = parseSearchQuery(q);
    const [result, categories] = await Promise.all([
      searchCatalog({ q, limit }),
      prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
    ]);
    const folded = foldVi(q);
    const categoryHits = categories
      .filter((category) => category.slug === parsed.category || foldVi(category.name) === folded)
      .slice(0, 3)
      .map((category) => ({
        name: category.name,
        href: `/san-pham?category=${category.slug}`,
      }));
    const phrase = result.phrase.trim();
    const phrases = phrase ? [{ label: phrase, href: searchPath(q, parsed) }] : [];
    await recordSearchEvent({
      kind: "suggest",
      query: q,
      parsed: result.parsedFilters,
      resultCount: result.total,
      sessionKey,
    });
    return searchJson(
      {
        products: result.items.slice(0, limit).map((item) => ({
          name: item.name,
          href: `/san-pham/${item.slug}`,
          slug: item.slug,
        })),
        categories: categoryHits,
        phrases,
      },
      cookie,
    );
  } catch (err) {
    console.error("suggest_failed", err instanceof Error ? err.name : "error");
    return searchJson({ products: [], categories: [], phrases: [] }, cookie);
  }
}
