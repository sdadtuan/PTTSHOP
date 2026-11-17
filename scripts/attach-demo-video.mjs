/**
 * Attach demo Kem hoodie video to ao-hoodie-essential (additive).
 * Usage: node scripts/attach-demo-video.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const VIDEO_URL = "/videos/demo-hoodie-kem.mp4";
const POSTER = "/images/ai-hoodies/kem-front.jpg";

async function main() {
  const product = await prisma.product.findUnique({
    where: { slug: "ao-hoodie-essential" },
    include: { images: true },
  });
  if (!product) {
    console.error("Product ao-hoodie-essential not found — run db:upsert-hoodies first");
    process.exit(1);
  }

  const existing = product.images.find(
    (i) => i.type === "video" && i.url === VIDEO_URL,
  );
  if (existing) {
    console.log("Demo video already attached", existing.id);
    return;
  }

  // Shift sort orders
  for (const img of product.images) {
    await prisma.productImage.update({
      where: { id: img.id },
      data: { sortOrder: img.sortOrder + 1 },
    });
  }

  const created = await prisma.productImage.create({
    data: {
      productId: product.id,
      url: VIDEO_URL,
      posterUrl: POSTER,
      type: "video",
      color: "Kem",
      alt: "Video demo hoodie Kem (slideshow front/back/fabric ~6s)",
      sortOrder: 0,
    },
  });
  console.log("Attached demo video", created.id, "→", product.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
