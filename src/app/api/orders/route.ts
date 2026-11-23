import { z } from "zod";
import { ApiError, handleApiError, jsonOk } from "@/lib/api";
import { getOptionalSession } from "@/lib/auth-guards";
import { getCartSessionId } from "@/lib/cart-session";
import {
  computeCouponDiscount,
  consumeCoupon,
  findValidCoupon,
} from "@/lib/coupons";
import { sendOrderConfirmationEmail } from "@/lib/mail";
import { getPaymentProvider } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { clientIp, recordConsents } from "@/lib/consent";
import { nextOrderNumber } from "@/lib/order-number";
import { emailSchema, phoneSchema } from "@/lib/validation";

const bodySchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  customerPhone: phoneSchema,
  customerEmail: emailSchema.optional().or(z.literal("")),
  address: z.string().trim().min(5).max(300),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER"]),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  consents: z
    .array(
      z.object({
        purpose: z.enum(["delivery", "invoice", "marketing"]),
        granted: z.boolean(),
      }),
    )
    .default([]),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1),
});

function orderNumber() {
  return nextOrderNumber();
}

export async function POST(req: Request) {
  try {
    const data = bodySchema.parse(await req.json());
    const session = await getOptionalSession();
    const sessionId = await getCartSessionId();

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: data.items.map((i) => i.variantId) } },
      include: { product: true },
    });

    if (variants.length !== data.items.length) {
      throw new ApiError("Một số sản phẩm không còn khả dụng", 400);
    }

    const lines = data.items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)!;
      if (variant.stock < item.quantity) {
        throw new ApiError(
          `Hết hàng: ${variant.product.name} (${variant.size})`,
          400,
        );
      }
      return { item, variant };
    });

    const subtotal = lines.reduce(
      (sum, l) => sum + l.variant.price * l.item.quantity,
      0,
    );
    const shippingFee = subtotal >= 500000 ? 0 : 30000;

    let discount = 0;
    let couponCode: string | null = null;
    let couponId: string | null = null;

    if (data.couponCode) {
      const coupon = await findValidCoupon(prisma, data.couponCode, subtotal);
      discount = computeCouponDiscount(coupon, subtotal);
      couponCode = coupon.code;
      couponId = coupon.id;
    }

    const total = Math.max(0, subtotal + shippingFee - discount);
    const provider = getPaymentProvider(data.paymentMethod);

    const order = await prisma.$transaction(async (tx) => {
      for (const { item, variant } of lines) {
        const updated = await tx.productVariant.updateMany({
          where: { id: variant.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new ApiError(
            `Không đủ tồn kho: ${variant.product.name} (${variant.size})`,
            400,
          );
        }
      }

      if (couponId) {
        const coupon = await tx.coupon.findUniqueOrThrow({
          where: { id: couponId },
        });
        await consumeCoupon(tx, coupon);
      }

      const created = await tx.order.create({
        data: {
          orderNumber: orderNumber(),
          userId: session?.user?.id,
          status: "PENDING",
          paymentMethod: data.paymentMethod,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || null,
          address: data.address,
          note: data.note || null,
          couponCode,
          subtotal,
          shippingFee,
          discount,
          total,
          items: {
            create: lines.map(({ item, variant }) => ({
              variantId: variant.id,
              name: variant.product.name,
              color: variant.color,
              size: variant.size,
              price: variant.price,
              quantity: item.quantity,
            })),
          },
        },
      });

      const payment = await provider.createPayment(created);
      return tx.order.update({
        where: { id: created.id },
        data: {
          paymentStatus: payment.paymentStatus,
          paymentProvider: payment.paymentProvider,
          paymentRef: payment.paymentRef ?? null,
        },
      });
    });

    // Clear server cart after successful order
    if (session?.user?.id) {
      const userCart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
      });
      if (userCart) {
        await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }
    } else if (sessionId) {
      const guestCart = await prisma.cart.findUnique({
        where: { sessionId },
      });
      if (guestCart) {
        await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
      }
    }

    await recordConsents({
      subject: order.customerEmail || order.customerPhone,
      userId: session?.user?.id,
      ip: clientIp(req),
      grants: data.consents,
      checkout: true,
    });

    void sendOrderConfirmationEmail({
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      total: order.total,
      status: order.status,
    });

    return jsonOk({
      orderNumber: order.orderNumber,
      total: order.total,
      discount: order.discount,
      paymentStatus: order.paymentStatus,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
