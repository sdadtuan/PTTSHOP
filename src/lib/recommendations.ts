export type RecReason = "manual" | "copurchase" | "newest";

export type RecCandidate = {
  id: string;
  name: string;
  slug: string;
  forSale: boolean;
  isDemo: boolean;
  stock: number;
  createdAt: number;
  orderCount: number;
  price: number | null;
  compareAt: number | null;
  imageUrl: string | null;
  imageAlt: string | null;
  color: string | null;
  colorHex: string | null;
};

export type RankedRecommendation = {
  product: RecCandidate;
  reason: RecReason;
  label: string | null;
};

export function measurementAllowed(cookieHeader: string | null | undefined) {
  if (!cookieHeader) return false;
  return cookieHeader.split(";").some((part) => part.trim() === "pttshop_cookie=all");
}

export function recommendationAnchors(input: {
  placement: "pdp" | "cart" | "home";
  productId?: string | null;
  cartProductIds: string[];
  viewedProductIds: string[];
  measurementAllowed: boolean;
}) {
  const viewed = input.measurementAllowed ? input.viewedProductIds.filter(Boolean) : [];
  if (input.placement === "pdp") return unique([input.productId, ...viewed]);
  if (input.placement === "cart") return unique([...input.cartProductIds, ...viewed]);
  return unique(viewed);
}

export function rankRecommendations(input: {
  candidates: RecCandidate[];
  anchors: string[];
  excludeIds: string[];
  relations: { productId: string; relatedId: string; position: number }[];
  coPurchase: { anchorId: string; relatedId: string; orders: number }[];
  bestsellerMinOrders: number | null;
  limit: number;
}): RankedRecommendation[] {
  const exclude = new Set(input.excludeIds.filter(Boolean));
  const eligible = input.candidates.filter(
    (item) => item.forSale && !item.isDemo && item.stock > 0 && !exclude.has(item.id),
  );
  const byId = new Map(eligible.map((item) => [item.id, item]));
  const picked: { product: RecCandidate; reason: RecReason }[] = [];
  const seen = new Set<string>();
  const take = (id: string, reason: RecReason) => {
    if (seen.has(id)) return;
    const product = byId.get(id);
    if (!product) return;
    seen.add(id);
    picked.push({ product, reason });
  };
  const anchorSet = new Set(input.anchors);
  const manuals = input.relations
    .filter((row) => anchorSet.has(row.productId) && row.relatedId !== row.productId)
    .sort((a, b) => a.position - b.position || a.relatedId.localeCompare(b.relatedId));
  for (const row of manuals) take(row.relatedId, "manual");
  const together = input.coPurchase
    .filter((row) => anchorSet.has(row.anchorId) && row.orders > 0)
    .sort((a, b) => b.orders - a.orders || a.relatedId.localeCompare(b.relatedId));
  for (const row of together) take(row.relatedId, "copurchase");
  const newest = [...eligible].sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
  for (const product of newest) take(product.id, "newest");
  const threshold =
    typeof input.bestsellerMinOrders === "number" && input.bestsellerMinOrders > 0
      ? input.bestsellerMinOrders
      : null;
  return picked.slice(0, Math.max(0, input.limit)).map((row) => ({
    ...row,
    label: threshold != null && row.product.orderCount >= threshold ? "Bán chạy" : null,
  }));
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
