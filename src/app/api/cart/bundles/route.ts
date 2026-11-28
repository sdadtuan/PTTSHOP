import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { getOptionalSession } from "@/lib/auth-guards";
import { priceBundle } from "@/lib/bundles";
import { bundleSettings } from "@/lib/bundles-public";
import { getOrCreateCart, serializeCartForClient } from "@/lib/cart-service";
import { getCartSessionId, getOrCreateCartSessionId } from "@/lib/cart-session";
import { NOT_FOR_SALE_MESSAGE, variantIsForSale } from "@/lib/catalog-visibility";
import { sellableTotals } from "@/lib/dropship/service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  bundleId: z.string().trim().min(1).max(80),
  selections: z.array(z.object({
    productId: z.string().trim().min(1).max(80),
    variantId: z.string().trim().min(1).max(80),
  })).min(2).max(8),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const session = await getOptionalSession();
    const userId = session?.user?.id ?? null;
    const sessionId = userId ? await getCartSessionId() : await getOrCreateCartSessionId();
    const bundle = await prisma.bundle.findUnique({
      where: { id: body.bundleId },
      include: { items: true },
    });
    if (!bundle || !bundle.isPublished) return jsonError("Combo chưa mở bán.");
    const now = new Date();
    if ((bundle.startsAt && now < bundle.startsAt) || (bundle.endsAt && now > bundle.endsAt)) {
      return jsonError("Combo chưa mở bán.");
    }
    const expected = bundle.items.map((item) => item.productId).sort();
    const got = body.selections.map((item) => item.productId).sort();
    if (expected.join("|") !== got.join("|")) return jsonError("Combo thiếu món hoặc có món thừa.");
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: body.selections.map((item) => item.variantId) } },
      include: { product: true },
    });
    if (variants.length !== body.selections.length) return jsonError("Một số size không còn.");
    if (variants.some((variant) => !variantIsForSale(variant.product) || variant.product.isDemo)) {
      return jsonError(NOT_FOR_SALE_MESSAGE);
    }
    for (const selection of body.selections) {
      const variant = variants.find((row) => row.id === selection.variantId);
      if (!variant || variant.productId !== selection.productId) return jsonError("Size không thuộc món trong combo.");
    }
    const settings = await bundleSettings();
    const stock = await sellableTotals(prisma, variants.map((variant) => variant.id));
    if (variants.some((variant) => (stock.get(variant.id) ?? 0) < 1)) {
      if (settings.outOfStockMode === "HIDE") return jsonError("Combo đang ẩn vì một món hết hàng.");
      return jsonError("Một món hết hàng. Hãy thêm phần còn lại theo giá lẻ.");
    }
    const retailSum = variants.reduce((sum, variant) => sum + variant.price, 0);
    const priced = priceBundle({
      priceMode: bundle.priceMode,
      priceVnd: bundle.priceVnd,
      percentOff: bundle.percentOff,
      retailSum,
    });
    if (!priced.ok) return jsonError(priced.error);
    const cart = await getOrCreateCart({ userId, sessionId: userId ? null : sessionId });
    for (const variant of variants) {
      const existing = cart.items.find((item) => item.variantId === variant.id);
      if (existing && existing.bundleId !== bundle.id) {
        return jsonError("Món này đã có trong giỏ. Hãy bỏ ra trước khi thêm combo.");
      }
      const nextQty = (existing?.quantity ?? 0) + 1;
      if (nextQty > (stock.get(variant.id) ?? 0)) return jsonError(`Chỉ còn ${stock.get(variant.id) ?? 0} sản phẩm`);
    }
    await prisma.$transaction(async (tx) => {
      for (const variant of variants) {
        const existing = cart.items.find((item) => item.variantId === variant.id);
        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + 1, bundleId: bundle.id },
          });
        } else {
          await tx.cartItem.create({
            data: { cartId: cart.id, variantId: variant.id, quantity: 1, bundleId: bundle.id },
          });
        }
      }
    });
    const next = await getOrCreateCart({ userId, sessionId: userId ? null : sessionId });
    return jsonOk({ ...(await serializeCartForClient(next)), bundlePrice: priced.price, bundleDiscount: priced.discount });
  } catch (err) {
    return handleApiError(err);
  }
}
