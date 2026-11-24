import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { recordAudit } from "@/lib/admin-audit";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(120),
  floorPrice: z.number().int().nonnegative().nullable().optional(),
  note: z.string().max(300).optional(),
});

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
    const [rules, variants] = await Promise.all([
      prisma.pricingRule.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.productVariant.findMany({
        select: { id: true, sku: true, price: true, costPrice: true, product: { select: { name: true } } },
        orderBy: { sku: "asc" },
        take: 100,
      }),
    ]);
    return jsonOk({ rules, variants });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    const before = body.id ? await prisma.pricingRule.findUnique({ where: { id: body.id } }) : null;
    const rule = body.id
      ? await prisma.pricingRule.update({ where: { id: body.id }, data: { name: body.name, floorPrice: body.floorPrice ?? null, note: body.note || null } })
      : await prisma.pricingRule.create({ data: { name: body.name, floorPrice: body.floorPrice ?? null, note: body.note || null } });
    await recordAudit({
      access: session.access,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "PRICING_RULE",
      entityType: "PricingRule",
      entityId: rule.id,
      before,
      after: { name: rule.name, floorPrice: rule.floorPrice },
      req,
    });
    return jsonOk({ rule });
  } catch (err) {
    return handleApiError(err);
  }
}
