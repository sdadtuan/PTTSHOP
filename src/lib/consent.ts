import { ApiError } from "@/lib/api";
import { company } from "@/content/company";
import { prisma } from "@/lib/prisma";

export const consentPurposes = ["delivery", "invoice", "marketing"] as const;

export type ConsentGrant = {
  purpose: (typeof consentPurposes)[number];
  granted: boolean;
};

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim().slice(0, 80) || null;
  return req.headers.get("x-real-ip")?.slice(0, 80) || null;
}

export async function recordConsents(input: {
  subject: string;
  userId?: string | null;
  ip?: string | null;
  grants: ConsentGrant[];
}) {
  const granted = new Set(
    input.grants.filter((grant) => grant.granted).map((grant) => grant.purpose),
  );
  if (!granted.has("delivery") || !granted.has("invoice")) {
    throw new ApiError("Cần đồng ý giao hàng và xuất chứng từ", 400);
  }

  await prisma.consent.createMany({
    data: consentPurposes.map((purpose) => ({
      subject: input.subject,
      userId: input.userId ?? null,
      purpose,
      policyVersion: company.policyVersion,
      granted: granted.has(purpose),
      ip: input.ip ?? null,
      kind: "grant",
      status: "recorded",
    })),
  });
}
