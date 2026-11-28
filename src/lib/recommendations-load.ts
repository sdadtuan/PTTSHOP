import { cookies } from "next/headers";
import { publicCatalogWhere, variantIsForSale } from "@/lib/catalog-visibility";
import { sellableTotals } from "@/lib/dropship/service";
import { prisma } from "@/lib/prisma";
import { getOptionalSession } from "@/lib/auth-guards";
import { getCartSessionId } from "@/lib/cart-session";
import { getCartForActor } from "@/lib/cart-service";
import {
  measurementAllowed,
  rankRecommendations,
  recommendationAnchors,
  type RecCandidate,
} from "@/lib/recommendations";

export async function loadRecommendations(input: {
  placement: "pdp" | "cart" | "home";
  productId?: string | null;
  cartProductIds?: string[];
  viewedProductIds?: string[];
  limit?: number;
}) {
  try {
    const jar = await cookies();
    const allowed = measurementAllowed(jar.get("pttshop_cookie")?.value ? `pttshop_cookie=${jar.get("pttshop_cookie")?.value}` : null);
    const cartIds = input.cartProductIds ?? (await cartProductIds());
    const anchors = recommendationAnchors({
      placement: input.placement,
      productId: input.productId,
      cartProductIds: cartIds,
      viewedProductIds: input.viewedProductIds ?? [],
      measurementAllowed: allowed,
    });
    const excludeIds = [...new Set([...anchors, ...cartIds, input.productId || ""].filter(Boolean))];
    const [products, settings, relations] = await Promise.all([
      prisma.product.findMany({
        where: publicCatalogWhere,
        orderBy: { createdAt: "desc" },
        take: 80,
        select: {
          id: true,
          name: true,
          slug: true,
          isDemo: true,
          saleStatus: true,
          createdAt: true,
          images: { where: { isHidden: false }, orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
          variants: { select: { id: true, price: true, compareAt: true, color: true, colorHex: true, stock: true } },
        },
      }),
      prisma.recommendationSettings.findUnique({ where: { id: "default" } }).catch(() => null),
      anchors.length
        ? prisma.productRelation.findMany({ where: { productId: { in: anchors } }, orderBy: { position: "asc" } })
        : Promise.resolve([]),
    ]);
    const variantIds = products.flatMap((product) => product.variants.map((variant) => variant.id));
    const stock = await sellableTotals(prisma, variantIds);
    const ids = products.map((product) => product.id);
    const sold = ids.length
      ? await prisma.orderItem.findMany({
          where: { order: { status: { not: "CANCELLED" } }, variant: { productId: { in: ids } } },
          select: { orderId: true, variant: { select: { productId: true } } },
          take: 2000,
        })
      : [];
    const ordersByProduct = new Map<string, Set<string>>();
    for (const row of sold) {
      const productId = row.variant.productId;
      const bucket = ordersByProduct.get(productId) ?? new Set<string>();
      bucket.add(row.orderId);
      ordersByProduct.set(productId, bucket);
    }
    const coPurchase = coPurchaseCounts(sold, anchors);
    const candidates: RecCandidate[] = products.map((product) => {
      const priced = product.variants.filter((variant) => variant.price > 0);
      const cover = product.images[0];
      const swatch = product.variants.find((variant) => variant.color || variant.colorHex);
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        forSale: variantIsForSale(product),
        isDemo: product.isDemo,
        stock: product.variants.reduce((sum, variant) => sum + (stock.get(variant.id) ?? 0), 0),
        createdAt: product.createdAt.getTime(),
        orderCount: ordersByProduct.get(product.id)?.size ?? 0,
        price: priced.length ? Math.min(...priced.map((variant) => variant.price)) : null,
        compareAt: priced.find((variant) => variant.compareAt && variant.compareAt > variant.price)?.compareAt ?? null,
        imageUrl: cover?.url ?? null,
        imageAlt: cover?.alt ?? null,
        color: swatch?.color ?? null,
        colorHex: swatch?.colorHex ?? null,
      };
    });
    return rankRecommendations({
      candidates,
      anchors,
      excludeIds,
      relations: relations.map((row) => ({ productId: row.productId, relatedId: row.relatedId, position: row.position })),
      coPurchase,
      bestsellerMinOrders: settings?.bestsellerMinOrders ?? null,
      limit: input.limit ?? 4,
    });
  } catch {
    return [];
  }
}

function coPurchaseCounts(
  rows: { orderId: string; variant: { productId: string } }[],
  anchors: string[],
) {
  const byOrder = new Map<string, Set<string>>();
  for (const row of rows) {
    const bucket = byOrder.get(row.orderId) ?? new Set<string>();
    bucket.add(row.variant.productId);
    byOrder.set(row.orderId, bucket);
  }
  const counts = new Map<string, number>();
  for (const products of byOrder.values()) {
    for (const anchor of anchors) {
      if (!products.has(anchor)) continue;
      for (const related of products) {
        if (related === anchor) continue;
        const key = `${anchor}\t${related}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()].map(([key, orders]) => {
    const [anchorId, relatedId] = key.split("\t");
    return { anchorId, relatedId, orders };
  });
}

async function cartProductIds() {
  const session = await getOptionalSession();
  const sessionId = await getCartSessionId();
  const cart = await getCartForActor({ userId: session?.user?.id, sessionId });
  return [...new Set(cart?.items.map((item) => item.variant.productId) ?? [])];
}
