import { prisma } from "@/lib/prisma";
import { clipQuery } from "@/lib/search/parse";
import { foldVi } from "@/lib/search/fold";

export const SEARCH_EVENT_KEEP_DAYS = 90;
const SUGGEST_DEDUPE_MS = 2000;

export type SearchEventKind = "suggest" | "results" | "click";

/**
 * Không lưu IP, user agent hay thông tin cá nhân.
 * Dọn tay, chưa có cron:
 * DELETE FROM "SearchEvent" WHERE "createdAt" < now() - interval '90 days';
 */
export async function recordSearchEvent(input: {
  kind: SearchEventKind;
  query: string;
  parsed?: unknown;
  resultCount?: number;
  targetSlug?: string | null;
  sessionKey?: string | null;
}) {
  const query = clipQuery(input.query);
  if (!query) return;
  const sessionKey = input.sessionKey?.slice(0, 64) || null;
  try {
    if (input.kind === "suggest" && sessionKey) {
      const since = new Date(Date.now() - SUGGEST_DEDUPE_MS);
      const recent = await prisma.searchEvent.findFirst({
        where: { kind: "suggest", sessionKey, query, createdAt: { gte: since } },
        select: { id: true },
      });
      if (recent) return;
    }
    await prisma.searchEvent.create({
      data: {
        kind: input.kind,
        query,
        normalized: foldVi(query).slice(0, SEARCH_QUERY_STORED),
        parsedJson: input.parsed ? JSON.stringify(input.parsed).slice(0, 1000) : null,
        resultCount: input.resultCount ?? 0,
        targetSlug: input.targetSlug?.slice(0, 200) || null,
        sessionKey,
      },
    });
  } catch (err) {
    console.error("search_event_failed", err instanceof Error ? err.name : "error");
  }
}

const SEARCH_QUERY_STORED = 100;

export function searchSessionKey(req: Request) {
  const header = req.headers.get("cookie") || "";
  const match = /(?:^|;\s*)ptt_search=([A-Za-z0-9]{16,64})/.exec(header);
  return match?.[1] ?? null;
}

export function shouldSkipDuplicateSuggest(lastAt: number | null, now: number) {
  return lastAt != null && now - lastAt < SUGGEST_DEDUPE_MS;
}
