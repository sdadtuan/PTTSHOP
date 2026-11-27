import { foldKey } from "@/lib/search/fold";
import { relevanceTokens } from "@/lib/search/parse";

/** Khớp đủ mọi từ trong tên. */
export const NAME_MATCH_SCORE = 1;
/** Khớp đủ mọi từ trong tên hoặc danh mục/thuộc tính. */
export const ATTRIBUTE_MATCH_SCORE = 0.8;
/** Sàn khớp mờ để được tính là kết quả. */
export const FUZZY_MIN = 0.3;
/**
 * Cắt đuôi khớp mờ: nếu kết quả cao nhất ≥ 0.7 thì bỏ kết quả dưới 0.5 lần điểm đó.
 * Điểm tên = 1, điểm danh mục/thuộc tính = 0.8, điểm mờ = word_similarity.
 */
export const STRONG_SCORE = 0.7;
export const TAIL_RATIO = 0.5;

export type RankHit = {
  id: string;
  name: string;
  categoryName?: string | null;
  categorySlug?: string | null;
  gender?: string | null;
  colors?: string[];
  sizes?: string[];
  createdAt: Date | string | number;
  fuzzy?: number;
};

function wordsOf(parts: Array<string | null | undefined>) {
  return new Set(
    parts
      .filter(Boolean)
      .join(" ")
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
}

function genderWord(gender?: string | null) {
  if (gender === "MALE") return "nam";
  if (gender === "FEMALE") return "nu";
  if (gender === "UNISEX") return "unisex";
  return "";
}

export function searchScore(query: string, hit: RankHit) {
  const wanted = relevanceTokens(query);
  if (!wanted.length) return 0;
  const nameWords = wordsOf([foldKey(hit.name)]);
  const attributeWords = wordsOf([
    foldKey(hit.categoryName || ""),
    foldKey(hit.categorySlug || ""),
    genderWord(hit.gender),
    ...(hit.colors ?? []).map((color) => foldKey(color)),
    ...(hit.sizes ?? []).map((size) => foldKey(size)),
  ]);
  if (wanted.every((token) => nameWords.has(token))) return NAME_MATCH_SCORE;
  if (wanted.every((token) => nameWords.has(token) || attributeWords.has(token))) return ATTRIBUTE_MATCH_SCORE;
  const fuzzy = hit.fuzzy ?? 0;
  return fuzzy >= FUZZY_MIN ? fuzzy : 0;
}

export function rankSearchHits<T extends RankHit>(query: string, hits: T[]): T[] {
  const wanted = relevanceTokens(query);
  if (!wanted.length) return hits;
  const scored = hits
    .map((hit) => ({ hit, score: searchScore(query, hit) }))
    .filter((row) => row.score > 0);
  const best = scored.reduce((max, row) => Math.max(max, row.score), 0);
  const floor = best >= STRONG_SCORE ? best * TAIL_RATIO : 0;
  return scored
    .filter((row) => row.score >= floor)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const length = a.hit.name.length - b.hit.name.length;
      if (length !== 0) return length;
      return new Date(b.hit.createdAt).getTime() - new Date(a.hit.createdAt).getTime();
    })
    .map((row) => row.hit);
}
