import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { recordSupplierDebit } from "@/lib/dropship/service";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  supplierId: z.string().min(1),
  supplierOrderId: z.string().optional(),
  returnRequestId: z.string().optional(),
  amount: z.number().int().positive(),
  reason: z.string().trim().min(2).max(200),
});

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const debits = await prisma.supplierDebit.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    return jsonOk({ debits });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    const debit = await recordSupplierDebit(prisma, body);
    return jsonOk({ debit });
  } catch (err) {
    return handleApiError(err);
  }
}
