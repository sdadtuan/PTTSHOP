import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { priceBundle } from "@/lib/bundles";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const itemSchema = z.object({
  title: z.string().trim().min(1).max(120),
  priceMode: z.enum(["FIXED", "PERCENT"]),
  priceVnd: z.number().int().nullable().optional(),
  percentOff: z.number().int().nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  isPublished: z.boolean().optional(),
  productIds: z.array(z.string().trim().min(1).max(80)).min(2).max(8),
});

const settingsSchema = z.object({
  outOfStockMode: z.enum(["HIDE", "RETAIL"]),
  stackCoupon: z.boolean(),
});

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const [settings, bundles] = await Promise.all([
      prisma.bundleSettings.findUnique({ where: { id: "default" } }),
      prisma.bundle.findMany({
        orderBy: { updatedAt: "desc" },
        include: { items: { orderBy: { position: "asc" }, select: { productId: true } } },
        take: 50,
      }),
    ]);
    return jsonOk({
      settings: {
        outOfStockMode: settings?.outOfStockMode === "RETAIL" ? "RETAIL" : "HIDE",
        stackCoupon: settings?.stackCoupon === true,
      },
      bundles: bundles.map((bundle) => ({
        id: bundle.id,
        title: bundle.title,
        slug: bundle.slug,
        priceMode: bundle.priceMode,
        priceVnd: bundle.priceVnd,
        percentOff: bundle.percentOff,
        isPublished: bundle.isPublished,
        productIds: bundle.items.map((item) => item.productId),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    await enforceAdmin(req);
    const body = settingsSchema.parse(await req.json());
    await prisma.bundleSettings.upsert({
      where: { id: "default" },
      create: { id: "default", outOfStockMode: body.outOfStockMode, stackCoupon: body.stackCoupon },
      update: { outOfStockMode: body.outOfStockMode, stackCoupon: body.stackCoupon },
    });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const body = itemSchema.parse(await req.json());
    const productIds = [...new Set(body.productIds)];
    if (productIds.length < 2) return jsonError("Combo cần ít nhất hai món khác nhau.");
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: { select: { price: true } } },
    });
    if (products.length !== productIds.length) return jsonError("Không tìm thấy đủ sản phẩm.");
    if (products.some((product) => product.isDemo)) return jsonError("Không gắn hàng demo vào combo.");
    const retailSum = products.reduce((sum, product) => {
      const prices = product.variants.map((variant) => variant.price).filter((price) => price > 0);
      return sum + (prices.length ? Math.min(...prices) : 0);
    }, 0);
    const priced = priceBundle({
      priceMode: body.priceMode,
      priceVnd: body.priceVnd ?? null,
      percentOff: body.percentOff ?? null,
      retailSum,
    });
    if (!priced.ok) return jsonError(priced.error);
    const slug = slugify(body.title);
    const bundle = await prisma.bundle.create({
      data: {
        title: body.title,
        slug,
        priceMode: body.priceMode,
        priceVnd: body.priceMode === "FIXED" ? body.priceVnd : null,
        percentOff: body.priceMode === "PERCENT" ? body.percentOff : null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        isPublished: body.isPublished === true,
        items: { create: productIds.map((productId, position) => ({ productId, position })) },
      },
    });
    return jsonOk({ id: bundle.id, slug: bundle.slug, isPublished: bundle.isPublished });
  } catch (err) {
    return handleApiError(err);
  }
}
