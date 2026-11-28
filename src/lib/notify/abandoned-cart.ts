import type { PrismaClient } from "@prisma/client";
import { maskEmail, maskPhone, reminderDecision } from "@/lib/notify/policy";

type Db = PrismaClient;

export async function runAbandonedCartDry(db: Db, now = new Date()) {
  const settings = await db.messageSettings.findUnique({ where: { id: "default" } });
  const carts = await db.cart.findMany({
    include: {
      user: { select: { id: true, phone: true, email: true } },
      items: { include: { variant: { select: { stock: true } } } },
    },
  });
  const counts = { dryRun: 0, skipped: 0 };
  for (const cart of carts) {
    const sentCount = await db.notificationLog.count({ where: { cartId: cart.id, channel: "CART" } });
    const ordered = cart.user
      ? (await db.order.count({
          where: { userId: cart.user.id, status: { not: "CANCELLED" }, createdAt: { gt: cart.updatedAt } },
        })) > 0
      : false;
    const consent = cart.user
      ? await db.consent.findFirst({
          where: { userId: cart.user.id, purpose: "marketing", granted: true },
          select: { id: true },
        })
      : null;
    const decision = reminderDecision({
      enabled: settings?.cartReminderEnabled === true,
      afterHours: settings?.reminderAfterHours ?? null,
      maxTimes: settings?.reminderMaxTimes ?? null,
      ageHours: (now.getTime() - cart.updatedAt.getTime()) / 3_600_000,
      sentCount,
      marketingOptIn: Boolean(consent),
      ordered,
      inStock: cart.items.some((item) => item.variant.stock > 0),
    });
    if (decision !== "dry_run") {
      counts.skipped += 1;
      continue;
    }
    await db.notificationLog.create({
      data: {
        cartId: cart.id,
        channel: "CART",
        template: "abandoned",
        status: "DRY_RUN",
        phoneMask: cart.user?.phone ? maskPhone(cart.user.phone) : null,
        emailMask: cart.user?.email ? maskEmail(cart.user.email) : null,
        detail: "opt-out:/yeu-cau-du-lieu",
      },
    });
    counts.dryRun += 1;
  }
  return counts;
}
