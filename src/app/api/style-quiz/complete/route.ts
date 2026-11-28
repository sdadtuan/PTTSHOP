import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { publicCatalogWhere, variantIsForSale } from "@/lib/catalog-visibility";
import { sellableTotals } from "@/lib/dropship/service";
import { prisma } from "@/lib/prisma";
import { combineFilters, quizIsOpen, quizResult, type QuizCandidate } from "@/lib/quiz";

const bodySchema = z.object({ optionIds: z.array(z.string().min(1).max(80)).min(1).max(7) });

export async function POST(req: Request) {
  try {
    const [settings, activeQuestions] = await Promise.all([
      prisma.quizSettings.findUnique({ where: { id: "default" } }),
      prisma.quizQuestion.count({ where: { isActive: true } }),
    ]);
    if (!quizIsOpen({ enabled: settings?.enabled === true, activeQuestions })) return jsonOk({ hidden: true, products: [], href: "/san-pham" });
    const body = bodySchema.parse(await req.json());
    const options = await prisma.quizOption.findMany({ where: { id: { in: body.optionIds } } });
    const products = await prisma.product.findMany({
      where: publicCatalogWhere,
      take: 80,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, slug: true, isDemo: true, saleStatus: true, gender: true,
        category: { select: { slug: true } },
        variants: { select: { id: true, price: true } },
      },
    });
    const stock = await sellableTotals(prisma, products.flatMap((product) => product.variants.map((variant) => variant.id)));
    const candidates: QuizCandidate[] = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      forSale: variantIsForSale(product),
      isDemo: product.isDemo,
      stock: product.variants.reduce((sum, variant) => sum + (stock.get(variant.id) ?? 0), 0),
      price: product.variants.length ? Math.min(...product.variants.map((variant) => variant.price)) : null,
      categorySlug: product.category?.slug ?? null,
      gender: product.gender,
    }));
    const result = quizResult(candidates, combineFilters(options));
    return jsonOk({
      href: result.href,
      relaxed: result.relaxed,
      products: result.products.map((item) => ({ id: item.id, name: item.name, slug: item.slug, price: item.price })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
