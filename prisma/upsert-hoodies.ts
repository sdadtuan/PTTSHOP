/**
 * Additive upsert for men's/women's hoodies with per-colour gallery images.
 * Does NOT wipe existing DB data.
 * Uses AI photoreal assets under /public/images/ai-hoodies/* (front / back / fabric).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ColorPack = {
  name: string;
  hex: string;
  images: string[];
};

const ai = (file: string) => `/images/ai-hoodies/${file}`;

/** Per-colour gallery: front → back → fabric (fabric used in “Chi tiết sản phẩm”). */
function shots(key: "kem" | "den" | "nau" | "xam" | "hong"): string[] {
  return [ai(`${key}-front.jpg`), ai(`${key}-back.jpg`), ai(`${key}-fabric.jpg`)];
}

async function ensureCategory() {
  return prisma.category.upsert({
    where: { slug: "hoodie" },
    update: { image: ai("kem-front.jpg") },
    create: {
      name: "Hoodie",
      slug: "hoodie",
      image: ai("kem-front.jpg"),
      sortOrder: 5,
    },
  });
}

async function refreshCategoryImages() {
  const map: Record<string, string> = {
    "ao-thun": "/images/categories/ao-thun.jpg",
    quan: "/images/categories/quan.jpg",
    "phu-kien": "/images/categories/phu-kien.jpg",
    hoodie: ai("kem-front.jpg"),
  };
  for (const [slug, image] of Object.entries(map)) {
    await prisma.category.updateMany({ where: { slug }, data: { image } });
  }
}

async function upsertHoodie(input: {
  name: string;
  slug: string;
  gender: "MALE" | "FEMALE" | "UNISEX";
  description: string;
  categoryId: string;
  colors: ColorPack[];
  price: number;
  compareAt: number;
  /** Optional first-card image override so grids don’t repeat the same front. */
  cardImage?: string;
}) {
  const existing = await prisma.product.findUnique({
    where: { slug: input.slug },
    include: { images: true, variants: true },
  });

  const product =
    existing ??
    (await prisma.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        material: "Nỉ cotton",
        fit: "Oversize",
        thickness: "Dày vừa",
        stretch: true,
        origin: "Việt Nam",
        gender: input.gender,
        categoryId: input.categoryId,
        isFeatured: true,
        isNew: true,
        isBestSeller: true,
        rating: 4.8,
        reviewCount: 24,
      },
    }));

  if (existing) {
    await prisma.product.update({
      where: { id: product.id },
      data: {
        name: input.name,
        description: input.description,
        gender: input.gender,
        isFeatured: true,
        isNew: true,
        isBestSeller: true,
        rating: existing.rating || 4.8,
        reviewCount: existing.reviewCount || 24,
      },
    });
    await prisma.productImage.deleteMany({ where: { productId: product.id } });

    // Drop swatches without photos (colours no longer in pack).
    // Skip variants referenced by OrderItem (no onDelete cascade).
    const keep = new Set(input.colors.map((c) => c.name));
    const stale = existing.variants.filter((v) => !keep.has(v.color));
    if (stale.length) {
      const staleIds = stale.map((v) => v.id);
      const blocked = await prisma.orderItem.findMany({
        where: { variantId: { in: staleIds } },
        select: { variantId: true },
      });
      const blockedSet = new Set(blocked.map((b) => b.variantId));
      const deletable = staleIds.filter((id) => !blockedSet.has(id));
      if (deletable.length) {
        await prisma.productVariant.deleteMany({
          where: { id: { in: deletable } },
        });
      }
      const leftover = staleIds.filter((id) => blockedSet.has(id));
      if (leftover.length) {
        await prisma.productVariant.updateMany({
          where: { id: { in: leftover } },
          data: { stock: 0 },
        });
      }
    }
  }

  let sort = 0;
  // Optional distinct card hero so homepage/related grids vary.
  if (input.cardImage) {
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: input.cardImage,
        alt: `${input.name} - thẻ sản phẩm`,
        color: null,
        sortOrder: sort++,
      },
    });
  }

  for (const color of input.colors) {
    for (const url of color.images) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url,
          alt: `${input.name} - ${color.name}`,
          color: color.name,
          sortOrder: sort++,
        },
      });
    }
  }

  const sizes = ["S", "M", "L", "XL", "XXL"];
  for (const color of input.colors) {
    for (const size of sizes) {
      const sku = `${input.slug}-${color.name}-${size}`
        .toUpperCase()
        .replace(/\s+/g, "-")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      await prisma.productVariant.upsert({
        where: { sku },
        update: {
          price: input.price,
          compareAt: input.compareAt,
          colorHex: color.hex,
          stock: 30,
        },
        create: {
          sku,
          color: color.name,
          colorHex: color.hex,
          size,
          price: input.price,
          compareAt: input.compareAt,
          stock: 30,
          productId: product.id,
        },
      });
    }
  }

  console.log(`Upserted hoodie: ${input.slug}`);
}

