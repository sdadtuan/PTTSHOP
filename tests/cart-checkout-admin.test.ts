import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  computeCouponDiscount,
  consumeCoupon,
  findValidCoupon,
} from "@/lib/coupons";
import { getPaymentProvider } from "@/lib/payments";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { cleanDb, resetTestDb, seedMinimal } from "./helpers";

const prisma = new PrismaClient();

describe("cart, checkout, admin status", () => {
  beforeAll(() => {
    resetTestDb();
  });

  beforeEach(async () => {
    await cleanDb(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("adds item to cart for guest session", async () => {
    const { variant } = await seedMinimal(prisma);
    const cart = await prisma.cart.create({
      data: {
        sessionId: "guest-session-1",
        items: {
          create: { variantId: variant.id, quantity: 2 },
        },
      },
      include: { items: true },
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]!.quantity).toBe(2);
  });

  it("merges guest cart into user cart clamped to stock", async () => {
    const { customer, variant } = await seedMinimal(prisma);

    const guest = await prisma.cart.create({
      data: {
        sessionId: "merge-guest",
        items: {
          create: { variantId: variant.id, quantity: 4 },
        },
      },
    });
    const userCart = await prisma.cart.create({
      data: {
        userId: customer.id,
        items: {
          create: { variantId: variant.id, quantity: 3 },
        },
      },
    });

    const guestItems = await prisma.cartItem.findMany({
      where: { cartId: guest.id },
    });
    for (const item of guestItems) {
      const existing = await prisma.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: userCart.id,
            variantId: item.variantId,
          },
        },
      });
      const v = await prisma.productVariant.findUniqueOrThrow({
        where: { id: item.variantId },
      });
      const qty = Math.min(v.stock, (existing?.quantity ?? 0) + item.quantity);
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: qty },
        });
      }
    }
    await prisma.cart.delete({ where: { id: guest.id } });

    const merged = await prisma.cartItem.findFirstOrThrow({
      where: { cartId: userCart.id },
    });
    expect(merged.quantity).toBe(5);
  });

  it("checkout decrements stock safely and applies coupon", async () => {
    const { customer, variant } = await seedMinimal(prisma);

    const qty = 2;
    const subtotal = variant.price * qty;
    const coupon = await findValidCoupon(prisma, "SAVE10", subtotal);
    const discount = computeCouponDiscount(coupon, subtotal);
    expect(discount).toBe(Math.floor(subtotal * 0.1));

    const shippingFee = subtotal >= 500000 ? 0 : 30000;
    const total = Math.max(0, subtotal + shippingFee - discount);
    const provider = getPaymentProvider("COD");

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.productVariant.updateMany({
        where: { id: variant.id, stock: { gte: qty } },
        data: { stock: { decrement: qty } },
      });
      expect(updated.count).toBe(1);
      await consumeCoupon(tx, coupon);

      const created = await tx.order.create({
        data: {
          orderNumber: `PTTTEST${Date.now()}`,
          userId: customer.id,
          status: "PENDING",
          paymentMethod: "COD",
          customerName: "Buyer",
          customerPhone: "0900000000",
          customerEmail: customer.email,
          address: "1 Test St",
          couponCode: coupon.code,
          subtotal,
          shippingFee,
          discount,
          total,
          items: {
            create: {
              variantId: variant.id,
              name: "Test Tee",
              color: variant.color,
              size: variant.size,
              price: variant.price,
              quantity: qty,
            },
          },
        },
      });
      const payment = await provider.createPayment(created);
      return tx.order.update({
        where: { id: created.id },
        data: {
          paymentStatus: payment.paymentStatus,
          paymentProvider: payment.paymentProvider,
        },
      });
    });

    const after = await prisma.productVariant.findUniqueOrThrow({
      where: { id: variant.id },
    });
    expect(after.stock).toBe(3);
    expect(order.discount).toBe(discount);
    expect(order.paymentProvider).toBe("cod");

    const oversell = await prisma.productVariant.updateMany({
      where: { id: variant.id, stock: { gte: 99 } },
      data: { stock: { decrement: 99 } },
    });
    expect(oversell.count).toBe(0);
  });

  it("admin can change order status (COMPLETED = Đã giao)", async () => {
    const { customer, variant } = await seedMinimal(prisma);

    const order = await prisma.order.create({
      data: {
        orderNumber: `PTTADM${Date.now()}`,
        userId: customer.id,
        status: "PENDING",
        paymentMethod: "COD",
        customerName: "Buyer",
        customerPhone: "0900000000",
        address: "1 Test St",
        subtotal: variant.price,
        shippingFee: 0,
        discount: 0,
        total: variant.price,
        items: {
          create: {
            variantId: variant.id,
            name: "Test Tee",
            color: variant.color,
            size: variant.size,
            price: variant.price,
            quantity: 1,
          },
        },
      },
    });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "SHIPPING" },
    });
    expect(updated.status).toBe("SHIPPING");
    expect(ORDER_STATUS_LABELS.COMPLETED).toBe("Đã giao");

    const delivered = await prisma.order.update({
      where: { id: order.id },
      data: { status: "COMPLETED" },
    });
    expect(delivered.status).toBe("COMPLETED");
  });
});
