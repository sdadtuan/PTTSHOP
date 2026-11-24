export type InvoiceLine = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  vatRate: number;
};

/** Tách VAT từ giá đã gồm thuế. subtotal + vat luôn bằng đúng tổng VND. */
export function vatFromGross(gross: number, vatRate: number) {
  const totalAmount = Math.round(gross);
  if (vatRate <= 0) {
    return { subtotalAmount: totalAmount, vatAmount: 0, totalAmount };
  }
  const vatAmount = Math.round((totalAmount * vatRate) / (100 + vatRate));
  return { subtotalAmount: totalAmount - vatAmount, vatAmount, totalAmount };
}

export function buildInvoiceLines(
  input: {
    items: Array<{ name: string; color: string; size: string; price: number; quantity: number }>;
    discount: number;
    shippingFee: number;
    total: number;
  },
  vatRate: number,
) {
  const lines: InvoiceLine[] = input.items.map((item) => ({
    name: [item.name, item.color, item.size].filter(Boolean).join(" / "),
    quantity: item.quantity,
    unitPrice: item.price,
    lineTotal: item.price * item.quantity,
    vatRate,
  }));
  if (input.discount > 0) {
    lines.push({
      name: "Giảm giá",
      quantity: 1,
      unitPrice: -input.discount,
      lineTotal: -input.discount,
      vatRate,
    });
  }
  if (input.shippingFee > 0) {
    lines.push({
      name: "Phí vận chuyển",
      quantity: 1,
      unitPrice: input.shippingFee,
      lineTotal: input.shippingFee,
      vatRate,
    });
  }
  if (lines.length === 0) {
    lines.push({ name: "Đơn hàng", quantity: 1, unitPrice: input.total, lineTotal: input.total, vatRate });
  }
  const sum = lines.reduce((total, line) => total + line.lineTotal, 0);
  const delta = input.total - sum;
  if (delta !== 0) {
    const last = lines[lines.length - 1]!;
    lines[lines.length - 1] = {
      ...last,
      unitPrice: last.unitPrice + (last.quantity === 1 ? delta : 0),
      lineTotal: last.lineTotal + delta,
    };
  }
  return lines;
}
