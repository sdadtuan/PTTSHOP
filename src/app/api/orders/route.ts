import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  customerEmail: z.string().email().optional().or(z.literal("")),
  address: z.string().min(5),
  note: z.string().optional(),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER"]),
  items: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

function orderNumber() {
  const stamp = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `VF${stamp}${rand}`;
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Thông tin đơn hàng không hợp lệ" },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: data.items.map((i) => i.variantId) } },
      include: { product: true },
    });

    if (variants.length !== data.items.length) {
      return NextResponse.json(
        { error: "Một số sản phẩm không còn khả dụng" },
        { status: 400 },
      );
    }

    const lines = data.items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)!;
      if (variant.stock < item.quantity) {
        throw new Error(`Hết hàng: ${variant.product.name} (${variant.size})`);
      }
      return { item, variant };
    });

    const subtotal = lines.reduce(
      (sum, l) => sum + l.variant.price * l.item.quantity,
      0,
    );
    const shippingFee = subtotal >= 500000 ? 0 : 30000;
    const total = subtotal + shippingFee;

    const session = await auth();

    const order = await prisma.$transaction(async (tx) => {
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
          subtotal,
          shippingFee,
          discount: 0,
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

      for (const { item, variant } of lines) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      total: order.total,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi máy chủ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
