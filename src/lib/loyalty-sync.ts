import { randomBytes } from "crypto";
import { ledgerBalance, loyaltyIsOpen, orderQualifies, planExpiry, planOrderPoints, referralBlocked, type LoyaltyRule } from "@/lib/loyalty";
import { prisma } from "@/lib/prisma";

export async function loadLoyaltyRule(): Promise<LoyaltyRule> {
  try {
    const row = await prisma.loyaltySettings.findUnique({ where: { id: "default" } });
    if (!row) {
      return {
        enabled: false,
        pointsPerAmount: null,
        amountVnd: null,
        earnOn: null,
        expireDays: null,
        redeemCapPerOrder: null,
        redeemVndPerPoint: null,
        referralPointsEach: null,
      };
    }
    return row;
  } catch {
    return {
      enabled: false,
      pointsPerAmount: null,
      amountVnd: null,
      earnOn: null,
      expireDays: null,
      redeemCapPerOrder: null,
      redeemVndPerPoint: null,
      referralPointsEach: null,
    };
  }
}

async function accountFor(userId: string) {
  const existing = await prisma.loyaltyAccount.findUnique({ where: { userId } });
  if (existing) return existing;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.loyaltyAccount.create({
        data: { userId, referralCode: randomBytes(4).toString("hex") },
      });
    } catch {
      const again = await prisma.loyaltyAccount.findUnique({ where: { userId } });
      if (again) return again;
    }
  }
  return null;
}

async function writeEntries(accountId: string, orderId: string | null, entries: { idempotencyKey: string; delta: number; reason: string; expiresAt: Date | null }[]) {
  for (const entry of entries) {
    try {
      await prisma.loyaltyLedger.create({
        data: { accountId, orderId, delta: entry.delta, reason: entry.reason, idempotencyKey: entry.idempotencyKey, expiresAt: entry.expiresAt },
      });
    } catch {
      // Khóa idempotency đã có. Không cộng lần hai.
    }
  }
}

/** Không ném lỗi ra ngoài. Điểm lỗi không đổi trạng thái đơn. */
export async function syncOrderLoyalty(orderId: string) {
  try {
    const rule = await loadLoyaltyRule();
    if (!loyaltyIsOpen(rule)) return;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.userId) return;
    const account = await accountFor(order.userId);
    if (!account) return;
    const refunded = (await prisma.refundRequest.count({ where: { orderId, status: "COMPLETED" } })) > 0;
    const existing = await prisma.loyaltyLedger.findMany({ where: { accountId: account.id } });
    const now = new Date();
    await writeEntries(account.id, order.id, planOrderPoints({
      rule,
      order: { id: order.id, status: order.status, paymentStatus: order.paymentStatus, total: order.total, refunded },
      existing,
      now,
    }));
    const after = await prisma.loyaltyLedger.findMany({ where: { accountId: account.id } });
    await writeEntries(account.id, null, planExpiry(after, now));
    await rewardReferral(rule, order, account.userId);
  } catch {
    return;
  }
}

async function rewardReferral(rule: LoyaltyRule, order: { id: string; userId: string | null; referralCode: string | null; status: string; paymentStatus: string; customerPhone: string; customerEmail: string | null }, buyerId: string) {
  if (!order.referralCode || !orderQualifies(rule, order)) return;
  const points = rule.referralPointsEach;
  if (points == null || points <= 0) return;
  const referrer = await prisma.loyaltyAccount.findUnique({
    where: { referralCode: order.referralCode },
    include: { user: { select: { id: true, phone: true, email: true } } },
  });
  if (!referrer) return;
  const buyer = await prisma.user.findUnique({ where: { id: buyerId }, select: { id: true, phone: true, email: true } });
  const blocked = referralBlocked({
    referrerUserId: referrer.userId,
    referredUserId: buyer?.id || null,
    referrerPhone: referrer.user.phone,
    referrerEmail: referrer.user.email,
    buyerPhone: buyer?.phone || order.customerPhone,
    buyerEmail: buyer?.email || order.customerEmail,
  });
  if (blocked) return;
  const prior = await prisma.referral.findUnique({ where: { referredUserId: buyerId } });
  if (prior) return;
  try {
    await prisma.referral.create({ data: { referrerUserId: referrer.userId, referredUserId: buyerId, orderId: order.id } });
  } catch {
    return;
  }
  await writeEntries(referrer.id, order.id, [{ idempotencyKey: `referral:out:${order.id}`, delta: points, reason: "REFERRAL", expiresAt: null }]);
  const buyerAccount = await accountFor(buyerId);
  if (buyerAccount) {
    await writeEntries(buyerAccount.id, order.id, [{ idempotencyKey: `referral:in:${order.id}`, delta: points, reason: "REFERRAL", expiresAt: null }]);
  }
}

export async function loyaltyView(userId: string) {
  const rule = await loadLoyaltyRule();
  if (!loyaltyIsOpen(rule)) return null;
  const account = await accountFor(userId);
  if (!account) return null;
  const [entries, tiers] = await Promise.all([
    prisma.loyaltyLedger.findMany({ where: { accountId: account.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.loyaltyTier.findMany({ orderBy: { minPoints: "desc" } }),
  ]);
  const now = new Date();
  await writeEntries(account.id, null, planExpiry(entries, now));
  const fresh = await prisma.loyaltyLedger.findMany({ where: { accountId: account.id }, orderBy: { createdAt: "desc" }, take: 30 });
  const balance = ledgerBalance(fresh);
  const tier = [...tiers].sort((a, b) => b.minPoints - a.minPoints).find((item) => balance >= item.minPoints) || null;
  return {
    balance,
    referralCode: account.referralCode,
    tier: tier ? { name: tier.name, benefit: tier.benefit } : null,
    hasRule: rule.pointsPerAmount != null && rule.amountVnd != null,
    entries: fresh.map((entry) => ({ id: entry.id, delta: entry.delta, reason: entry.reason, createdAt: entry.createdAt.toISOString() })),
  };
}
