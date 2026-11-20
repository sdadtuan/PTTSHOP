import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { cleanDb, resetTestDb, seedMinimal } from "./helpers";
import { listPublishedReviews, recomputeProductRating } from "@/lib/reviews";

const prisma = new PrismaClient();

beforeAll(() => {
  resetTestDb();
});

beforeEach(async () => {
  await cleanDb(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("review moderation", () => {
  it("recompute ignores hidden reviews", async () => {
    const { product, customer } = await seedMinimal(prisma);
    const order = await prisma.order.create({
      data: {
        userId: customer.id,
        orderNumber: "T-REV-1",
        status: "COMPLETED",
        customerName: "Test",
        customerPhone: "0900000000",
        address: "Test address",
        subtotal: 100000,
        total: 100000,
        items: {
          create: {
            variantId: product.variants[0]!.id,
            name: product.name,
            color: "Đen",
            size: "M",
            price: 100000,
            quantity: 1,
          },
        },
      },
    });
    await prisma.review.create({
      data: {
        userId: customer.id,
        productId: product.id,
        orderId: order.id,
        rating: 5,
        comment: "Ok",
        isPublished: true,
      },
    });
    await prisma.review.create({
      data: {
        productId: product.id,
        rating: 1,
        comment: "Hidden",
        isAdminCreated: true,
        displayName: "Test",
        isPublished: false,
      },
    });
    await recomputeProductRating(prisma, product.id);
    const updated = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(updated.reviewCount).toBe(1);
    expect(updated.rating).toBe(5);
  });

  it("catalog lists only published reviews", async () => {
    const { product } = await seedMinimal(prisma);
    await prisma.review.create({
      data: {
        productId: product.id,
        rating: 4,
        displayName: "Lan",
        isAdminCreated: true,
        isPublished: true,
      },
    });
    await prisma.review.create({
      data: {
        productId: product.id,
        rating: 2,
        displayName: "Ẩn",
        isAdminCreated: true,
        isPublished: false,
      },
    });
    const catalog = await listPublishedReviews(prisma, { page: 1, pageSize: 10 });
    expect(catalog.total).toBe(1);
    expect(catalog.reviews[0]!.userName).toBe("Lan");
  });
});