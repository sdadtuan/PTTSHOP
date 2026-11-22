import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { applyDemoRemoval, inspectDemoCatalog } from "../src/lib/demo-catalog-removal";

const apply = process.argv.includes("--apply");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Thiếu DATABASE_URL. Dừng.");
    process.exit(1);
  }
  const prisma = new PrismaClient();
  const rows = await inspectDemoCatalog(prisma);
  for (const row of rows) {
    console.log(
      `${row.plan.action.toUpperCase()}\t${row.slug}\t${row.skus.join(",")}\tđơn=${row.orderIds.length}${row.plan.reason ? `\t${row.plan.reason}` : ""}`,
    );
  }
  const blocked = rows.filter((row) => row.plan.action === "blocked").length;
  const deleting = rows.filter((row) => row.plan.action === "delete").length;
  console.log(`Tìm thấy ${rows.length} sản phẩm. Sẽ gỡ ${deleting}. Bị chặn ${blocked}.`);
  if (!apply) {
    console.log("Dry-run. Chưa xóa. Thêm --apply để gỡ các dòng DELETE.");
    await prisma.$disconnect();
    return;
  }
  const result = await applyDemoRemoval(prisma, rows);
  if (result.blocked) {
    console.error("Có dòng bị chặn. Không xóa gì.");
    await prisma.$disconnect();
    process.exit(2);
  }
  console.log(`Đã gỡ ${result.deleted} sản phẩm DEMO.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
