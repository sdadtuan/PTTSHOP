import { execSync } from "child_process";
import path from "path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const dbUrl = process.env.DATABASE_URL || "file:./test.db";

export function resetTestDb() {
  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(process.cwd()),
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: "pipe",
  });
}

export async function cleanDb(prisma: PrismaClient) {
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
  await prisma.coupon.deleteMany();
  await prisma.flashSale.deleteMany();
  await prisma.heroBanner.deleteMany();
  await prisma.homepageVersion.deleteMany();
  await prisma.homepageSection.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedMinimal(prisma: PrismaClient) {
  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@test.local",
      password: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
    },
  });
  const customer = await prisma.user.create({
    data: {
      name: "Customer",
      email: "customer@test.local",
      password: await bcrypt.hash("khach123", 10),
      role: "CUSTOMER",
    },
  });
  const product = await prisma.product.create({
    data: {
      name: "Test Tee",
      slug: "test-tee",
      description: "Test",
      gender: "UNISEX",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
            sortOrder: 0,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: "TEST-TEE-BLACK-M",
            color: "Đen",
            colorHex: "#111",
            size: "M",
            price: 200000,
            stock: 5,
          },
        ],
      },
    },
    include: { variants: true },
  });
  await prisma.coupon.create({
    data: {
      code: "SAVE10",
      discountType: "PERCENT",
      discountValue: 10,
      minOrder: 100000,
      isActive: true,
    },
  });
  return { admin, customer, product, variant: product.variants[0]! };
}
