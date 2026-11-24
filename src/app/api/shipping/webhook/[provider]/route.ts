import { applyShippingWebhook } from "@/lib/shipping/service";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const rawBody = await req.text();
  const result = await applyShippingWebhook(prisma, {
    provider,
    tokenHeader: req.headers.get("token"),
    rawBody,
  });
  return Response.json(result.body, { status: result.status });
}
