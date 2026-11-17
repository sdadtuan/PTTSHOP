import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  buildProductWhere,
  sortProductsByPrice,
} from "@/lib/products-query";
import { paginationSchema, productSortSchema } from "@/lib/validation";

const querySchema = paginationSchema.extend({
  category: z.string().optional(),
  gender: z.string().optional(),
  collection: z.string().optional(),
  q: z.string().optional(),
  new: z.enum(["0", "1"]).optional(),
  sort: productSortSchema.default("newest"),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const raw = Object.fromEntries(url.searchParams.entries());
    const params = querySchema.parse(raw);

    const where = buildProductWhere({
      category: params.category,
      gender: params.gender,
      collection: params.collection,
      q: params.q,
      isNew: params.new === "1",
    });

    const all = await prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        category: true,
      },
    });

    const sorted = sortProductsByPrice(all, params.sort);
    const total = sorted.length;
    const start = (params.page - 1) * params.pageSize;
    const items = sorted.slice(start, start + params.pageSize);

    return jsonOk({
      items,
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
