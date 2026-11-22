import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { clientIp } from "@/lib/consent";
import { company } from "@/content/company";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  subject: z.string().trim().min(5).max(120),
  requestType: z.enum(["view", "edit", "delete", "withdraw"]),
  detail: z.string().trim().min(2).max(1000),
});

export async function POST(req: Request) {
  try {
    const rl = rateLimit(clientKey(req, "data-request"), 5, 60_000);
    if (!rl.ok) return jsonError("Quá nhiều yêu cầu, thử lại sau", 429);

    const body = schema.parse(await req.json());
    await prisma.consent.create({
      data: {
        subject: body.subject,
        purpose: "data-request",
        policyVersion: company.policyVersion,
        granted: false,
        ip: clientIp(req),
        kind: "request",
        requestType: body.requestType,
        detail: body.detail,
        status: "recorded",
      },
    });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
