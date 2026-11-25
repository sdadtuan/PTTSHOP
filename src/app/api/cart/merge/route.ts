import { handleApiError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth-guards";
import { mergeGuestCartIntoUser, serializeCartForClient } from "@/lib/cart-service";
import {
  clearCartSessionCookie,
  getCartSessionId,
} from "@/lib/cart-session";

export async function POST() {
  try {
    const session = await requireSession();
    const sid = await getCartSessionId();
    const cart = await mergeGuestCartIntoUser(session.user.id, sid);
    await clearCartSessionCookie();
    return jsonOk(await serializeCartForClient(cart));
  } catch (err) {
    return handleApiError(err);
  }
}
