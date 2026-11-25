import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { DEFAULT_FLOOR_PARAMS } from "@/lib/dropship/floor";
import { loadFloorParams } from "@/lib/dropship/service";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  manualFloor: z.number().int().nonnegative().nullable(),
  marginBps: z.number().int().min(0).max(9000),
  returnBps: z.number().int().min(0).max(9000),
  adsBps: z.number().int().min(0).max(9000),
  feeBps: z.number().int().min(0).max(9000),
  vatBps: z.number().int().min(0).max(9000),
  shippingCost: z.number().int().nonnegative(),
  paymentCost: z.number().int().nonnegative(),
  fixedCost: z.number().int().nonnegative(),
});

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    return jsonOk({ settings: await loadFloorParams(prisma) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    const settings = await prisma.floorSettings.upsert({
      where: { id: "default" },
      update: body,
      create: { id: "default", ...DEFAULT_FLOOR_PARAMS, ...body },
    });
    return jsonOk({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}
