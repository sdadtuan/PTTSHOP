import { jsonOk } from "@/lib/api";
import { gatewaySecrets, visibleGateways } from "@/lib/payments/gateways";
import { payosEnv } from "@/lib/payments/payos";
import { paymentOptions } from "@/lib/payments/policy";
import { getGatewayFlags, getPaymentConfig } from "@/lib/payments/store";

export async function GET() {
  const [config, flags] = await Promise.all([getPaymentConfig(), getGatewayFlags()]);
  return jsonOk({
    ...paymentOptions(config, payosEnv().enabled),
    ...visibleGateways(flags, gatewaySecrets()),
  });
}
