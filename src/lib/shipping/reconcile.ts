export type CodPaymentRow = {
  trackingCode?: string;
  orderNumber?: string;
  amount: number;
};

export type CodShipmentRow = {
  trackingCode: string | null;
  orderNumber: string;
  codAmount: number;
};

export type CodLineResult = {
  trackingCode: string;
  orderNumber: string;
  expectedAmount: number | null;
  actualAmount: number;
  result: "MATCH" | "MISMATCH" | "UNMATCHED";
};

/** Khớp theo mã vận đơn, rồi tới mã đơn. Không sửa số tiền đơn gốc. */
export function reconcileCod(payments: CodPaymentRow[], shipments: CodShipmentRow[]) {
  const lines: CodLineResult[] = payments.map((payment) => {
    const tracking = payment.trackingCode?.trim() || "";
    const orderNumber = payment.orderNumber?.trim() || "";
    const found =
      (tracking ? shipments.find((row) => row.trackingCode === tracking) : undefined) ||
      (orderNumber ? shipments.find((row) => row.orderNumber === orderNumber) : undefined);
    if (!found) {
      return {
        trackingCode: tracking,
        orderNumber,
        expectedAmount: null,
        actualAmount: payment.amount,
        result: "UNMATCHED" as const,
      };
    }
    return {
      trackingCode: found.trackingCode || tracking,
      orderNumber: found.orderNumber,
      expectedAmount: found.codAmount,
      actualAmount: payment.amount,
      result: found.codAmount === payment.amount ? ("MATCH" as const) : ("MISMATCH" as const),
    };
  });
  const seen = new Set(lines.filter((line) => line.result !== "UNMATCHED").map((line) => line.trackingCode || line.orderNumber));
  const open = shipments.filter((row) => !seen.has(row.trackingCode || row.orderNumber));
  return { lines, open };
}

export function parseCodCsv(text: string): CodPaymentRow[] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const body = rows[0]?.toLowerCase().includes("amount") || rows[0]?.toLowerCase().includes("so tien") ? rows.slice(1) : rows;
  return body.map((line) => {
    const [trackingCode, orderNumber, amount] = line.split(",").map((part) => part.trim());
    return {
      trackingCode,
      orderNumber,
      amount: Number(amount || 0),
    };
  });
}
