import { jsonOk } from "@/lib/api";
import { payosEnv } from "@/lib/payments/payos";
import { paymentOptions } from "@/lib/payments/policy";
import { getPaymentConfig } from "@/lib/payments/store";

export async function GET() {
  const config = await getPaymentConfig();
  return jsonOk(paymentOptions(config, payosEnv().enabled));
}
