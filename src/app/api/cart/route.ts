import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { getOptionalSession } from "@/lib/auth-guards";
import {
  addToCart,
  getCartForActor,
  getOrCreateCart,
  serializeCart,
} from "@/lib/cart-service";
import { getCartSessionId, getOrCreateCartSessionId } from "@/lib/cart-session";
import { prisma } from "@/lib/prisma";

async function actor() {
  const session = await getOptionalSession();
  const userId = session?.user?.id ?? null;
  const sessionId = userId
    ? await getCartSessionId()
    : await getOrCreateCartSessionId();
  return { userId, sessionId };
}

export async function GET() {
  try {
    const { userId, sessionId } = await actor();
    const cart = await getCartForActor({ userId, sessionId });
    return jsonOk(serializeCart(cart));
  } catch (err) {
    return handleApiError(err);
  }
}

const addSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive().max(99).default(1),
});

export async function POST(req: Request) {
  try {
    const body = addSchema.parse(await req.json());
    const { userId, sessionId } = await actor();
    const cart = await addToCart({
      userId,
      sessionId: userId ? null : sessionId,
      variantId: body.variantId,
      quantity: body.quantity,
    });
    return jsonOk(serializeCart(cart), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(0).max(99),
});

export async function PATCH(req: Request) {
  try {
    const body = patchSchema.parse(await req.json());
    const { userId, sessionId } = await actor();
    const cart = await getOrCreateCart({
      userId,
      sessionId: userId ? null : sessionId,
    });

    if (body.quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, variantId: body.variantId },
      });
    } else {
      const variant = await prisma.productVariant.findUnique({
        where: { id: body.variantId },
      });
      if (!variant) return jsonError("Biến thể không tồn tại", 404);
      if (body.quantity > variant.stock) {
        return jsonError(`Chỉ còn ${variant.stock} sản phẩm`, 400);
      }
      await prisma.cartItem.upsert({
        where: {
          cartId_variantId: { cartId: cart.id, variantId: body.variantId },
        },
        create: {
          cartId: cart.id,
          variantId: body.variantId,
          quantity: body.quantity,
        },
        update: { quantity: body.quantity },
      });
    }

    const next = await getCartForActor({
      userId,
      sessionId: userId ? null : sessionId,
    });
    return jsonOk(serializeCart(next));
  } catch (err) {
    return handleApiError(err);
  }
}

const deleteSchema = z.object({
  variantId: z.string().min(1).optional(),
  clear: z.boolean().optional(),
});

export async function DELETE(req: Request) {
  try {
    const body = deleteSchema.parse(await req.json().catch(() => ({})));
    const { userId, sessionId } = await actor();
    const cart = await getCartForActor({
      userId,
      sessionId: userId ? null : sessionId,
    });
    if (!cart) return jsonOk(serializeCart(null));

    if (body.clear) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    } else if (body.variantId) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, variantId: body.variantId },
      });
    } else {
      return jsonError("Thiếu variantId hoặc clear", 400);
    }

    const next = await getCartForActor({
      userId,
      sessionId: userId ? null : sessionId,
    });
    return jsonOk(serializeCart(next));
  } catch (err) {
    return handleApiError(err);
  }
}
