import { handleApiError, jsonOk } from "@/lib/api";
import { bundlesForProduct } from "@/lib/bundles-public";

export async function GET(req: Request) {
  try {
    const productId = new URL(req.url).searchParams.get("productId")?.trim() || "";
    if (!productId) return jsonOk({ bundles: [] });
    return jsonOk({ bundles: await bundlesForProduct(productId) });
  } catch (err) {
    return handleApiError(err);
  }
}
