import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { recordAudit } from "@/lib/admin-audit";
import { assertScope, enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  id: z.string().min(1),
  price: z.number().int().positive().optional(),
  compareAt: z.number().int().positive().optional().nullable(),
  stock: z.number().int().nonnegative().optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await enforceAdmin(req);
    const body = patchSchema.parse(await req.json());
    if (body.price != null || body.compareAt !== undefined) assertScope(session.access, ["products.write", "pricing.write"]);
    if (body.stock != null) assertScope(session.access, ["products.write", "shipping.write"]);
    const { id, ...data } = body;
    const before = await prisma.productVariant.findUnique({ where: { id }, select: { price: true, compareAt: true, stock: true, costPrice: true } });
    const variant = await prisma.productVariant.update({
      where: { id },
      data,
    });
    await recordAudit({ access: session.access, actorId: session.user.id, actorEmail: session.user.email, action: "VARIANT_PRICE_STOCK", entityType: "ProductVariant", entityId: id, before, after: data, req });
    return jsonOk({ variant });
  } catch (err) {
    return handleApiError(err);
  }
}
