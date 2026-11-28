import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(["", "mock"]),
  sessionTokenBudget: z.number().int().positive().nullable().optional(),
  dailyTokenBudget: z.number().int().positive().nullable().optional(),
});

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const row = await prisma.chatSettings.findUnique({ where: { id: "default" } });
    return jsonOk({
      enabled: row?.enabled === true,
      provider: row?.provider === "mock" ? "mock" : "",
      sessionTokenBudget: row?.sessionTokenBudget ?? null,
      dailyTokenBudget: row?.dailyTokenBudget ?? null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    const row = await prisma.chatSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        enabled: body.enabled,
        provider: body.provider,
        sessionTokenBudget: body.sessionTokenBudget ?? null,
        dailyTokenBudget: body.dailyTokenBudget ?? null,
      },
      update: {
        enabled: body.enabled,
        provider: body.provider,
        sessionTokenBudget: body.sessionTokenBudget ?? null,
        dailyTokenBudget: body.dailyTokenBudget ?? null,
      },
    });
    return jsonOk({ enabled: row.enabled, provider: row.provider });
  } catch (err) {
    return handleApiError(err);
  }
}