/** Point other catalog cards at varied AI hoodie / local assets. */
async function refreshCatalogCardImages() {
  const products = await prisma.product.findMany({
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  // Non-hoodie cards use lifestyle/local assets (not AI hoodie fronts)
  // so homepage featured/listing don’t repeat the same model photos.
  const pool = [
    "/images/home/hero-1.jpg",
    "/images/home/hero-2.jpg",
    "/images/home/hero-3.jpg",
    "/images/home/hero-4.jpg",
    "/images/home/look-2.jpg",
    "/images/home/look-3.jpg",
    "/images/home/look-4.jpg",
    "/images/home/look-5.jpg",
    "/images/categories/ao-thun.jpg",
    "/images/categories/quan.jpg",
    "/images/categories/phu-kien.jpg",
    "/images/home/pants-hero.jpg",
  ];

  let i = 0;
  for (const p of products) {
    if (p.slug.startsWith("ao-hoodie")) continue;
    const primary = p.images[0];
    const nextUrl = pool[i % pool.length];
    i++;
    if (primary) {
      if (
        primary.url.startsWith("https://images.unsplash.com") ||
        primary.url.includes("/images/hoodies/") ||
        primary.url.includes("/images/ai-hoodies/")
      ) {
        await prisma.productImage.update({
          where: { id: primary.id },
          data: { url: nextUrl },
        });
      }
    } else {
      await prisma.productImage.create({
        data: {
          productId: p.id,
          url: nextUrl,
          alt: p.name,
          sortOrder: 0,
        },
      });
    }
  }
  console.log("Refreshed catalog card images (unsplash/studio/AI-misfile → lifestyle).");
}

async function main() {
  await refreshCategoryImages();
  const hoodie = await ensureCategory();

  await upsertHoodie({
    name: "Áo Hoodie Essential Form Rộng",
    slug: "ao-hoodie-essential",
    gender: "MALE",
    description:
      "Áo Hoodie Essential form rộng cho nam — chất nỉ mềm, dày dặn, in ESSENTIALS. Gallery ảnh thật theo màu Kem / Đen / Nâu (front / back / fabric).",
    categoryId: hoodie.id,
    price: 599000,
    compareAt: 899000,
    cardImage: ai("kem-front.jpg"),
    colors: [
      { name: "Kem", hex: "#E8DCC8", images: shots("kem") },
      { name: "Đen", hex: "#1C1C1C", images: shots("den") },
      { name: "Nâu", hex: "#6B4423", images: shots("nau") },
    ],
  });

  await upsertHoodie({
    name: "Áo Hoodie Nữ Form Rộng VIZFAS Essential",
    slug: "ao-hoodie-nu-essential",
    gender: "FEMALE",
    description:
      "Áo Hoodie nữ form rộng VIZFAS Essential — in VIZFAS, mềm mại, dễ layer. Gallery ảnh thật Xám / Hồng / Đen (front / back / fabric).",
    categoryId: hoodie.id,
    price: 579000,
    compareAt: 849000,
    cardImage: ai("xam-front.jpg"),
    colors: [
      { name: "Xám", hex: "#C4C4C4", images: shots("xam") },
      { name: "Hồng", hex: "#E8A0BF", images: shots("hong") },
      { name: "Đen", hex: "#1C1C1C", images: shots("den") },
    ],
  });

  await upsertHoodie({
    name: "Áo Hoodie Zip Essential",
    slug: "ao-hoodie-zip-essential",
    gender: "UNISEX",
    description: "Hoodie khóa kéo Essential — dễ layer, form rộng unisex.",
    categoryId: hoodie.id,
    price: 629000,
    compareAt: 929000,
    cardImage: ai("den-back.jpg"),
    colors: [
      { name: "Đen", hex: "#1C1C1C", images: shots("den") },
      { name: "Xám", hex: "#C4C4C4", images: shots("xam") },
      { name: "Kem", hex: "#E8DCC8", images: shots("kem") },
    ],
  });

  await upsertHoodie({
    name: "Áo Hoodie Soft Pink Daily",
    slug: "ao-hoodie-soft-pink",
    gender: "FEMALE",
    description: "Hoodie hồng mềm Daily — điểm nhấn màu pastel dễ phối.",
    categoryId: hoodie.id,
    price: 549000,
    compareAt: 799000,
    cardImage: ai("hong-front.jpg"),
    colors: [
      { name: "Hồng", hex: "#E8A0BF", images: shots("hong") },
      { name: "Kem", hex: "#E8DCC8", images: shots("kem") },
      { name: "Nâu", hex: "#6B4423", images: shots("nau") },
    ],
  });

  await upsertHoodie({
    name: "Áo Hoodie Brown Layer Club",
    slug: "ao-hoodie-brown-layer",
    gender: "MALE",
    description: "Hoodie nâu Layer Club — tone đất dễ mix với cargo và sneaker.",
    categoryId: hoodie.id,
    price: 589000,
    compareAt: 859000,
    cardImage: ai("nau-front.jpg"),
    colors: [
      { name: "Nâu", hex: "#6B4423", images: shots("nau") },
      { name: "Đen", hex: "#1C1C1C", images: shots("den") },
      { name: "Kem", hex: "#E8DCC8", images: shots("kem") },
    ],
  });

  await refreshCatalogCardImages();
  console.log("Done. AI photoreal hoodie galleries applied.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
