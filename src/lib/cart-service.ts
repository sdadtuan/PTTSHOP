import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";

export async function getCartForActor(opts: {
  userId?: string | null;
  sessionId?: string | null;
}) {
  if (opts.userId) {
    return prisma.cart.findUnique({
      where: { userId: opts.userId },
      include: cartInclude,
    });
  }
  if (opts.sessionId) {
    return prisma.cart.findUnique({
      where: { sessionId: opts.sessionId },
      include: cartInclude,
    });
  }
  return null;
}

export async function getOrCreateCart(opts: {
  userId?: string | null;
  sessionId?: string | null;
}) {
  if (opts.userId) {
    return prisma.cart.upsert({
      where: { userId: opts.userId },
      create: { userId: opts.userId },
      update: {},
      include: cartInclude,
    });
  }
  if (!opts.sessionId) {
    throw new ApiError("Thiếu session giỏ hàng", 400);
  }
  return prisma.cart.upsert({
    where: { sessionId: opts.sessionId },
    create: { sessionId: opts.sessionId },
    update: {},
    include: cartInclude,
  });
}

export const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
            },
          },
        },
      },
    },
  },
} as const;

export function serializeCart(
  cart: Awaited<ReturnType<typeof getOrCreateCart>> | null,
) {
  if (!cart) {
    return { id: null, items: [], count: 0, subtotal: 0 };
  }
  const items = cart.items.map((i) => ({
    id: i.id,
    variantId: i.variantId,
    productId: i.variant.productId,
    slug: i.variant.product.slug,
    name: i.variant.product.name,
    color: i.variant.color,
    size: i.variant.size,
    price: i.variant.price,
    compareAt: i.variant.compareAt,
    image: i.variant.product.images[0]?.url ?? "",
    quantity: i.quantity,
    stock: i.variant.stock,
  }));
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return { id: cart.id, items, count, subtotal };
}

export async function addToCart(opts: {
  userId?: string | null;
  sessionId?: string | null;
  variantId: string;
  quantity: number;
}) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: opts.variantId },
  });
  if (!variant) throw new ApiError("Biến thể không tồn tại", 404);
  if (variant.stock <= 0) throw new ApiError("Sản phẩm hết hàng", 400);

  const cart = await getOrCreateCart({
    userId: opts.userId,
    sessionId: opts.sessionId,
  });

  const existing = cart.items.find((i) => i.variantId === opts.variantId);
  const nextQty = (existing?.quantity ?? 0) + opts.quantity;
  if (nextQty > variant.stock) {
    throw new ApiError(`Chỉ còn ${variant.stock} sản phẩm`, 400);
  }

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQty },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: opts.variantId,
        quantity: opts.quantity,
      },
    });
  }

  return getCartForActor({
    userId: opts.userId,
    sessionId: opts.sessionId,
  });
}

/** Merge guest cart into user cart; clamp to stock; delete guest cart. */
export async function mergeGuestCartIntoUser(
  userId: string,
  sessionId: string | null,
) {
  if (!sessionId) return getOrCreateCart({ userId });

  const guest = await prisma.cart.findUnique({
    where: { sessionId },
    include: { items: true },
  });
  if (!guest || guest.items.length === 0) {
    return getOrCreateCart({ userId });
  }

  const userCart = await getOrCreateCart({ userId });

  await prisma.$transaction(async (tx) => {
    for (const item of guest.items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
      });
      if (!variant || variant.stock <= 0) continue;

      const existing = await tx.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: userCart.id,
            variantId: item.variantId,
          },
        },
      });
      const qty = Math.min(
        variant.stock,
        (existing?.quantity ?? 0) + item.quantity,
      );
      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: qty },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: userCart.id,
            variantId: item.variantId,
            quantity: qty,
          },
        });
      }
    }
    await tx.cart.delete({ where: { id: guest.id } });
  });

  return getCartForActor({ userId });
}
