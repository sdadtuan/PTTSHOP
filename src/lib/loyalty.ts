/** Sổ điểm. Không sửa số dư trực tiếp. Không có tỷ lệ mặc định. */

export type LoyaltyRule = {
  enabled: boolean;
  pointsPerAmount: number | null;
  amountVnd: number | null;
  earnOn: string | null;
  expireDays: number | null;
  redeemCapPerOrder: number | null;
  redeemVndPerPoint: number | null;
  referralPointsEach: number | null;
};

export const EMPTY_LOYALTY: LoyaltyRule = {
  enabled: false,
  pointsPerAmount: null,
  amountVnd: null,
  earnOn: null,
  expireDays: null,
  redeemCapPerOrder: null,
  redeemVndPerPoint: null,
  referralPointsEach: null,
};

export type LedgerRow = {
  id?: string;
  delta: number;
  reason: string;
  idempotencyKey: string;
  expiresAt?: Date | null;
};

export function loyaltyIsOpen(rule: Pick<LoyaltyRule, "enabled">) {
  return rule.enabled === true;
}

export function pointsForAmount(total: number, pointsPerAmount: number | null, amountVnd: number | null) {
  if (pointsPerAmount == null || amountVnd == null) return null;
  if (!Number.isInteger(pointsPerAmount) || pointsPerAmount <= 0) return null;
  if (!Number.isInteger(amountVnd) || amountVnd <= 0) return null;
  if (!Number.isInteger(total) || total <= 0) return 0;
  return Math.floor((total * pointsPerAmount) / amountVnd);
}

export function orderQualifies(rule: Pick<LoyaltyRule, "enabled" | "earnOn">, order: { status: string; paymentStatus: string }) {
  if (!rule.enabled || order.status === "CANCELLED") return false;
  if (rule.earnOn === "COMPLETED") return order.status === "COMPLETED";
  if (rule.earnOn === "PAID") return order.paymentStatus === "PAID";
  return false;
}

export function ledgerBalance(rows: { delta: number }[]) {
  return rows.reduce((sum, row) => sum + row.delta, 0);
}

export function planExpiry(rows: LedgerRow[], now: Date) {
  return rows.flatMap((row) => {
    if (row.reason !== "EARN" || !row.id || !row.expiresAt || row.expiresAt.getTime() > now.getTime() || row.delta <= 0) {
      return [];
    }
    const idempotencyKey = `expire:${row.id}`;
    if (rows.some((other) => other.idempotencyKey === idempotencyKey)) return [];
    return [{ idempotencyKey, delta: -row.delta, reason: "EXPIRE", expiresAt: null }];
  });
}

export function planOrderPoints(input: {
  rule: LoyaltyRule;
  order: { id: string; status: string; paymentStatus: string; total: number; refunded?: boolean };
  existing: LedgerRow[];
  now: Date;
}) {
  const earnKey = `earn:${input.order.id}`;
  const reverseKey = `reverse:${input.order.id}`;
  const earned = input.existing.find((row) => row.idempotencyKey === earnKey);
  const reversed = input.existing.some((row) => row.idempotencyKey === reverseKey);
  const entries: { idempotencyKey: string; delta: number; reason: string; expiresAt: Date | null }[] = [];
  if (!earned && orderQualifies(input.rule, input.order) && !input.order.refunded) {
    const points = pointsForAmount(input.order.total, input.rule.pointsPerAmount, input.rule.amountVnd);
    if (points && points > 0) {
      const expiresAt = input.rule.expireDays && input.rule.expireDays > 0
        ? new Date(input.now.getTime() + input.rule.expireDays * 24 * 60 * 60 * 1000)
        : null;
      entries.push({ idempotencyKey: earnKey, delta: points, reason: "EARN", expiresAt });
    }
  }
  const earnedDelta = earned?.delta ?? entries.find((row) => row.reason === "EARN")?.delta ?? 0;
  if (earned && !reversed && earnedDelta > 0 && (input.order.status === "CANCELLED" || input.order.refunded)) {
    entries.push({ idempotencyKey: reverseKey, delta: -earnedDelta, reason: "REVERSE", expiresAt: null });
  }
  return entries;
}

export function referralBlocked(input: {
  referrerUserId: string;
  referredUserId: string | null;
  referrerPhone: string | null;
  referrerEmail: string | null;
  buyerPhone: string | null;
  buyerEmail: string | null;
}) {
  if (input.referredUserId && input.referrerUserId === input.referredUserId) return "cùng tài khoản";
  const phone = (value: string | null) => (value || "").replace(/\D/g, "");
  const referrerPhone = phone(input.referrerPhone);
  const buyerPhone = phone(input.buyerPhone);
  if (referrerPhone && buyerPhone && referrerPhone === buyerPhone) return "cùng số điện thoại";
  const email = (value: string | null) => (value || "").trim().toLowerCase();
  const referrerEmail = email(input.referrerEmail);
  const buyerEmail = email(input.buyerEmail);
  if (referrerEmail && buyerEmail && referrerEmail === buyerEmail) return "cùng email";
  return null;
}

export function redeemQuote(input: {
  rule: LoyaltyRule;
  balance: number;
  requested: number;
  goodsTotal: number;
}) {
  if (!input.rule.enabled || input.requested <= 0) return { points: 0, discount: 0, error: null as string | null };
  const cap = input.rule.redeemCapPerOrder;
  const each = input.rule.redeemVndPerPoint;
  if (cap == null || each == null || cap <= 0 || each <= 0) {
    return { points: 0, discount: 0, error: "Chưa có quy tắc đổi điểm." };
  }
  if (!Number.isInteger(input.requested) || input.requested > cap) {
    return { points: 0, discount: 0, error: "Vượt trần điểm của đơn." };
  }
  if (input.requested > input.balance) return { points: 0, discount: 0, error: "Không đủ điểm." };
  const discount = input.requested * each;
  if (discount <= 0 || discount > input.goodsTotal) return { points: 0, discount: 0, error: "Điểm vượt giá trị đơn." };
  return { points: input.requested, discount, error: null };
}

export function tierForBalance(tiers: { name: string; minPoints: number; benefit: string | null }[], balance: number) {
  const sorted = [...tiers].filter((tier) => Number.isInteger(tier.minPoints) && tier.minPoints >= 0).sort((a, b) => b.minPoints - a.minPoints);
  return sorted.find((tier) => balance >= tier.minPoints) || null;
}
