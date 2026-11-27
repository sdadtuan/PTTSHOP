import { formatVnd } from "@/lib/format";

export const DEFAULT_COD_MAX_AMOUNT = 5_000_000;
export const DEFAULT_HOLD_HOURS = 24;
export const DEFAULT_COD_CONFIRM_HOURS = 48;

export type PaymentConfig = {
  codEnabled: boolean;
  codMaxAmount: number;
  holdHours: number;
  codConfirmHours: number;
  bankTransferEnabled: boolean;
  bankBin: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bankBranch: string;
};

export function napasAccountName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "D")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function bankReady(config: PaymentConfig) {
  const name = config.bankAccountName.trim();
  return (
    /^\d{6}$/.test(config.bankBin.trim()) &&
    config.bankName.trim().length >= 2 &&
    /^\d{6,19}$/.test(config.bankAccountNumber.replace(/\s/g, "")) &&
    name.length >= 2 &&
    name === napasAccountName(name)
  );
}

export function paymentOptions(config: PaymentConfig, payosEnabled: boolean) {
  return {
    codEnabled: config.codEnabled,
    codMaxAmount: config.codMaxAmount,
    bankVisible: config.bankTransferEnabled && bankReady(config),
    bankReady: bankReady(config),
    payosEnabled,
    holdHours: config.holdHours,
    codConfirmHours: config.codConfirmHours,
  };
}

export function checkoutMethodError(
  method: "COD" | "BANK_TRANSFER" | "PAYOS",
  total: number,
  config: PaymentConfig,
  payosEnabled: boolean,
) {
  if (method === "COD") {
    if (!config.codEnabled) return "COD đang tắt.";
    if (total > config.codMaxAmount) return "Đơn vượt ngưỡng COD.";
    return null;
  }
  if (method === "PAYOS") {
    if (!payosEnabled) return "payOS chưa được cấu hình.";
    return null;
  }
  if (!config.bankTransferEnabled || !bankReady(config)) return "Chưa cấu hình tài khoản nhận tiền.";
  return null;
}

/** Giải thích khi COD đang bật nhưng đơn vượt trần. Số tiền lấy từ cấu hình. */
export function codCeilingNotice(
  total: number,
  options: { codEnabled: boolean; codMaxAmount: number; bankVisible?: boolean },
) {
  if (!options.codEnabled || total <= options.codMaxAmount) return null;
  if (options.bankVisible === false) {
    return `Đơn hàng trên ${formatVnd(options.codMaxAmount)} vượt ngưỡng COD.`;
  }
  return `Đơn hàng trên ${formatVnd(options.codMaxAmount)} chỉ hỗ trợ chuyển khoản ngân hàng.`;
}

export function isTransferHold(method: string) {
  return method === "BANK_TRANSFER" || method === "PAYOS";
}

export function isPaymentOverdue(input: {
  method: string;
  status: string;
  paymentStatus: string;
  dueAt: string | Date | null;
  now?: Date;
}) {
  if (!isTransferHold(input.method) || input.paymentStatus === "PAID" || input.status === "CANCELLED") {
    return false;
  }
  if (!input.dueAt) return false;
  return new Date(input.dueAt).getTime() < (input.now ?? new Date()).getTime();
}

export function isCodConfirmOverdue(input: {
  method: string;
  status: string;
  dueAt: string | Date | null;
  now?: Date;
}) {
  if (input.method !== "COD" || input.status === "CANCELLED" || input.status === "CONFIRMED") return false;
  if (!input.dueAt) return false;
  return new Date(input.dueAt).getTime() < (input.now ?? new Date()).getTime();
}

export function quoteFromServerPrices(
  lines: { price: number; quantity: number }[],
  shippingFee: number | null,
  discount: number,
) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const fee = shippingFee ?? 0;
  return { subtotal, total: Math.max(0, subtotal + fee - discount) };
}
