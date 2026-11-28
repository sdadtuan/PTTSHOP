import { z } from "zod";
import { enforceAdmin } from "@/lib/rbac-access";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  bestsellerMinOrders: z.number().int().positive().nullable(),
  relations: z.array(z.object({
    productId: z.string().min(1).max(80),
    relatedId: z.string().min(1).max(80),
    position: z.number().int().min(0).max(100),
  })).max(100),
});

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const [settings, relations] = await Promise.all([
      prisma.recommendationSettings.findUnique({ where: { id: "default" } }),
      prisma.productRelation.findMany({ orderBy: [{ productId: "asc" }, { position: "asc" }], take: 100 }),
    ]);
    return jsonOk({
      bestsellerMinOrders: settings?.bestsellerMinOrders ?? null,
      relations: relations.map((row) => ({ productId: row.productId, relatedId: row.relatedId, position: row.position })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    const rows = body.relations.filter((row) => row.productId !== row.relatedId);
    const ids = [...new Set(rows.flatMap((row) => [row.productId, row.relatedId]))];
    if (ids.length) {
      const found = await prisma.product.count({ where: { id: { in: ids } } });
      if (found !== ids.length) return jsonError("Sản phẩm không tồn tại");
    }
    await prisma.$transaction(async (tx) => {
      await tx.recommendationSettings.upsert({
        where: { id: "default" },
        create: { id: "default", bestsellerMinOrders: body.bestsellerMinOrders },
        update: { bestsellerMinOrders: body.bestsellerMinOrders },
      });
      await tx.productRelation.deleteMany();
      if (rows.length) {
        await tx.productRelation.createMany({
          data: rows.map((row) => ({ productId: row.productId, relatedId: row.relatedId, position: row.position })),
        });
      }
    });
    return jsonOk({ saved: true });
  } catch (err) {
    return handleApiError(err);
  }
}
