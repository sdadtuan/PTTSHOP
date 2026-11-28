import { CheckoutForm } from "@/app/thanh-toan/checkout-form";
import { payosEnv } from "@/lib/payments/payos";
import { gatewaySecrets, visibleGateways } from "@/lib/payments/gateways";
import { paymentOptions } from "@/lib/payments/policy";
import { getGatewayFlags, getPaymentConfig } from "@/lib/payments/store";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thanh toán",
  description: "Đặt hàng tại PTT Shop.",
  alternates: { canonical: "/thanh-toan" },
  robots: { index: false, follow: false },
  openGraph: { title: "Thanh toán", url: "/thanh-toan", type: "website" },
  twitter: { card: "summary", title: "Thanh toán" },
};

export default async function CheckoutPage() {
  const [config, flags] = await Promise.all([getPaymentConfig(), getGatewayFlags()]);
  const options = paymentOptions(config, payosEnv().enabled);
  const gateways = visibleGateways(flags, gatewaySecrets());
  return (
    <CheckoutForm
      initialOptions={{
        codEnabled: options.codEnabled,
        codMaxAmount: options.codMaxAmount,
        bankVisible: options.bankVisible,
        bankReady: options.bankReady,
        payosEnabled: options.payosEnabled,
        vietqr: gateways.vietqr,
        momo: gateways.momo,
        zalopay: gateways.zalopay,
      }}
    />
  );
}
