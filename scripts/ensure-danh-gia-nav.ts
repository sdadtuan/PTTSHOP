/**
 * One-shot: add «Đánh Giá» → /danh-gia to Version A primary nav (published + draft).
 * Idempotent via CmsPatch — safe to run multiple times; won't re-add after admin removes link.
 */
import { ensureDanhGiaNavPatch } from "../src/lib/cms/nav-patches";
import { prisma } from "../src/lib/prisma";

async function main() {
  const changed = await ensureDanhGiaNavPatch(prisma);
  console.log(changed ? "Đã thêm mục Đánh Giá vào menu." : "Không thay đổi (đã patch hoặc đã có link).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());