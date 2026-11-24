import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { recordAudit } from "@/lib/admin-audit";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";
import { ghnEnv } from "@/lib/shipping/ghn";
import { getShippingConfig } from "@/lib/shipping/service";

const putSchema = z.object({
  freeShipThreshold: z.number().int().positive().max(100_000_000),
  fallbackFee: z.number().int().min(0).max(10_000_000),
  intraProvinceFee: z.number().int().min(0).max(10_000_000).nullable(),
  interProvinceFee: z.number().int().min(0).max(10_000_000).nullable(),
  parcelWeightGrams: z.number().int().positive().max(50_000),
  warehouseProvinceCode: z.string().trim().max(2),
  warehouseWardCode: z.string().trim().max(8),
  warehouseAddress: z.string().trim().max(200),
  senderName: z.string().trim().max(80),
  senderPhone: z.string().trim().max(20),
  defaultProvider: z.enum(["MANUAL", "GHN", "GHTK"]),
});

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
    const config = await getShippingConfig(prisma);
    const ghn = ghnEnv();
    return jsonOk({
      ...config,
      ghnEnabled: ghn.enabled,
      ghnWebhookEnabled: ghn.webhookEnabled,
      ghtkEnabled: Boolean(process.env.GHTK_TOKEN?.trim()),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await enforceAdmin(req);
    const body = putSchema.parse(await req.json());
    await prisma.shippingSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ...body,
        warehouseProvinceCode: body.warehouseProvinceCode || null,
        warehouseWardCode: body.warehouseWardCode || null,
        warehouseAddress: body.warehouseAddress || null,
        senderName: body.senderName || null,
        senderPhone: body.senderPhone || null,
      },
      update: {
        ...body,
        warehouseProvinceCode: body.warehouseProvinceCode || null,
        warehouseWardCode: body.warehouseWardCode || null,
        warehouseAddress: body.warehouseAddress || null,
        senderName: body.senderName || null,
        senderPhone: body.senderPhone || null,
      },
    });
    await recordAudit({ access: session.access, actorId: session.user.id, actorEmail: session.user.email, action: "SHIPPING_SETTINGS", entityType: "ShippingSettings", entityId: "default", after: { defaultProvider: body.defaultProvider, freeShipThreshold: body.freeShipThreshold }, req });
    return jsonOk({ config: await getShippingConfig(prisma) });
  } catch (err) {
    return handleApiError(err);
  }
}
