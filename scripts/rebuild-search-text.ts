import { PrismaClient } from "@prisma/client";
import { buildSearchText } from "../src/lib/search/text";

const dryRun = process.argv.includes("--dry-run");
const prisma = new PrismaClient();

async function main() {
  const name = new URL(process.env.DATABASE_URL || "postgres://local/missing").pathname.replace(/^\//, "");
  const products = await prisma.product.findMany({
    include: {
      category: { select: { name: true, slug: true } },
      variants: { select: { color: true, size: true } },
    },
  });
  let changed = 0;
  for (const product of products) {
    const searchText = buildSearchText({
      name: product.name,
      slug: product.slug,
      description: product.description,
      categoryName: product.category?.name,
      categorySlug: product.category?.slug,
      gender: product.gender,
      colors: product.variants.map((variant) => variant.color),
      sizes: product.variants.map((variant) => variant.size),
    });
    if (product.searchText === searchText) continue;
    changed += 1;
    if (!dryRun) {
      await prisma.product.update({ where: { id: product.id }, data: { searchText } });
    }
  }
  console.log(JSON.stringify({ database: name, dryRun, products: products.length, searchTextWrites: changed }));
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.name : "rebuild_failed");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
