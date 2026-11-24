import { prisma } from "@/lib/prisma";
import type { Access } from "@/lib/rbac";

const SECRET = /password|secret|token|apikey|authorization|recovery|checksum/i;

export function redactAudit(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAudit);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SECRET.test(key) ? "[ẩn]" : redactAudit(item);
  }
  return out;
}

export async function recordAudit(input: {
  access?: Access;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  req?: Request;
}) {
  await prisma.adminAuditLog.create({
    data: {
      actorId: input.actorId || null,
      actorEmail: input.actorEmail || null,
      actorRoles: input.access ? (input.access.legacy ? "LEGACY_ADMIN" : input.access.roles.join(",")) : null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      beforeJson: input.before === undefined ? null : JSON.stringify(redactAudit(input.before)),
      afterJson: input.after === undefined ? null : JSON.stringify(redactAudit(input.after)),
      ipAddress: input.req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: input.req?.headers.get("user-agent") || null,
    },
  });
}
