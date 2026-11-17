import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  id: z.string().min(1),
  price: z.number().int().positive().optional(),
  compareAt: z.number().int().positive().optional().nullable(),
  stock: z.number().int().nonnegative().optional(),
});

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = patchSchema.parse(await req.json());
    const { id, ...data } = body;
    const variant = await prisma.productVariant.update({
      where: { id },
      data,
    });
    return jsonOk({ variant });
  } catch (err) {
    return handleApiError(err);
  }
}
