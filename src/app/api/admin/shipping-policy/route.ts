import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { ensureHomepageCmsSeeded } from "@/lib/cms/homepage";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SHIPPING_BULLETS, normalizeBulletsForSave, parseBulletList } from "@/lib/pdp-tabs";

function present(raw: string | null | undefined) {
  const custom = parseBulletList(raw);
  return {
    bullets: custom,
    effective: custom ?? [...DEFAULT_SHIPPING_BULLETS],
  };
}

export async function GET() {
  try {
    await requireAdmin();
    const row = await prisma.siteSettings.findUnique({
      where: { id: "default" },
      select: { shippingPolicyJson: true },
    });
    return jsonOk(present(row?.shippingPolicyJson));
  } catch (err) {
    return handleApiError(err);
  }
}

const bodySchema = z.object({
  bullets: z.union([z.array(z.string().max(2000)).max(30), z.null()]),
});

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = bodySchema.parse(await req.json());
    const normalized = body.bullets ? normalizeBulletsForSave(body.bullets) : null;
    const stored = normalized && normalized.length ? JSON.stringify(normalized) : null;
    await ensureHomepageCmsSeeded();
    const row = await prisma.siteSettings.update({
      where: { id: "default" },
      data: { shippingPolicyJson: stored },
      select: { shippingPolicyJson: true },
    });
    return jsonOk(present(row.shippingPolicyJson));
  } catch (err) {
    return handleApiError(err);
  }
}
