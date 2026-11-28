import { handleApiError, jsonOk } from "@/lib/api";
import { loadLoyaltyRule } from "@/lib/loyalty-sync";

export async function GET() {
  try {
    const rule = await loadLoyaltyRule();
    if (!rule.enabled) return jsonOk({ hidden: true });
    const redeem = rule.redeemCapPerOrder != null && rule.redeemVndPerPoint != null && rule.redeemCapPerOrder > 0 && rule.redeemVndPerPoint > 0;
    return jsonOk({
      hidden: false,
      redeem,
      redeemCapPerOrder: redeem ? rule.redeemCapPerOrder : null,
      redeemVndPerPoint: redeem ? rule.redeemVndPerPoint : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
