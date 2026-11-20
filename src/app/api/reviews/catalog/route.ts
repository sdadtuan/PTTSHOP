import { handleApiError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { listPublishedReviews } from "@/lib/reviews";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("pageSize")) || 12;
    const rating = url.searchParams.get("rating");
    const productId = url.searchParams.get("productId") || undefined;
    const productSlug = url.searchParams.get("productSlug") || undefined;
    const categoryId = url.searchParams.get("categoryId") || undefined;
    const categorySlug = url.searchParams.get("categorySlug") || undefined;

    const data = await listPublishedReviews(prisma, {
      page,
      pageSize,
      rating: rating ? Number(rating) : undefined,
      productId,
      productSlug,
      categoryId,
      categorySlug,
    });
    return jsonOk(data);
  } catch (err) {
    return handleApiError(err);
  }
}