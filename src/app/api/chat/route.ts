import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { answerChat, estimateTokens, maskChatText, tokenBudget, widgetVisible, type ChatProduct } from "@/lib/chat/answer";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { publicCatalogWhere } from "@/lib/catalog-visibility";
import { phonesMatch } from "@/lib/phone";
import { getShopProfile } from "@/lib/shop/load";

const bodySchema = z.object({
  sessionId: z.string().min(8).max(80).nullish(),
  message: z.string().trim().min(1).max(500),
  contextProductId: z.string().max(80).nullish(),
});

function chartOf(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { columns?: string[]; rows?: string[][] };
    if (!parsed.columns?.length || !parsed.rows?.length) return null;
    return { columns: parsed.columns, rows: parsed.rows };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const settings = await prisma.chatSettings.findUnique({ where: { id: "default" } });
    if (!widgetVisible({ enabled: settings?.enabled === true, provider: settings?.provider || "" })) {
      return jsonOk({ hidden: true });
    }
    const limit = rateLimit(clientKey(req, "chat"), 12, 60_000);
    if (!limit.ok) return jsonError("Bạn gửi hơi nhanh. Thử lại sau một lát.", 429);

    const body = bodySchema.parse(await req.json());
    const day = new Date().toISOString().slice(0, 10);
    const usage = await prisma.chatUsageDay.findUnique({ where: { day } });
    const sessionBudget = tokenBudget(settings?.sessionTokenBudget, 4000);
    const dayBudget = tokenBudget(settings?.dailyTokenBudget, 20000);
    if ((usage?.tokens || 0) >= dayBudget) return jsonError("Hôm nay trợ lý đã hết lượt.", 429);

    const [products, profile] = await Promise.all([
      prisma.product.findMany({
        where: publicCatalogWhere,
        take: 40,
        select: {
          id: true,
          name: true,
          slug: true,
          isDemo: true,
          saleStatus: true,
          sizeChartJson: true,
          variants: { select: { price: true, stock: true } },
        },
      }),
      getShopProfile(),
    ]);
    const mapped: ChatProduct[] = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.variants.length ? Math.min(...product.variants.map((item) => item.price)) : null,
      stock: product.variants.reduce((sum, item) => sum + item.stock, 0),
      isDemo: product.isDemo,
      forSale: product.saleStatus === "SELLING" && !product.isDemo,
      sizeChart: chartOf(product.sizeChartJson),
    }));
    const orderNumber = body.message.match(/PTT[A-Z0-9]+/i)?.[0];
    const phone = body.message.match(/(?:\+84|0)\d{8,10}/)?.[0];
    const found = orderNumber
      ? await prisma.order.findUnique({ where: { orderNumber: orderNumber.toUpperCase() }, select: { orderNumber: true, customerPhone: true, status: true } })
      : null;
    const orders = found && phone && phonesMatch(found.customerPhone, phone)
      ? [{ orderNumber: found.orderNumber, phone: found.customerPhone, status: found.status }]
      : [];
    const answer = answerChat({ message: body.message, contextProductId: body.contextProductId, catalog: { products: mapped, orders, profile } });
    const tokens = estimateTokens(body.message) + estimateTokens(answer.text);
    const ttlDays = settings?.ttlDays && settings.ttlDays > 0 ? settings.ttlDays : 30;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    const session = body.sessionId
      ? await prisma.chatSession.findFirst({ where: { id: body.sessionId, deletedAt: null, expiresAt: { gt: new Date() } } })
      : null;
    if (session && session.tokenCount + tokens > sessionBudget) return jsonError("Phiên này đã hết lượt.", 429);
    const saved = session
      ? await prisma.chatSession.update({ where: { id: session.id }, data: { tokenCount: { increment: tokens } } })
      : await prisma.chatSession.create({ data: { tokenCount: tokens, expiresAt } });
    await prisma.chatMessage.createMany({
      data: [
        { sessionId: saved.id, role: "user", content: maskChatText(body.message) },
        { sessionId: saved.id, role: "assistant", content: maskChatText(answer.text), citationsJson: JSON.stringify(answer.citations) },
      ],
    });
    await prisma.chatUsageDay.upsert({
      where: { day },
      create: { day, tokens },
      update: { tokens: { increment: tokens } },
    });
    return jsonOk({ sessionId: saved.id, text: answer.text, citations: answer.citations });
  } catch (err) {
    return handleApiError(err);
  }
}

const deleteSchema = z.object({ sessionId: z.string().min(8).max(80) });

export async function DELETE(req: Request) {
  try {
    const body = deleteSchema.parse(await req.json());
    await prisma.chatMessage.deleteMany({ where: { sessionId: body.sessionId } });
    await prisma.chatSession.updateMany({ where: { id: body.sessionId }, data: { deletedAt: new Date(), tokenCount: 0 } });
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
