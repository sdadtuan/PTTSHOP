export type ExperimentDef = {
  key: string;
  enabled: boolean;
  variants: string[];
  trafficPercent: number;
};

export const SAMPLE_EXPERIMENTS: ExperimentDef[] = [
  { key: "buy_now_copy", enabled: false, variants: ["control", "mua_ngay_hom_nay"], trafficPercent: 50 },
  { key: "sticky_bar", enabled: false, variants: ["control", "off"], trafficPercent: 50 },
];

export function experimentBucket(visitorId: string, key: string) {
  let hash = 0;
  const text = `${key}:${visitorId}`;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash % 100;
}

/** Tắt experiment thì mọi khách về control. Cookie chỉ giữ biến thể khi đang bật. */
export function variantFor(def: ExperimentDef | undefined, visitorId: string) {
  if (!def?.enabled) return "control";
  const treatment = def.variants.find((item) => item !== "control") ?? "control";
  const percent = Math.min(100, Math.max(0, def.trafficPercent));
  return experimentBucket(visitorId, def.key) < percent ? treatment : "control";
}

export function buyNowLabel(variant: string) {
  return variant === "mua_ngay_hom_nay" ? "Mua ngay hôm nay" : "Mua ngay";
}

export function stickyVisible(variant: string, scrolled: boolean) {
  if (variant === "off") return false;
  return scrolled;
}
