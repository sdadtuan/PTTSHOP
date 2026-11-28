export type MeasurementIds = {
  ga4: string | null;
  meta: string | null;
  tiktok: string | null;
  clarity: string | null;
};

const EMPTY: MeasurementIds = { ga4: null, meta: null, tiktok: null, clarity: null };

function cleanId(value: string | null | undefined) {
  const text = (value ?? "").trim();
  if (!/^[A-Za-z0-9_-]{4,40}$/.test(text)) return null;
  return text;
}

export function configuredMeasurementIds(source: Partial<MeasurementIds> | null | undefined): MeasurementIds {
  if (!source) return { ...EMPTY };
  return {
    ga4: cleanId(source.ga4),
    meta: cleanId(source.meta),
    tiktok: cleanId(source.tiktok),
    clarity: cleanId(source.clarity),
  };
}

export function hasMeasurementId(ids: MeasurementIds) {
  return Boolean(ids.ga4 || ids.meta || ids.tiktok || ids.clarity);
}

/** Chỉ trả URL khi khách chọn tất cả và kênh có ID. */
export function scriptsForConsent(choice: string | null | undefined, ids: MeasurementIds) {
  if (choice !== "all" || !hasMeasurementId(ids)) return [];
  const urls: string[] = [];
  if (ids.ga4) urls.push(`https://www.googletagmanager.com/gtag/js?id=${ids.ga4}`);
  if (ids.meta) urls.push("https://connect.facebook.net/en_US/fbevents.js");
  if (ids.tiktok) urls.push(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${ids.tiktok}`);
  if (ids.clarity) urls.push(`https://www.clarity.ms/tag/${ids.clarity}`);
  return urls;
}

const BLOCKED_KEYS = new Set([
  "phone",
  "email",
  "address",
  "customerphone",
  "customeremail",
  "customeraddress",
]);

export function publicEventParams(params: Record<string, unknown>) {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (BLOCKED_KEYS.has(key.toLowerCase())) continue;
    if (typeof value === "string" || typeof value === "number") out[key] = value;
  }
  return out;
}

export function searchEventTerm(query: string) {
  const text = query.trim().slice(0, 100);
  if (!text || text.includes("@") || /(?:\+84|0)\d{9}/.test(text.replace(/[\s.-]/g, ""))) return null;
  return text;
}
