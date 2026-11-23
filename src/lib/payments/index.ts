import type { Order, PaymentMethod } from "@prisma/client";

export type PaymentResult = {
  paymentStatus: "UNPAID" | "PENDING" | "PAID" | "FAILED";
  paymentProvider: string;
  paymentRef?: string | null;
};

export interface PaymentProvider {
  readonly name: string;
  createPayment(order: Pick<Order, "id" | "orderNumber" | "total" | "paymentMethod">): Promise<PaymentResult>;
  /** Stub for future VNPay/MoMo webhooks */
  handleWebhook?(payload: unknown): Promise<{ ok: boolean; orderId?: string }>;
}

export class CodProvider implements PaymentProvider {
  readonly name = "cod";

  async createPayment(): Promise<PaymentResult> {
    return {
      paymentStatus: "UNPAID",
      paymentProvider: this.name,
      paymentRef: null,
    };
  }
}

export class BankTransferProvider implements PaymentProvider {
  readonly name = "bank_transfer";

  async createPayment(order: Pick<Order, "orderNumber">): Promise<PaymentResult> {
    return {
      paymentStatus: "UNPAID",
      paymentProvider: this.name,
      paymentRef: `BT-${order.orderNumber}`,
    };
  }
}

export class PayosProvider implements PaymentProvider {
  readonly name = "payos";

  async createPayment(): Promise<PaymentResult> {
    return {
      paymentStatus: "UNPAID",
      paymentProvider: this.name,
      paymentRef: null,
    };
  }
}

/** Future hooks — not wired live. */
export class VnpayProviderStub implements PaymentProvider {
  readonly name = "vnpay";
  async createPayment(): Promise<PaymentResult> {
    throw new Error("VNPay chưa được cấu hình — xem docs trong README");
  }
}

export class MomoProviderStub implements PaymentProvider {
  readonly name = "momo";
  async createPayment(): Promise<PaymentResult> {
    throw new Error("MoMo chưa được cấu hình — xem docs trong README");
  }
}

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  switch (method) {
    case "BANK_TRANSFER":
      return new BankTransferProvider();
    case "PAYOS":
      return new PayosProvider();
    case "COD":
    default:
      return new CodProvider();
  }
}
