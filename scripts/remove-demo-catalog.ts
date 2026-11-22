import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { planDemoRemoval } from "../src/lib/demo-catalog-removal";

const apply = process.argv.includes("--apply");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Thiếu DATABASE_URL. Dừng.");
    process.exit(1);
  }
  const prisma = new PrismaClient();
  const products = await prisma.product.findMany({
    where: {
      OR: [{ slug: { startsWith: "demo-" } }, { variants: { some: { sku: { startsWith: "DEMO-" } } } }],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      variants: { select: { id: true, sku: true } },
    },
    orderBy: { slug: "asc" },
  });

  const plans = [];
  for (const product of products) {
    const items = await prisma.orderItem.findMany({
      where: { variantId: { in: product.variants.map((v) => v.id) } },
      select: { orderId: true, order: { select: { note: true, items: { select: { variant: { select: { sku: true, product: { select: { slug: true } } } } } } } } },
    });
    const orderIds = [...new Set(items.map((item) => item.orderId))];
    const notes = orderIds.map((id) => items.find((item) => item.orderId === id)?.order.note || "");
    const orderHasForeignItem = items.some((item) =>
      item.order.items.some(
        (line) =>
          !line.variant.sku.startsWith("DEMO-") || !line.variant.product.slug.startsWith("demo-"),
      ),
    );
    const plan = planDemoRemoval({
      slug: product.slug,
      skus: product.variants.map((v) => v.sku),
      orderNotes: notes,
      orderIds,
      orderHasForeignItem,
    });
    plans.push({ product, plan, orderIds });
    console.log(
      `${plan.action.toUpperCase()}\t${product.slug}\t${product.variants.map((v) => v.sku).join(",")}\tđơn=${orderIds.length}${plan.reason ? `\t${plan.reason}` : ""}`,
    );
  }

  const blocked = plans.filter((row) => row.plan.action === "blocked");
  const deleting = plans.filter((row) => row.plan.action === "delete");
  console.log(`Tìm thấy ${products.length} sản phẩm. Sẽ gỡ ${deleting.length}. Bị chặn ${blocked.length}.`);
  if (!apply) {
    console.log("Dry-run. Chưa xóa. Thêm --apply để gỡ các dòng DELETE.");
    await prisma.$disconnect();
    return;
  }
  if (blocked.length) {
    console.error("Có dòng bị chặn. Không xóa gì.");
    await prisma.$disconnect();
    process.exit(2);
  }
  for (const row of deleting) {
    if (row.orderIds.length) {
      await prisma.order.deleteMany({ where: { id: { in: row.orderIds } } });
    }
    await prisma.product.delete({ where: { id: row.product.id } });
  }
  const emptyDemoCategories = await prisma.category.findMany({
    where: { slug: { startsWith: "demo-" }, products: { none: {} } },
    select: { id: true, slug: true },
  });
  if (emptyDemoCategories.length) {
    await prisma.category.deleteMany({ where: { id: { in: emptyDemoCategories.map((c) => c.id) } } });
    console.log(`Đã xóa danh mục rỗng: ${emptyDemoCategories.map((c) => c.slug).join(", ")}`);
  }
  console.log(`Đã gỡ ${deleting.length} sản phẩm DEMO.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
