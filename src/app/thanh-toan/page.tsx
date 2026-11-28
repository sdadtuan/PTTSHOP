import { CheckoutForm } from "@/app/thanh-toan/checkout-form";
import { payosEnv } from "@/lib/payments/payos";
import { paymentOptions } from "@/lib/payments/policy";
import { getPaymentConfig } from "@/lib/payments/store";
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
  const options = paymentOptions(await getPaymentConfig(), payosEnv().enabled);
  return (
    <CheckoutForm
      initialOptions={{
        codEnabled: options.codEnabled,
        codMaxAmount: options.codMaxAmount,
        bankVisible: options.bankVisible,
        bankReady: options.bankReady,
        payosEnabled: options.payosEnabled,
      }}
    />
  );
}
