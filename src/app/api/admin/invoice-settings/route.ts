import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { loadInvoiceConfig } from "@/lib/invoices/service";
import { invoiceBlockReason } from "@/lib/invoices/settings";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  provider: z.enum(["DISABLED", "SANDBOX_MOCK", "VIETTEL_SINVOICE", "MISA_MEINVOICE"]),
  autoIssueEnabled: z.boolean(),
  issueTrigger: z.enum(["ON_DELIVERED", "ON_PAID"]),
  templateCode: z.string().trim().max(40).optional(),
  invoiceSeries: z.string().trim().max(40).optional(),
  vatRate: z.union([z.literal(0), z.literal(8), z.literal(10)]),
  sellerName: z.string().trim().max(200).optional(),
  sellerTaxCode: z.string().trim().max(20).optional(),
  sellerAddress: z.string().trim().max(300).optional(),
  maxRetries: z.number().int().min(1).max(20),
  retryBaseMinutes: z.number().int().min(1).max(1440),
});

export async function GET() {
  try {
    await requireAdmin();
    const settings = await loadInvoiceConfig(prisma);
    return jsonOk({ settings, blockReason: invoiceBlockReason(settings, process.env) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = bodySchema.parse(await req.json());
    await prisma.invoiceSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...body, templateCode: body.templateCode || null, invoiceSeries: body.invoiceSeries || null },
      update: { ...body, templateCode: body.templateCode || null, invoiceSeries: body.invoiceSeries || null },
    });
    const settings = await loadInvoiceConfig(prisma);
    return jsonOk({ settings, blockReason: invoiceBlockReason(settings, process.env) });
  } catch (err) {
    return handleApiError(err);
  }
}
