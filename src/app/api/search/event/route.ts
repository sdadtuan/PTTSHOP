import { allowSearch, readQuery, searchJson } from "@/lib/search/http";
import { recordSearchEvent, searchSessionKey } from "@/lib/search/events";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  const sessionKey = searchSessionKey(req) || randomBytes(16).toString("hex");
  const cookie = searchSessionKey(req) ? undefined : sessionKey;
  if (!allowSearch(req, "search-click", 60)) return searchJson({ ok: true }, cookie);
  try {
    const body = (await req.json()) as { query?: string; targetSlug?: string };
    const query = readQuery(body.query || "");
    const targetSlug = (body.targetSlug || "").trim().slice(0, 200);
    if (query && targetSlug) {
      await recordSearchEvent({ kind: "click", query, targetSlug, sessionKey });
    }
    return searchJson({ ok: true }, cookie);
  } catch {
    return searchJson({ ok: true }, cookie);
  }
}
