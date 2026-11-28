import { jsonOk, handleApiError } from "@/lib/api";
import { loadRecommendations } from "@/lib/recommendations-load";
import { measurementAllowed } from "@/lib/recommendations";

const placements = new Set(["pdp", "cart", "home"]);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const placement = url.searchParams.get("placement") || "home";
    if (!placements.has(placement)) return jsonOk({ items: [] });
    const viewed = measurementAllowed(req.headers.get("cookie"))
      ? (url.searchParams.get("viewed") || "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8)
      : [];
    const cartParam = url.searchParams.get("cart");
    const cart = cartParam == null
      ? undefined
      : cartParam.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20);
    const items = await loadRecommendations({
      placement: placement as "pdp" | "cart" | "home",
      productId: url.searchParams.get("productId"),
      cartProductIds: cart,
      viewedProductIds: viewed,
      limit: 8,
    });
    return jsonOk({
      items: items.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        compareAt: item.product.compareAt,
        imageUrl: item.product.imageUrl,
        imageAlt: item.product.imageAlt,
        color: item.product.color,
        colorHex: item.product.colorHex,
        reason: item.reason,
        label: item.label,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
