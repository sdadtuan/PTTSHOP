import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { emailBlockReason, ensureEmailTemplates, queueEmail } from "@/lib/ops/email-queue";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  action: z.enum(["queue", "settings", "retry", "template"]).optional(),
  templateKey: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  to: z.string().optional(),
  vars: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  provider: z.enum(["DISABLED", "SANDBOX_MOCK", "SMTP", "RESEND"]).optional(),
  internalAlertEmails: z.string().optional(),
  outboxId: z.string().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    await ensureEmailTemplates(prisma);
    const [settings, templates, outbox] = await Promise.all([
      prisma.emailSettings.findUnique({ where: { id: "default" } }),
      prisma.emailTemplate.findMany({ orderBy: { key: "asc" } }),
      prisma.emailOutbox.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    ]);
    const provider = settings?.provider || "DISABLED";
    return jsonOk({ provider, templates, outbox, blockReason: emailBlockReason(provider, process.env), internalAlertEmails: settings?.internalAlertEmails || "" });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = bodySchema.parse(await req.json());
    if (body.action === "settings" && body.provider) {
      await prisma.emailSettings.upsert({
        where: { id: "default" },
        create: { id: "default", provider: body.provider, internalAlertEmails: body.internalAlertEmails || null },
        update: { provider: body.provider, internalAlertEmails: body.internalAlertEmails || null },
      });
      return jsonOk({ provider: body.provider, blockReason: emailBlockReason(body.provider, process.env) });
    }
    if (body.action === "template" && body.templateKey && body.subject && body.body) {
      await ensureEmailTemplates(prisma);
      const template = await prisma.emailTemplate.update({
        where: { key: body.templateKey },
        data: { subject: body.subject, body: body.body },
      });
      return jsonOk({ template });
    }
    if (body.action === "retry" && body.outboxId) {
      const row = await prisma.emailOutbox.findUnique({ where: { id: body.outboxId } });
      if (!row) throw new Error("Không tìm thấy thư.");
      const settings = await prisma.emailSettings.findUnique({ where: { id: "default" } });
      const provider = settings?.provider || "DISABLED";
      const block = emailBlockReason(provider, process.env);
      const updated = await prisma.emailOutbox.update({
        where: { id: row.id },
        data: { status: provider === "DISABLED" || block ? "SKIPPED_DISABLED" : "QUEUED", lastError: block, retryCount: row.retryCount + 1 },
      });
      return jsonOk({ message: updated });
    }
    if (!body.templateKey || !body.to) throw new Error("Thiếu mẫu hoặc người nhận.");
    const message = await queueEmail(prisma, { templateKey: body.templateKey, to: body.to, vars: body.vars || {} });
    return jsonOk({ message });
  } catch (err) {
    return handleApiError(err);
  }
}
