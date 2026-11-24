import type { PrismaClient } from "@prisma/client";
import { DEFAULT_EMAIL_TEMPLATES, isBelowFloor, renderTemplate } from "@/lib/ops/email-templates";

type Db = PrismaClient;

export function emailBlockReason(provider: string, env: Record<string, string | undefined>) {
  if (provider === "DISABLED" || provider === "SANDBOX_MOCK") return null;
  if (provider === "SMTP" && !env.EMAIL_SMTP_HOST?.trim()) return "Thiếu EMAIL_SMTP_HOST. Không gửi email thật.";
  if (provider === "RESEND" && !env.RESEND_API_KEY?.trim()) return "Thiếu RESEND_API_KEY. Không gửi email thật.";
  return null;
}

export async function ensureEmailTemplates(db: Db) {
  for (const template of DEFAULT_EMAIL_TEMPLATES) {
    await db.emailTemplate.upsert({
      where: { key: template.key },
      create: template,
      update: {},
    });
  }
}

export async function queueEmail(db: Db, input: {
  templateKey: string;
  to: string;
  vars: Record<string, string | number | null | undefined>;
  provider?: string;
  env?: Record<string, string | undefined>;
}) {
  await ensureEmailTemplates(db);
  const settings = await db.emailSettings.findUnique({ where: { id: "default" } });
  const provider = input.provider || settings?.provider || "DISABLED";
  const template = await db.emailTemplate.findUniqueOrThrow({ where: { key: input.templateKey } });
  const block = emailBlockReason(provider, input.env || {});
  const status = provider === "DISABLED" ? "SKIPPED_DISABLED" : block ? "SKIPPED_DISABLED" : "QUEUED";
  return db.emailOutbox.create({
    data: {
      templateKey: template.key,
      toAddress: input.to,
      subject: renderTemplate(template.subject, input.vars),
      body: renderTemplate(template.body, input.vars),
      status,
      lastError: block,
    },
  });
}

export async function queueBelowFloor(db: Db, variants: Array<{ sku: string; price: number; floorPrice: number | null }>, to: string) {
  const hits = variants.filter((row) => isBelowFloor(row.price, row.floorPrice));
  const queued = [];
  for (const row of hits) {
    queued.push(await queueEmail(db, {
      templateKey: "INTERNAL_BELOW_FLOOR",
      to,
      vars: row,
      provider: "SANDBOX_MOCK",
    }));
  }
  return queued;
}
