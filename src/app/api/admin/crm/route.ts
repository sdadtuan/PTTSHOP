import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { recordAudit } from "@/lib/admin-audit";
import { enforceAdmin } from "@/lib/rbac-access";
import { SandboxCrm, attemptCrm, crmBlockReason, enqueueCrm } from "@/lib/ops/crm";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  action: z.enum(["enqueue", "retry", "settings"]),
  phone: z.string().optional(),
  kind: z.string().optional(),
  jobId: z.string().optional(),
  provider: z.enum(["DISABLED", "SANDBOX_MOCK", "RS_PTTADS"]).optional(),
});

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
    const settings = await prisma.crmSettings.findUnique({ where: { id: "default" } });
    const provider = settings?.provider || "DISABLED";
    const jobs = await prisma.crmSyncJob.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    return jsonOk({ provider, jobs, blockReason: crmBlockReason(provider, process.env) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    if (body.action === "settings" && body.provider) {
      await prisma.crmSettings.upsert({
        where: { id: "default" },
        create: { id: "default", provider: body.provider },
        update: { provider: body.provider },
      });
      await recordAudit({ access: session.access, actorId: session.user.id, actorEmail: session.user.email, action: "CRM_SETTINGS", entityType: "CrmSettings", entityId: "default", after: { provider: body.provider }, req });
      return jsonOk({ provider: body.provider, blockReason: crmBlockReason(body.provider, process.env) });
    }
    if (body.action === "retry" && body.jobId) {
      const settings = await prisma.crmSettings.findUnique({ where: { id: "default" } });
      const job = await attemptCrm(prisma, body.jobId, new SandboxCrm(), process.env, settings?.provider || "DISABLED");
      return jsonOk({ job });
    }
    if (!body.phone) throw new Error("Thiếu số điện thoại.");
    const job = await enqueueCrm(prisma, { phone: body.phone, kind: body.kind || "CUSTOMER", payload: { phone: body.phone } });
    return jsonOk({ job });
  } catch (err) {
    return handleApiError(err);
  }
}
