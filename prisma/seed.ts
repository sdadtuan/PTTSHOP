import { PrismaClient, Gender } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readAdminCredentials } from "../src/lib/admin-credentials";
import { ensureHomepageCmsSeeded } from "../src/lib/cms/homepage";
import { ensureStorefrontPagesSeeded } from "../src/lib/storefront/pages";
import { ensureStorefrontUiSeeded } from "../src/lib/storefront/ui-copy";

if (process.env.NODE_ENV === "production") {
  console.error("Từ chối seed khi NODE_ENV=production.");
  process.exit(1);
}

const prisma = new PrismaClient();

const img = (_id: string) => "/images/placeholder-product.svg";

async function main() {
  const admin = readAdminCredentials();
  const password = await bcrypt.hash(admin.password, 10);

  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productCollection.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.category.deleteMany();
  await prisma.flashSale.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      name: "Admin PTT Shop",
      email: admin.email,
      password,
      role: "ADMIN",
    },
  });

  const aoThun = await prisma.category.create({
    data: {
      name: "Áo thun",
      slug: "ao-thun",
      image: img("photo-1521572163474-6864f9cf17ab"),
      sortOrder: 1,
    },
  });

  const aoKhoac = await prisma.category.create({
    data: {
      name: "Áo khoác",
      slug: "ao-khoac",
      image: img("photo-1551028719-00167b16eac5"),
      sortOrder: 2,
    },
  });

  const quan = await prisma.category.create({
    data: {
      name: "Quần",
      slug: "quan",
      image: img("photo-1624378439575-d8705ad7ae80"),
      sortOrder: 3,
    },
  });

  const phuKien = await prisma.category.create({
    data: {
      name: "Phụ kiện",
      slug: "phu-kien",
      image: img("photo-1556306535-0f09a537f0a3"),
      sortOrder: 4,
    },
  });

  const hoodie = await prisma.category.create({
    data: {
      name: "Hoodie",
      slug: "hoodie",
      image: img("photo-1556821840-3a63f95609a7"),
      sortOrder: 5,
    },
  });

  const essentials = await prisma.collection.create({
    data: {
      name: "Essentials Collection",
      slug: "essentials",
      description: "Phong cách tối giản, dễ phối mỗi ngày",
      image: img("photo-1483985988355-763728e1935b"),
    },
  });

  await prisma.flashSale.create({
    data: {
      title: "Ưu đãi độc quyền -50%",
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 26),
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      code: "PTTSHOP10",
      description: "Giảm 10% đơn từ 500.000đ",
      discountType: "PERCENT",
      discountValue: 10,
      minOrder: 500000,
      isActive: false,
    },
  });

  type SeedProduct = {
    name: string;
    slug: string;
    description: string;
    material: string;
    fit: string;
    gender: Gender;
    categoryId: string;
    isFeatured?: boolean;
    isNew?: boolean;
    isBestSeller?: boolean;
    /** Product-level fallback images (no colour scope). */
    images: string[];
    /** Optional per-colour galleries. Local placeholder until real photos exist. */
    colorImages?: Record<string, string[]>;
    colors: { name: string; hex: string }[];
    sizes: string[];
    price: number;
    compareAt?: number;
    stock?: number;
  };

  const products: SeedProduct[] = [
    {
      name: "Áo Thun Oversize",
      slug: "ao-thun-oversize",
      description:
        "Áo thun oversize form rộng hiện đại, dễ phối với quần jean, cargo hoặc kaki. Chất cotton mềm, bền màu sau nhiều lần giặt.",
      material: "100% Cotton",
      fit: "Oversize",
      gender: "UNISEX",
      categoryId: aoThun.id,
      isFeatured: true,
      isBestSeller: true,
      images: [
        img("photo-1521572163474-6864f9cf17ab"),
        img("photo-1583743814966-8936f5b7be1a"),
        img("photo-1618354691373-d851c5c3a990"),
      ],
      colors: [
        { name: "Đen", hex: "#111111" },
        { name: "Trắng", hex: "#F5F5F5" },
        { name: "Navy", hex: "#1B2A4A" },
        { name: "Olive", hex: "#556B2F" },
      ],
      sizes: ["S", "M", "L", "XL"],
      price: 259000,
      compareAt: 349000,
    },
    {
      name: "Áo Thun Nam Basic",
      slug: "ao-thun-nam-basic",
      description:
        "Áo thun nam basic thanh lịch, tối giản cho mọi phong cách. Form vừa, chất liệu cao cấp, bền màu.",
      material: "Cotton 2 chiều",
      fit: "Regular",
      gender: "MALE",
      categoryId: aoThun.id,
      isNew: true,
      isFeatured: true,
      images: [
        img("photo-1562157873-818bc0726f68"),
        img("photo-1576566588028-4147f3842f27"),
      ],
      colors: [
        { name: "Đen", hex: "#111111" },
        { name: "Nâu", hex: "#6B4423" },
        { name: "Xám", hex: "#8A8A8A" },
      ],
      sizes: ["S", "M", "L", "XL"],
      price: 259000,
    },
    {
      name: "Áo Thun Nữ Basic",
      slug: "ao-thun-nu-basic",
      description:
        "Áo thun nữ basic thanh lịch, tối giản cho mọi phong cách. Form rộng hiện đại, dễ phối đồ.",
      material: "Cotton mềm",
      fit: "Relaxed",
      gender: "FEMALE",
      categoryId: aoThun.id,
      isNew: true,
      isFeatured: true,
      images: [
        img("photo-1515886657613-9f3515b0c78f"),
        img("photo-1434389677669-e08b4cac3105"),
      ],
      colors: [
        { name: "Xanh", hex: "#2F6B4F" },
        { name: "Hồng", hex: "#E8A0BF" },
        { name: "Đen", hex: "#111111" },
      ],
      sizes: ["S", "M", "L", "XL"],
      price: 259000,
    },
    {
      name: "Áo Hoodie Essential Form Rộng",
      slug: "ao-hoodie-essential",
      description:
        "Hoodie Essential form rộng, giữ ấm nhẹ, phù hợp streetwear và mặc hàng ngày. Chất nỉ dày vừa, bền màu.",
      material: "Nỉ cotton",
      fit: "Oversize",
      gender: "UNISEX",
      categoryId: hoodie.id,
      isFeatured: true,
      isBestSeller: true,
      isNew: true,
      images: [
        img("photo-1556821840-3a63f95609a7"),
        img("photo-1578587018452-892bacefd3f2"),
      ],
      colors: [
        { name: "Kem", hex: "#E8DCC8" },
        { name: "Đen", hex: "#111111" },
        { name: "Nâu", hex: "#6B4423" },
      ],
      colorImages: {
        Kem: [
          img("photo-1556821840-3a63f95609a7"),
          img("photo-1578587018452-892bacefd3f2"),
          img("photo-1620799140408-edc6dcb6d633"),
        ],
        Đen: [
          img("photo-1556821840-3a63f95609a7"),
          img("photo-1503342217505-b0a15ec3261c"),
          img("photo-1520975916090-3105956dac38"),
        ],
        Nâu: [
          img("photo-1578587018452-892bacefd3f2"),
          img("photo-1489987707025-afc232f7ea0f"),
          img("photo-1552374196-1ab2a1c593e8"),
        ],
      },
      sizes: ["S", "M", "L", "XL", "XXL"],
      price: 599000,
      compareAt: 899000,
    },
    {
      name: "Áo Hoodie Nữ Form Rộng PTT Shop Essential",
      slug: "ao-hoodie-nu-essential",
      description:
        "Hoodie nữ form rộng. Ảnh màu dùng ảnh cục bộ cho đến khi có ảnh thật.",
      material: "Nỉ cotton",
      fit: "Oversize",
      gender: "FEMALE",
      categoryId: hoodie.id,
      isFeatured: true,
      isNew: true,
      images: [img("photo-1515886657613-9f3515b0c78f")],
      colors: [
        { name: "Xám nhạt", hex: "#C8C8C8" },
        { name: "Hồng", hex: "#E8A0BF" },
        { name: "Đen", hex: "#111111" },
      ],
      colorImages: {
        "Xám nhạt": [
          img("photo-1515886657613-9f3515b0c78f"),
          img("photo-1434389677669-e08b4cac3105"),
        ],
        Hồng: [
          img("photo-1487412720507-e7ab37603c6f"),
          img("photo-1469334031218-e382a71b716b"),
        ],
        Đen: [
          img("photo-1503342217505-b0a15ec3261c"),
          img("photo-1483985988355-763728e1935b"),
        ],
      },
      sizes: ["S", "M", "L", "XL", "XXL"],
      price: 579000,
      compareAt: 849000,
    },
    {
      name: "Áo Khoác Bomber",
      slug: "ao-khoac-bomber",
      description:
        "Áo khoác bomber thời thượng, lớp ngoài chống gió nhẹ, dễ layer cho phong cách đường phố.",
      material: "Polyester",
      fit: "Regular",
      gender: "MALE",
      categoryId: aoKhoac.id,
      isBestSeller: true,
      images: [
        img("photo-1551028719-00167b16eac5"),
        img("photo-1591047139829-d91aecb6caea"),
      ],
      colors: [
        { name: "Đen", hex: "#111111" },
        { name: "Be", hex: "#D4C4A8" },
      ],
      sizes: ["M", "L", "XL"],
      price: 690000,
      compareAt: 890000,
    },
    {
      name: "Áo Khoác Varsity",
      slug: "ao-khoac-varsity",
      description:
        "Varsity jacket nổi bật với phối màu tương phản, tạo điểm nhấn cho outfit dạo phố.",
      material: "Wool blend",
      fit: "Regular",
      gender: "UNISEX",
      categoryId: aoKhoac.id,
      isBestSeller: true,
      images: [img("photo-1544022613-e87ca75a784a")],
      colors: [
        { name: "Đen/Kem", hex: "#222222" },
        { name: "Navy/Trắng", hex: "#1B2A4A" },
      ],
      sizes: ["M", "L", "XL"],
      price: 790000,
    },
    {
      name: "Quần Cargo Năng Động",
      slug: "quan-cargo",
      description:
        "Quần cargo năng động với nhiều túi tiện lợi, form rộng dễ mặc, phù hợp streetwear.",
      material: "Kaki cotton",
      fit: "Relaxed",
      gender: "UNISEX",
      categoryId: quan.id,
      isFeatured: true,
      isNew: true,
      images: [
        img("photo-1624378439575-d8705ad7ae80"),
        img("photo-1473966968600-fa801b869a1a"),
      ],
      colors: [
        { name: "Be", hex: "#C4B59A" },
        { name: "Đen", hex: "#111111" },
        { name: "Olive", hex: "#556B2F" },
      ],
      sizes: ["S", "M", "L", "XL"],
      price: 459000,
    },
    {
      name: "Quần Kaki Năng Động",
      slug: "quan-kaki",
      description:
        "Quần kaki form đứng, dễ phối với áo thun hoặc sơ mi. Chất kaki dày vừa, ít nhăn.",
      material: "Kaki",
      fit: "Straight",
      gender: "MALE",
      categoryId: quan.id,
      isBestSeller: true,
      images: [img("photo-1473966968600-fa801b869a1a")],
      colors: [
        { name: "Be", hex: "#D2B48C" },
        { name: "Xám", hex: "#8A8A8A" },
        { name: "Đen", hex: "#111111" },
      ],
      sizes: ["S", "M", "L", "XL"],
      price: 399000,
    },
    {
      name: "Nón Baseball Classic",
      slug: "non-baseball",
      description: "Nón baseball cổ điển, phụ kiện dễ phối cho outfit thường ngày.",
      material: "Cotton twill",
      fit: "One size",
      gender: "UNISEX",
      categoryId: phuKien.id,
      isNew: true,
      images: [img("photo-1588850561407-ed78ebb91e8e")],
      colors: [
        { name: "Xanh lá", hex: "#2F6B4F" },
        { name: "Đen", hex: "#111111" },
        { name: "Be", hex: "#D4C4A8" },
      ],
      sizes: ["Free"],
      price: 199000,
    },
    {
      name: "Túi Đeo Chéo Mini",
      slug: "tui-deo-cheo",
      description: "Túi đeo chéo mini tiện lợi, đủ chỗ cho điện thoại và ví nhỏ.",
      material: "Canvas",
      fit: "One size",
      gender: "UNISEX",
      categoryId: phuKien.id,
      isFeatured: true,
      images: [img("photo-1548036328-c9fa89d128fa")],
      colors: [
        { name: "Đen", hex: "#111111" },
        { name: "Nâu", hex: "#6B4423" },
      ],
      sizes: ["Free"],
      price: 289000,
    },
    {
      name: "Áo Thun Raglan",
      slug: "ao-thun-raglan",
      description: "Áo thun raglan phối tay tương phản, mang lại cảm giác năng động.",
      material: "Cotton",
      fit: "Regular",
      gender: "MALE",
      categoryId: aoThun.id,
      isFeatured: true,
      images: [img("photo-1529374255404-311a2a4f1fd9")],
      colors: [
        { name: "Trắng/Đen", hex: "#F5F5F5" },
        { name: "Xám/Navy", hex: "#8A8A8A" },
      ],
      sizes: ["S", "M", "L", "XL"],
      price: 299000,
    },
    {
      name: "Áo Polo Essential",
      slug: "ao-polo-essential",
      description: "Áo polo lịch sự vừa đủ cho đi làm và dạo phố.",
      material: "Pique cotton",
      fit: "Regular",
      gender: "MALE",
      categoryId: aoThun.id,
      isNew: true,
      images: [img("photo-1586790170083-2f9ceadc732d")],
      colors: [
        { name: "Trắng", hex: "#F5F5F5" },
        { name: "Navy", hex: "#1B2A4A" },
        { name: "Đen", hex: "#111111" },
      ],
      sizes: ["S", "M", "L", "XL"],
      price: 349000,
    },
  ];

  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        material: p.material,
        fit: p.fit,
        thickness: "Trung bình",
        stretch: true,
        origin: "Việt Nam",
        gender: p.gender,
        categoryId: p.categoryId,
        isFeatured: p.isFeatured ?? false,
        isNew: p.isNew ?? false,
        isBestSeller: p.isBestSeller ?? false,
        rating: 0,
        reviewCount: 0,
        images: {
          create: (() => {
            if (p.colorImages) {
              const rows: {
                url: string;
                alt: string;
                color: string;
                sortOrder: number;
              }[] = [];
              let i = 0;
              for (const [color, urls] of Object.entries(p.colorImages)) {
                for (const url of urls) {
                  rows.push({
                    url,
                    alt: `${p.name} - ${color}`,
                    color,
                    sortOrder: i++,
                  });
                }
              }
              return rows;
            }
            return p.images.map((url, i) => ({
              url,
              alt: p.name,
              sortOrder: i,
            }));
          })(),
        },
        collections: {
          create: [{ collectionId: essentials.id }],
        },
      },
    });

    for (const color of p.colors) {
      for (const size of p.sizes) {
        const sku = `${p.slug}-${color.name}-${size}`
          .toUpperCase()
          .replace(/\s+/g, "-")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        await prisma.productVariant.create({
          data: {
            sku,
            color: color.name,
            colorHex: color.hex,
            size,
            price: p.price,
            compareAt: p.compareAt,
            stock: p.stock ?? 25,
            productId: product.id,
          },
        });
      }
    }
  }

  const demoProduct = await prisma.product.findFirst({
    where: { slug: "ao-thun-oversize" },
    include: { variants: { take: 1 } },
  });
  if (demoProduct?.variants[0]) {
    const variant = demoProduct.variants[0];
    const order = await prisma.order.create({
      data: {
        orderNumber: "VFSEED0001",
        status: "COMPLETED",
        paymentMethod: "COD",
        paymentStatus: "PAID",
        paymentProvider: "cod",
        customerName: "Khách mẫu",
        customerPhone: "0901234567",
        address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
        subtotal: variant.price,
        shippingFee: 0,
        discount: 0,
        total: variant.price,
        items: {
          create: {
            variantId: variant.id,
            name: demoProduct.name,
            color: variant.color,
            size: variant.size,
            price: variant.price,
            quantity: 1,
          },
        },
      },
    });
    await prisma.review.create({
      data: {
        productId: demoProduct.id,
        orderId: order.id,
        rating: 5,
        comment: "Áo đẹp, form rộng vừa ý. Sẽ mua lại!",
      },
    });
    await prisma.product.update({
      where: { id: demoProduct.id },
      data: { rating: 5, reviewCount: 1 },
    });
  }

  await ensureHomepageCmsSeeded();
  await ensureStorefrontPagesSeeded();
  await ensureStorefrontUiSeeded();

  console.log(`Seed xong. Admin: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
