import { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { claimWarehouseStock } from "@/lib/inventory/claim";

describe("claimWarehouseStock", () => {
  it("hai đơn cùng lúc, tồn 1, chỉ một đơn thành công", async () => {
    const db = new PrismaClient();
    const stamp = Date.now();
    const product = await db.product.create({
      data: {
        name: "Áo tồn song song",
        slug: `ao-song-${stamp}`,
        gender: "UNISEX",
        variants: { create: { sku: `song-${stamp}`, color: "Đen", size: "M", price: 100_000, stock: 1 } },
      },
      include: { variants: true },
    });
    const id = product.variants[0]!.id;
    const results = await Promise.allSettled([
      db.$transaction((tx) => claimWarehouseStock(tx, id, 1)),
      db.$transaction((tx) => claimWarehouseStock(tx, id, 1)),
    ]);
    const left = await db.productVariant.findUnique({ where: { id } });
    await db.productVariant.deleteMany({ where: { productId: product.id } });
    await db.product.delete({ where: { id: product.id } });
    await db.$disconnect();
    expect(results.filter((row) => row.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((row) => row.status === "rejected")).toHaveLength(1);
    expect(left?.stock).toBe(0);
  });
});
