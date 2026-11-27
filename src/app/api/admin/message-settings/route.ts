import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { reminderLimits } from "@/lib/notify/policy";
import { prisma } from "@/lib/prisma";

const emptyNumber = z.union([z.number().int(), z.null()]).optional();

const bodySchema = z.object({
  znsEnabled: z.boolean(),
  cartReminderEnabled: z.boolean(),
  reminderAfterHours: emptyNumber,
  reminderMaxTimes: emptyNumber,
});

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const row = await prisma.messageSettings.findUnique({ where: { id: "default" } });
    return jsonOk({
      znsEnabled: row?.znsEnabled === true,
      cartReminderEnabled: row?.cartReminderEnabled === true,
      reminderAfterHours: row?.reminderAfterHours ?? null,
      reminderMaxTimes: row?.reminderMaxTimes ?? null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    const limits = reminderLimits(body.reminderAfterHours ?? null, body.reminderMaxTimes ?? null);
    const row = await prisma.messageSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        znsEnabled: body.znsEnabled,
        cartReminderEnabled: body.cartReminderEnabled,
        ...limits,
      },
      update: {
        znsEnabled: body.znsEnabled,
        cartReminderEnabled: body.cartReminderEnabled,
        ...limits,
      },
    });
    return jsonOk({
      znsEnabled: row.znsEnabled,
      cartReminderEnabled: row.cartReminderEnabled,
      reminderAfterHours: row.reminderAfterHours,
      reminderMaxTimes: row.reminderMaxTimes,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
