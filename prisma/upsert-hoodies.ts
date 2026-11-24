/**
 * Additive upsert for men's/women's hoodies with per-colour gallery images.
 * Does NOT wipe existing DB data.
 * Uses AI photoreal assets under /public/images/ai-hoodies/* (front / back / fabric).
 * Image sync is idempotent by (url, color): update/create desired rows, drop only
 * exact url+color duplicates and stale ai-hoodies script rows — never videos/admin media.
 */
import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV === "production") {
  console.error("Từ chối seed khi NODE_ENV=production.");
  process.exit(1);
}

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

function imageKey(url: string, color: string | null | undefined) {
  return `${url}::${color ?? ""}`;
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

const homeAi = (file: string) => `/images/ai-home/${file}`;

async function refreshCategoryImages() {
  const map: Record<string, string> = {
    "ao-thun": homeAi("cat-ao-thun.jpg"),
    quan: homeAi("cat-quan.jpg"),
    "phu-kien": homeAi("cat-phu-kien.jpg"),
    hoodie: ai("kem-front.jpg"),
  };
  for (const [slug, image] of Object.entries(map)) {
    await prisma.category.updateMany({ where: { slug }, data: { image } });
  }
}

async function syncHoodieImages(
  productId: string,
  productName: string,
  colors: ColorPack[],
  cardImage?: string,
) {
  type DesiredImage = {
    url: string;
    alt: string;
    color: string | null;
    sortOrder: number;
  };

  const desired: DesiredImage[] = [];
  let sort = 0;
  if (cardImage) {
    desired.push({
      url: cardImage,
      alt: `${productName} - thẻ sản phẩm`,
      color: null,
      sortOrder: sort++,
    });
  }
  for (const color of colors) {
    for (const url of color.images) {
      desired.push({
        url,
        alt: `${productName} - ${color.name}`,
        color: color.name,
        sortOrder: sort++,
      });
    }
  }

  const desiredKeys = new Set(desired.map((d) => imageKey(d.url, d.color)));

  const currentImages = await prisma.productImage.findMany({
    where: { productId, type: "image" },
    orderBy: { sortOrder: "asc" },
  });

  // Keep first row per url+color; drop exact script-style duplicates only.
  const seenKeys = new Set<string>();
  const duplicateIds: string[] = [];
  for (const img of currentImages) {
    const k = imageKey(img.url, img.color);
    if (!desiredKeys.has(k)) continue;
    if (seenKeys.has(k)) {
      duplicateIds.push(img.id);
      continue;
    }
    seenKeys.add(k);
  }
  if (duplicateIds.length) {
    await prisma.productImage.deleteMany({
      where: { id: { in: duplicateIds } },
    });
    console.log(
      `Removed ${duplicateIds.length} duplicate ProductImage(s) on ${productId}: ${duplicateIds.join(", ")}`,
    );
  }

  // Remove stale ai-hoodies script images no longer in the desired pack.
  // Keep videos and non-script uploads.
  const staleScriptIds = currentImages
    .filter((img) => {
      if (duplicateIds.includes(img.id)) return false;
      if (!img.url.includes("/images/ai-hoodies/")) return false;
      return !desiredKeys.has(imageKey(img.url, img.color));
    })
    .map((img) => img.id);
  if (staleScriptIds.length) {
    await prisma.productImage.deleteMany({
      where: { id: { in: staleScriptIds } },
    });
  }

  const remaining = await prisma.productImage.findMany({
    where: { productId, type: "image" },
  });
  const byKey = new Map(
    remaining.map((img) => [imageKey(img.url, img.color), img] as const),
  );

  for (const row of desired) {
    const k = imageKey(row.url, row.color);
    const existingRow = byKey.get(k);
    if (existingRow) {
      await prisma.productImage.update({
        where: { id: existingRow.id },
        data: {
          alt: row.alt,
          sortOrder: row.sortOrder,
          type: "image",
        },
      });
    } else {
      const created = await prisma.productImage.create({
        data: {
          productId,
          url: row.url,
          alt: row.alt,
          color: row.color,
          sortOrder: row.sortOrder,
          type: "image",
        },
      });
      byKey.set(k, created);
    }
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

  await syncHoodieImages(
    product.id,
    input.name,
    input.colors,
    input.cardImage,
  );

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

  // Non-hoodie cards → ai-home lifestyle (keep ai-hoodies for hoodie SKUs).
  const pool = [
    homeAi("hero-1-nam-thun-xanh.jpg"),
    homeAi("hero-2-nu-thun-trang.jpg"),
    homeAi("hero-3-nam-den-ngoi.jpg"),
    homeAi("hero-4-nu-hoodie-croptop.jpg"),
    homeAi("look-1-thun-cam.jpg"),
    homeAi("look-2-nu-quan-cam.jpg"),
    homeAi("look-3-raglan.jpg"),
    homeAi("cat-ao-thun.jpg"),
    homeAi("cat-quan.jpg"),
    homeAi("cat-phu-kien.jpg"),
    homeAi("banner-16x9.jpg"),
  ];

  let i = 0;
  for (const p of products) {
    if (p.slug.startsWith("ao-hoodie")) continue;
    const primary = p.images[0];
    const nextUrl = pool[i % pool.length];
    i++;
    if (primary) {
      const stale =
        primary.url.startsWith("https://images.unsplash.com") ||
        primary.url.includes("/images/hoodies/") ||
        primary.url.includes("/images/home/") ||
        primary.url.includes("/images/categories/") ||
        primary.url.includes("/images/ai-hoodies/") ||
        primary.url.includes("/images/ai-home/");
      if (stale) {
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
  console.log("Refreshed catalog card images → /images/ai-home/*.");
}

async function main() {
  await refreshCategoryImages();
  const hoodie = await ensureCategory();

  await upsertHoodie({
    name: "Áo Hoodie Essential Form Rộng",
    slug: "ao-hoodie-essential",
    gender: "MALE",
    description:
      "Áo Hoodie Essential form rộng cho nam — chất nỉ mềm, dày dặn, in PTT Shop. Gallery ảnh thật theo màu Kem / Đen / Nâu (front / back / fabric).",
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
    name: "Áo Hoodie Nữ Form Rộng PTT Shop Essential",
    slug: "ao-hoodie-nu-essential",
    gender: "FEMALE",
    description:
      "Áo Hoodie nữ form rộng PTT Shop Essential — in PTT Shop, mềm mại, dễ layer. Gallery ảnh thật Xám / Hồng / Đen (front / back / fabric).",
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
