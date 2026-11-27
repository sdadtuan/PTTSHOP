import { allowSearch, clipLimit, readQuery, searchJson } from "@/lib/search/http";
import { emptySearch, nearSuggestions, searchCatalog } from "@/lib/search/query";
import { recordSearchEvent, searchSessionKey } from "@/lib/search/events";
import { randomBytes } from "crypto";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = readQuery(url.searchParams.get("q"));
  const sessionKey = searchSessionKey(req) || randomBytes(16).toString("hex");
  const cookie = searchSessionKey(req) ? undefined : sessionKey;
  if (!allowSearch(req, "search", 40)) {
    return searchJson(emptySearch(q), cookie);
  }
  try {
    const number = (key: string) => {
      const value = url.searchParams.get(key);
      if (!value || !/^\d+$/.test(value)) return undefined;
      return Number(value);
    };
    const result = await searchCatalog({
      q,
      limit: clipLimit(url.searchParams.get("limit")),
      filters: {
        category: url.searchParams.get("category") || undefined,
        color: url.searchParams.get("color") || undefined,
        size: url.searchParams.get("size") || undefined,
        priceMin: number("priceMin"),
        priceMax: number("priceMax"),
        gender: url.searchParams.get("gender") || undefined,
        isNew: url.searchParams.get("new") === "1",
        onSale: url.searchParams.get("sale") === "1",
      },
    });
    const near = result.total === 0 && q ? await nearSuggestions(q) : [];
    if (q) {
      await recordSearchEvent({
        kind: "results",
        query: q,
        parsed: result.parsedFilters,
        resultCount: result.total,
        sessionKey,
      });
    }
    return searchJson(
      {
        normalizedQuery: result.normalizedQuery,
        parsedFilters: result.parsedFilters,
        items: result.items.slice(0, result.limit),
        total: result.total,
        near,
      },
      cookie,
    );
  } catch (err) {
    console.error("search_failed", err instanceof Error ? err.name : "error");
    return searchJson(emptySearch(q), cookie);
  }
}
