import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
    const coupons = await prisma.coupon.findMany({
      orderBy: { code: "asc" },
    });
    return jsonOk({ coupons });
  } catch (err) {
    return handleApiError(err);
  }
}

const createSchema = z.object({
  code: z.string().trim().min(2).max(40),
  description: z.string().optional(),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().int().positive(),
  minOrder: z.number().int().nonnegative().default(0),
  maxUses: z.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const body = createSchema.parse(await req.json());
    const code = body.code.toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) return jsonError("Mã đã tồn tại", 409);
    const coupon = await prisma.coupon.create({
      data: {
        code,
        description: body.description,
        discountType: body.discountType,
        discountValue: body.discountValue,
        minOrder: body.minOrder,
        maxUses: body.maxUses ?? null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        isActive: body.isActive,
      },
    });
    return jsonOk({ coupon }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  maxUses: z.number().int().positive().optional().nullable(),
  minOrder: z.number().int().nonnegative().optional(),
  discountValue: z.number().int().positive().optional(),
});

export async function PATCH(req: Request) {
  try {
    await enforceAdmin(req);
    const body = patchSchema.parse(await req.json());
    const { id, ...data } = body;
    const coupon = await prisma.coupon.update({ where: { id }, data });
    return jsonOk({ coupon });
  } catch (err) {
    return handleApiError(err);
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  try {
    await enforceAdmin(req);
    const { id } = deleteSchema.parse(await req.json());
    await prisma.coupon.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
