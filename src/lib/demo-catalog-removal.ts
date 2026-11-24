import type { PrismaClient } from "@prisma/client";

export type DemoRemovalRow = {
  slug: string;
  skus: string[];
  orderNotes: string[];
  orderIds: string[];
  orderHasForeignItem: boolean;
};

export type DemoRemovalPlan = {
  action: "delete" | "blocked" | "skip";
  reason?: string;
};

export function planDemoRemoval(row: DemoRemovalRow): DemoRemovalPlan {
  const slugDemo = row.slug.startsWith("demo-");
  const anyDemoSku = row.skus.some((sku) => sku.startsWith("DEMO-"));
  const allDemoSku = row.skus.length > 0 && row.skus.every((sku) => sku.startsWith("DEMO-"));
  if (!slugDemo && !anyDemoSku) return { action: "skip" };
  if (!slugDemo || !allDemoSku) {
    return {
      action: "blocked",
      reason: "Chỉ gỡ khi slug bắt đầu bằng demo- và mọi SKU bắt đầu bằng DEMO-",
    };
  }
  if (row.orderHasForeignItem) {
    return { action: "blocked", reason: "Có đơn TEST lẫn sản phẩm không thuộc bộ DEMO" };
  }
  const foreign = row.orderNotes.find((note) => !note.startsWith("TEST"));
  if (foreign !== undefined) {
    return { action: "blocked", reason: "Có đơn không ghi chú bắt đầu bằng TEST" };
  }
  return { action: "delete" };
}

export async function inspectDemoCatalog(prisma: PrismaClient) {
  const products = await prisma.product.findMany({
    where: {
      OR: [{ slug: { startsWith: "demo-", mode: "insensitive" } }, { variants: { some: { sku: { startsWith: "DEMO-", mode: "insensitive" } } } }],
    },
    select: { id: true, slug: true, variants: { select: { id: true, sku: true } } },
    orderBy: { slug: "asc" },
  });
  const rows = [];
  for (const product of products) {
    const items = product.variants.length
      ? await prisma.orderItem.findMany({
          where: { variantId: { in: product.variants.map((variant) => variant.id) } },
          select: {
            orderId: true,
            order: {
              select: {
                note: true,
                items: { select: { variant: { select: { sku: true, product: { select: { slug: true } } } } } },
              },
            },
          },
        })
      : [];
    const orderIds = [...new Set(items.map((item) => item.orderId))];
    const plan = planDemoRemoval({
      slug: product.slug,
      skus: product.variants.map((variant) => variant.sku),
      orderNotes: orderIds.map((id) => items.find((item) => item.orderId === id)?.order.note || ""),
      orderIds,
      orderHasForeignItem: items.some((item) =>
        item.order.items.some(
          (line) => !line.variant.sku.startsWith("DEMO-") || !line.variant.product.slug.startsWith("demo-"),
        ),
      ),
    });
    rows.push({ productId: product.id, slug: product.slug, skus: product.variants.map((variant) => variant.sku), plan, orderIds });
  }
  return rows;
}

export async function applyDemoRemoval(
  prisma: PrismaClient,
  rows: Awaited<ReturnType<typeof inspectDemoCatalog>>,
) {
  const blocked = rows.filter((row) => row.plan.action === "blocked");
  if (blocked.length) return { deleted: 0, blocked: blocked.length };
  const deleting = rows.filter((row) => row.plan.action === "delete");
  for (const row of deleting) {
    if (row.orderIds.length) await prisma.order.deleteMany({ where: { id: { in: row.orderIds } } });
    await prisma.product.delete({ where: { id: row.productId } });
  }
  await prisma.category.deleteMany({ where: { slug: { startsWith: "demo-", mode: "insensitive" }, products: { none: {} } } });
  return { deleted: deleting.length, blocked: 0 };
}

