import type { PrismaClient } from "@prisma/client";
import { maskEmail, maskPhone } from "@/lib/notify/policy";

type Db = PrismaClient;

/** Ghi log, không gọi Zalo hay email. Lỗi log không được ném ra ngoài. */
export async function recordOrderNotice(
  db: Db,
  input: { orderId: string; status: string; phone: string; email?: string | null },
) {
  try {
    const settings = await db.messageSettings.findUnique({ where: { id: "default" } });
    await db.notificationLog.create({
      data: {
        orderId: input.orderId,
        channel: "ZNS",
        template: input.status,
        status: settings?.znsEnabled ? "DRY_RUN" : "SKIPPED",
        phoneMask: maskPhone(input.phone),
        emailMask: input.email ? maskEmail(input.email) : null,
        detail: "dry-run",
      },
    });
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
}
