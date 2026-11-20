import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { cleanDb, resetTestDb, seedMinimal } from "./helpers";
import { deleteCategoryIfEmpty, uniqueCategorySlug } from "@/lib/category-admin";

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

describe("admin categories", () => {
  it("creates a unique slug from name", async () => {
    await prisma.category.create({ data: { name: "Áo thun", slug: "ao-thun" } });
    const slug = await uniqueCategorySlug("Áo thun");
    expect(slug).toBe("ao-thun-2");
  });

  it("blocks delete when products are assigned", async () => {
    const { product } = await seedMinimal(prisma);
    const cat = await prisma.category.create({ data: { name: "Test", slug: "test-cat" } });
    await prisma.product.update({ where: { id: product.id }, data: { categoryId: cat.id } });
    const result = await deleteCategoryIfEmpty(cat.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
    const still = await prisma.category.findUnique({ where: { id: cat.id } });
    expect(still).not.toBeNull();
  });

  it("deletes empty category", async () => {
    const cat = await prisma.category.create({ data: { name: "Rỗng", slug: "rong" } });
    const result = await deleteCategoryIfEmpty(cat.id);
    expect(result.ok).toBe(true);
    expect(await prisma.category.findUnique({ where: { id: cat.id } })).toBeNull();
  });
});