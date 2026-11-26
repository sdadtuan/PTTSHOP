import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: async () => null }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => undefined,
    delete: () => undefined,
  }),
}));

import { PrismaClient } from "@prisma/client";
import { POST as placeOrder } from "@/app/api/orders/route";
import { ApiError } from "@/lib/api";
import { NOT_FOR_SALE_MESSAGE } from "@/lib/catalog-visibility";
import { addToCart } from "@/lib/cart-service";

const prisma = new PrismaClient();

async function makeProduct(flags: { isDemo?: boolean; saleStatus?: string }) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return prisma.product.create({
    data: {
      name: `Áo kiểm ${stamp}`,
      slug: `kiem-${stamp}`,
      gender: "UNISEX",
      isDemo: flags.isDemo ?? false,
      saleStatus: flags.saleStatus ?? "SELLING",
      variants: {
        create: {
          sku: `kiem-${stamp}`,
          color: "Đen",
          size: "M",
          price: 100_000,
          stock: 4,
        },
      },
    },
    include: { variants: true },
  });
}

async function removeProduct(productId: string) {
  const variants = await prisma.productVariant.findMany({
    where: { productId },
    select: { id: true },
  });
  const variantIds = variants.map((row) => row.id);
  await prisma.cartItem.deleteMany({ where: { variantId: { in: variantIds } } });
  await prisma.productVariant.deleteMany({ where: { productId } });
  await prisma.product.delete({ where: { id: productId } });
}

function orderRequest(variantId: string) {
  return new Request("http://localhost/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      customerName: "Kiem tra don",
      customerPhone: "0901234567",
      customerEmail: "",
      address: "1 Nguyen Hue",
      provinceCode: "79",
      wardCode: "26506",
      paymentMethod: "COD",
      consents: [{ purpose: "delivery", granted: true }],
      items: [{ variantId, quantity: 1 }],
    }),
  });
}

describe("demo and unsold variants cannot be bought", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("addToCart rejects a demo product and leaves the existing cart line", async () => {
    const product = await makeProduct({ isDemo: true });
    const variantId = product.variants[0]!.id;
    const cart = await prisma.cart.create({
      data: {
        sessionId: `demo-sale-${product.id}`,
        items: { create: { variantId, quantity: 1 } },
      },
    });
    await expect(
      addToCart({ sessionId: cart.sessionId, variantId, quantity: 1 }),
    ).rejects.toMatchObject({ message: NOT_FOR_SALE_MESSAGE, status: 400 });
    const line = await prisma.cartItem.findFirstOrThrow({ where: { cartId: cart.id } });
    expect(line.quantity).toBe(1);
    await prisma.cart.delete({ where: { id: cart.id } });
    await removeProduct(product.id);
  });

  it("addToCart rejects a product that is not selling", async () => {
    const product = await makeProduct({ saleStatus: "HIDDEN" });
    const variantId = product.variants[0]!.id;
    const error = await addToCart({
      sessionId: `demo-sale-hidden-${product.id}`,
      variantId,
      quantity: 1,
    }).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: NOT_FOR_SALE_MESSAGE, status: 400 });
    expect(await prisma.cartItem.count({ where: { variantId } })).toBe(0);
    await prisma.cart.deleteMany({ where: { sessionId: `demo-sale-hidden-${product.id}` } });
    await removeProduct(product.id);
  });

  it("POST /api/orders rejects demo and hidden variants without writing an order or clearing the cart", async () => {
    const demo = await makeProduct({ isDemo: true });
    const hidden = await makeProduct({ saleStatus: "DISCONTINUED" });
    const ordersBefore = await prisma.order.count();
    for (const product of [demo, hidden]) {
      const variantId = product.variants[0]!.id;
      const cart = await prisma.cart.create({
        data: {
          sessionId: `demo-sale-order-${product.id}`,
          items: { create: { variantId, quantity: 1 } },
        },
      });
      const res = await placeOrder(orderRequest(variantId));
      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body.error).toBe(NOT_FOR_SALE_MESSAGE);
      expect(await prisma.order.count()).toBe(ordersBefore);
      expect(await prisma.cartItem.count({ where: { cartId: cart.id } })).toBe(1);
      await prisma.cart.delete({ where: { id: cart.id } });
      await removeProduct(product.id);
    }
  });
});
