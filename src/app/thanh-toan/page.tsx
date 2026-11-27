import { CheckoutForm } from "@/app/thanh-toan/checkout-form";
import { payosEnv } from "@/lib/payments/payos";
import { paymentOptions } from "@/lib/payments/policy";
import { getPaymentConfig } from "@/lib/payments/store";

export const dynamic = "force-dynamic";

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
