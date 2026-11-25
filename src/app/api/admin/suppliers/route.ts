import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { ensureDemoSupplier } from "@/lib/dropship/service";
import { enforceAdmin } from "@/lib/rbac-access";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  demo: z.boolean().optional(),
  code: z.string().trim().min(2).max(40).optional(),
  name: z.string().trim().min(2).max(160).optional(),
  taxCode: z.string().trim().max(20).optional(),
  contactName: z.string().trim().max(80).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(240).optional(),
  connectionType: z.enum(["FILE", "GOOGLE_SHEET", "MANUAL", "API_STUB"]).optional(),
  sheetUrl: z.string().trim().max(400).optional(),
  slaHours: z.number().int().positive().max(240).optional(),
  warnHours: z.number().int().positive().max(240).optional(),
  contractRef: z.string().trim().max(80).optional(),
  imageLicense: z.enum(["NONE", "WRITTEN", "OWN_PHOTOS"]).optional(),
  imageLicenseNote: z.string().max(400).optional(),
  paysReturnFee: z.boolean().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await enforceAdmin(req);
    const showCost = can(session.access, "suppliers.cost");
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" },
      include: { skus: { select: { id: true, supplierSku: true, costPrice: true, supplierStock: true, priority: true, variantId: true } } },
    });
    return jsonOk({
      suppliers: suppliers.map((supplier) => ({
        ...supplier,
        skus: supplier.skus.map((sku) => ({ ...sku, costPrice: showCost ? sku.costPrice : null })),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    if (body.demo) {
      const supplier = await ensureDemoSupplier(prisma, process.env.DATABASE_URL || "");
      return jsonOk({ supplier });
    }
    if (!body.code || !body.name || !body.connectionType) {
      return jsonOk({ error: "Thiếu mã, tên hoặc kiểu kết nối" });
    }
    const supplier = await prisma.supplier.create({
      data: {
        code: body.code,
        name: body.name,
        taxCode: body.taxCode || null,
        contactName: body.contactName || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        connectionType: body.connectionType,
        sheetUrl: body.sheetUrl || null,
        slaHours: body.slaHours ?? 48,
        warnHours: body.warnHours ?? 24,
        contractRef: body.contractRef || null,
        imageLicense: body.imageLicense || "NONE",
        imageLicenseNote: body.imageLicenseNote || null,
        paysReturnFee: body.paysReturnFee ?? null,
        isActive: body.isActive ?? true,
      },
    });
    return jsonOk({ supplier });
  } catch (err) {
    return handleApiError(err);
  }
}
