import type { Coupon, PrismaClient } from "@prisma/client";
import { ApiError } from "@/lib/api";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export function computeCouponDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.discountType === "PERCENT") {
    return Math.floor((subtotal * coupon.discountValue) / 100);
  }
  if (coupon.discountType === "FIXED") {
    return Math.min(subtotal, coupon.discountValue);
  }
  return 0;
}

export async function findValidCoupon(
  db: Tx | PrismaClient,
  code: string,
  subtotal: number,
): Promise<Coupon> {
  const coupon = await db.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!coupon || !coupon.isActive) {
    throw new ApiError("Mã giảm giá không hợp lệ", 400);
  }
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new ApiError("Mã giảm giá chưa có hiệu lực", 400);
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    throw new ApiError("Mã giảm giá đã hết hạn", 400);
  }
  if (subtotal < coupon.minOrder) {
    throw new ApiError(
      `Đơn tối thiểu ${coupon.minOrder.toLocaleString("vi-VN")}đ để dùng mã này`,
      400,
    );
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    throw new ApiError("Mã giảm giá đã hết lượt dùng", 400);
  }
  return coupon;
}

/** Atomically bump usedCount if still under maxUses. */
export async function consumeCoupon(
  db: Tx,
  coupon: Coupon,
): Promise<void> {
  if (coupon.maxUses == null) {
    await db.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });
    return;
  }
  const updated = await db.coupon.updateMany({
    where: {
      id: coupon.id,
      usedCount: { lt: coupon.maxUses },
      isActive: true,
    },
    data: { usedCount: { increment: 1 } },
  });
  if (updated.count === 0) {
    throw new ApiError("Mã giảm giá đã hết lượt dùng", 400);
  }
}
