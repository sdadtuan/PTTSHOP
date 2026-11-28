import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

const nullableInt = z.number().int().positive().nullable();

const bodySchema = z.object({
  enabled: z.boolean(),
  pointsPerAmount: nullableInt,
  amountVnd: nullableInt,
  earnOn: z.enum(["COMPLETED", "PAID"]).nullable(),
  expireDays: nullableInt,
  redeemCapPerOrder: nullableInt,
  redeemVndPerPoint: nullableInt,
  referralPointsEach: nullableInt,
  tiers: z.array(z.object({
    name: z.string().trim().min(1).max(80),
    minPoints: z.number().int().min(0),
    benefit: z.string().trim().max(200).nullable().optional(),
  })).max(8).optional(),
});

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const [settings, tiers] = await Promise.all([
      prisma.loyaltySettings.findUnique({ where: { id: "default" } }),
      prisma.loyaltyTier.findMany({ orderBy: { position: "asc" } }),
    ]);
    return jsonOk({
      settings: {
        enabled: settings?.enabled === true,
        pointsPerAmount: settings?.pointsPerAmount ?? null,
        amountVnd: settings?.amountVnd ?? null,
        earnOn: settings?.earnOn ?? null,
        expireDays: settings?.expireDays ?? null,
        redeemCapPerOrder: settings?.redeemCapPerOrder ?? null,
        redeemVndPerPoint: settings?.redeemVndPerPoint ?? null,
        referralPointsEach: settings?.referralPointsEach ?? null,
      },
      tiers: tiers.map((tier) => ({ name: tier.name, minPoints: tier.minPoints, benefit: tier.benefit })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    const settings = {
      enabled: body.enabled,
      pointsPerAmount: body.pointsPerAmount,
      amountVnd: body.amountVnd,
      earnOn: body.earnOn,
      expireDays: body.expireDays,
      redeemCapPerOrder: body.redeemCapPerOrder,
      redeemVndPerPoint: body.redeemVndPerPoint,
      referralPointsEach: body.referralPointsEach,
    };
    await prisma.loyaltySettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...settings },
      update: {
        enabled: body.enabled,
        pointsPerAmount: body.pointsPerAmount,
        amountVnd: body.amountVnd,
        earnOn: body.earnOn,
        expireDays: body.expireDays,
        redeemCapPerOrder: body.redeemCapPerOrder,
        redeemVndPerPoint: body.redeemVndPerPoint,
        referralPointsEach: body.referralPointsEach,
      },
    });
    if (body.tiers) {
      await prisma.loyaltyTier.deleteMany();
      if (body.tiers.length) {
        await prisma.loyaltyTier.createMany({
          data: body.tiers.map((tier, position) => ({
            name: tier.name,
            minPoints: tier.minPoints,
            benefit: tier.benefit || null,
            position,
          })),
        });
      }
    }
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
