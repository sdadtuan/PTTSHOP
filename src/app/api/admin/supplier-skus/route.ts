import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  supplierId: z.string().min(1),
  variantId: z.string().min(1),
  supplierSku: z.string().trim().min(1).max(80),
  priority: z.number().int().positive(),
  costPrice: z.number().int().nonnegative(),
  supplierStock: z.number().int().nonnegative(),
  safetyStock: z.number().int().nonnegative().optional(),
});

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    const row = await prisma.supplierSku.upsert({
      where: { supplierId_variantId: { supplierId: body.supplierId, variantId: body.variantId } },
      update: {
        supplierSku: body.supplierSku,
        priority: body.priority,
        costPrice: body.costPrice,
        supplierStock: body.supplierStock,
        safetyStock: body.safetyStock ?? 2,
        stockUpdatedAt: new Date(),
      },
      create: {
        supplierId: body.supplierId,
        variantId: body.variantId,
        supplierSku: body.supplierSku,
        priority: body.priority,
        costPrice: body.costPrice,
        supplierStock: body.supplierStock,
        safetyStock: body.safetyStock ?? 2,
        stockUpdatedAt: new Date(),
      },
    });
    return jsonOk({ sku: row });
  } catch (err) {
    return handleApiError(err);
  }
}
