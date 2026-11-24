import { Prisma, type PrismaClient } from "@prisma/client";
import { phoneDedupKey } from "@/lib/ops/phone";
import { nextRetryAt } from "@/lib/invoices/retry";

type Db = PrismaClient;

export type CrmEnv = Record<string, string | undefined>;

export function crmBlockReason(provider: string, env: CrmEnv) {
  if (provider === "DISABLED") return "Đồng bộ CRM đang tắt.";
  if (provider === "SANDBOX_MOCK") return null;
  if (!env.CRM_RS_BASE_URL?.trim() || !env.CRM_RS_API_KEY?.trim()) {
    return "Thiếu CRM_RS_BASE_URL hoặc CRM_RS_API_KEY. Không gọi rs.pttads.vn.";
  }
  return "Chưa có tài liệu API rs.pttads.vn. Không gọi mạng.";
}

export class SandboxCrm {
  failRemaining: number;
  calls = 0;
  constructor(failRemaining = 0) {
    this.failRemaining = failRemaining;
  }
  async push() {
    this.calls += 1;
    if (this.failRemaining > 0) {
      this.failRemaining -= 1;
      return { ok: false as const, temporary: true, error: "Lỗi mạng CRM giả lập" };
    }
    return { ok: true as const };
  }
}

function isUnique(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function enqueueCrm(db: Db, input: { phone: string; kind: string; payload: Record<string, unknown> }) {
  const dedupKey = `${input.kind}:${phoneDedupKey(input.phone)}`;
  try {
    return await db.crmSyncJob.create({
      data: { dedupKey, kind: input.kind, payloadJson: JSON.stringify(input.payload), status: "PENDING" },
    });
  } catch (err) {
    if (!isUnique(err)) throw err;
    return db.crmSyncJob.findUniqueOrThrow({ where: { dedupKey } });
  }
}

export async function attemptCrm(db: Db, jobId: string, client: SandboxCrm, env: CrmEnv, provider = "SANDBOX_MOCK", now = new Date()) {
  const settings = await db.crmSettings.findUnique({ where: { id: "default" } });
  const active = settings?.provider || provider;
  const block = crmBlockReason(active, env);
  const job = await db.crmSyncJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Không tìm thấy việc đồng bộ.");
  if (job.status === "SENT") return job;
  if (block) {
    return db.crmSyncJob.update({ where: { id: job.id }, data: { lastError: block, status: "PENDING" } });
  }
  const result = await client.push();
  if (result.ok) return db.crmSyncJob.update({ where: { id: job.id }, data: { status: "SENT", lastError: null } });
  const retryCount = job.retryCount + 1;
  const max = job.maxRetries;
  const failed = retryCount >= max;
  return db.crmSyncJob.update({
    where: { id: job.id },
    data: {
      status: failed ? "FAILED" : "RETRYING",
      retryCount,
      lastError: result.error,
      nextRetryAt: failed ? null : nextRetryAt(now, retryCount, settings?.retryBaseMinutes || 15),
    },
  });
}
