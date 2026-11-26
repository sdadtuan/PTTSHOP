type ReceiptItem = {
  name: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
};

export type OrderReceiptInput = {
  orderNumber: string;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number | null;
  discount: number;
  total: number;
  items: ReceiptItem[];
};

const PAYMENT_LABEL: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản",
};

export function orderReceipt(order: OrderReceiptInput) {
  return {
    orderNumber: order.orderNumber,
    paymentLabel: PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod,
    lines: order.items.map((item) => ({
      label: `${item.name} × ${item.quantity} (${item.color} / ${item.size})`,
      amount: item.price * item.quantity,
    })),
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discount: order.discount,
    total: order.total,
  };
}
