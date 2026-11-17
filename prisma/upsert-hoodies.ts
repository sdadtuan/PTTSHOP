/**
 * Additive upsert for men's/women's hoodies with per-colour gallery images.
 * Does NOT wipe existing DB data.
 *
 * NOTE: Unsplash URLs are placeholders approximating colour variants.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const img = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

type ColorPack = {
  name: string;
  hex: string;
  images: string[];
};

async function ensureCategory() {
  return prisma.category.upsert({
    where: { slug: "hoodie" },
    update: {},
    create: {
      name: "Hoodie",
      slug: "hoodie",
      image: img("photo-1556821840-3a63f95609a7"),
      sortOrder: 5,
    },
  });
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
  }

  let sort = 0;
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

async function main() {
  const hoodie = await ensureCategory();

  await upsertHoodie({
    name: "Áo Hoodie Essential Form Rộng",
    slug: "ao-hoodie-essential",
    gender: "MALE",
    description:
      "Áo Hoodie Essential form rộng cho nam — chất nỉ mềm, dày dặn, phong cách unisex dễ phối. Placeholder ảnh Unsplash theo từng màu.",
    categoryId: hoodie.id,
    price: 599000,
    compareAt: 899000,
    colors: [
      {
        name: "Kem",
        hex: "#E8DCC8",
        images: [
          img("photo-1556821840-3a63f95609a7"),
          img("photo-1578587018452-892bacefd3f2"),
          img("photo-1620799140408-edc6dcb6d633"),
          img("photo-1576566588028-4147f3842f27"),
          img("photo-1618354691373-d851c5c3a990"),
        ],
      },
      {
        name: "Đen",
        hex: "#111111",
        images: [
          img("photo-1556821840-3a63f95609a7"),
          img("photo-1503342217505-b0a15ec3261c"),
          img("photo-1520975916090-3105956dac38"),
          img("photo-1618354691438-25bc04584c23"),
          img("photo-1583743814966-8936f5b7be1a"),
        ],
      },
      {
        name: "Nâu",
        hex: "#6B4423",
        images: [
          img("photo-1578587018452-892bacefd3f2"),
          img("photo-1489987707025-afc232f7ea0f"),
          img("photo-1552374196-1ab2a1c593e8"),
          img("photo-1523381210434-271e8be1f52b"),
          img("photo-1521572163474-6864f9cf17ab"),
        ],
      },
    ],
  });

  await upsertHoodie({
    name: "Áo Hoodie Nữ Form Rộng VIZFAS Essential",
    slug: "ao-hoodie-nu-essential",
    gender: "FEMALE",
    description:
      "Áo Hoodie nữ form rộng VIZFAS Essential — mềm mại, dễ layer. Ảnh Unsplash là placeholder theo từng màu (xám / hồng / đen).",
    categoryId: hoodie.id,
    price: 579000,
    compareAt: 849000,
    colors: [
      {
        name: "Xám nhạt",
        hex: "#C8C8C8",
        images: [
          img("photo-1515886657613-9f3515b0c78f"),
          img("photo-1434389677669-e08b4cac3105"),
          img("photo-1483985988355-763728e1935b"),
          img("photo-1469334031218-e382a71b716b"),
          img("photo-1496747611176-843222e1e57c"),
        ],
      },
      {
        name: "Hồng",
        hex: "#E8A0BF",
        images: [
          img("photo-1515886657613-9f3515b0c78f"),
          img("photo-1487412720507-e7ab37603c6f"),
          img("photo-1469334031218-e382a71b716b"),
          img("photo-1509631179647-0177331693ae"),
          img("photo-1490481651871-ab68de25d43d"),
        ],
      },
      {
        name: "Đen",
        hex: "#111111",
        images: [
          img("photo-1503342217505-b0a15ec3261c"),
          img("photo-1483985988355-763728e1935b"),
          img("photo-1515886657613-9f3515b0c78f"),
          img("photo-1529626455594-4ff0802cfb7e"),
          img("photo-1469334031218-e382a71b716b"),
        ],
      },
    ],
  });

  console.log("Done. Placeholder note: Unsplash images approximate colour variants.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
