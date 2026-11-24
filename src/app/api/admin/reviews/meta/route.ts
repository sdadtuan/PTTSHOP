import { handleApiError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
    const [categories, products, reviewerRows] = await Promise.all([
      prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: true } },
        },
      }),
      prisma.product.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          categoryId: true,
          reviewCount: true,
          category: { select: { name: true } },
        },
      }),
      prisma.review.findMany({
        select: {
          displayName: true,
          user: { select: { name: true, email: true } },
        },
        take: 500,
      }),
    ]);

    const reviewerSet = new Set<string>();
    for (const r of reviewerRows) {
      const name = r.displayName?.trim() || r.user?.name?.trim();
      if (name) reviewerSet.add(name);
    }

    return jsonOk({
      categories,
      products,
      reviewers: [...reviewerSet].sort((a, b) => a.localeCompare(b, "vi")),
    });
  } catch (err) {
    return handleApiError(err);
  }
}