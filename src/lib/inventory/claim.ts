import type { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api";

/** Trừ tồn kho riêng chỉ khi còn đủ. Hai giao dịch song song không bán quá tồn. */
export async function claimWarehouseStock(
  tx: Prisma.TransactionClient,
  variantId: string,
  quantity: number,
) {
  if (quantity <= 0) return;
  const updated = await tx.productVariant.updateMany({
    where: { id: variantId, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } },
  });
  if (updated.count === 0) {
    throw new ApiError("Không đủ tồn kho", 400);
  }
}
