import { variantIsForSale } from "@/lib/catalog-visibility";
import { sellableTotals } from "@/lib/dropship/service";
import { bundleWindowOpen } from "@/lib/bundles";
import { prisma } from "@/lib/prisma";

export async function bundleSettings() {
  try {
    const row = await prisma.bundleSettings.findUnique({ where: { id: "default" } });
    return {
      outOfStockMode: row?.outOfStockMode === "RETAIL" ? "RETAIL" as const : "HIDE" as const,
      stackCoupon: row?.stackCoupon === true,
    };
  } catch {
    return { outOfStockMode: "HIDE" as const, stackCoupon: false };
  }
}

export async function bundlesForProduct(productId: string) {
  const settings = await bundleSettings();
  const now = new Date();
  let rows: Awaited<ReturnType<typeof loadRows>> = [];
  try {
    rows = await loadRows(productId);
  } catch {
    return [];
  }
  const variantIds = rows.flatMap((row) => row.items.flatMap((item) => item.product.variants.map((variant) => variant.id)));
  const stock = await sellableTotals(prisma, variantIds);
  return rows.flatMap((row) => {
    if (!bundleWindowOpen(row.startsAt, row.endsAt, now)) return [];
    const components = row.items.map((item) => {
      const product = item.product;
      const sellable = variantIsForSale(product) && !product.isDemo;
      const variants = sellable
        ? product.variants
            .map((variant) => ({
              id: variant.id,
              color: variant.color,
              size: variant.size,
              price: variant.price,
              stock: stock.get(variant.id) ?? 0,
            }))
            .filter((variant) => variant.stock > 0 && variant.price > 0)
        : [];
      return {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        variants,
      };
    });
    if (row.items.some((item) => item.product.isDemo || !variantIsForSale(item.product))) return [];
    const missing = components.filter((item) => item.variants.length === 0);
    if (missing.length > 0 && settings.outOfStockMode === "HIDE") return [];
    const visible = components.filter((item) => item.variants.length > 0);
    if (visible.length === 0) return [];
    const retail = missing.length > 0;
    return [{
      id: row.id,
      title: row.title,
      priceMode: row.priceMode,
      priceVnd: row.priceVnd,
      percentOff: row.percentOff,
      offer: retail ? "retail" as const : "bundle" as const,
      note: retail ? "Một món hết hàng. Phần còn lại bán đúng giá lẻ." : null,
      items: visible,
    }];
  });
}

function loadRows(productId: string) {
  return prisma.bundle.findMany({
    where: { isPublished: true, items: { some: { productId } } },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          product: {
            include: {
              variants: { where: { isPurchasable: true } },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });
}
