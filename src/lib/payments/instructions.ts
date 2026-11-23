import { formatVnd } from "@/lib/format";
import { bankByBin } from "@/lib/payments/banks";
import { maskAccount } from "@/lib/payments/mask";
import { bankReady, type PaymentConfig } from "@/lib/payments/policy";
import { buildVietQrPayload } from "@/lib/payments/vietqr";

const NOTE = "Đơn được xác nhận sau khi PTT Shop nhận đủ tiền";

export type TransferView = {
  bankName: string;
  bankShortName: string;
  logoUrl: string | null;
  accountNumber: string;
  accountName: string;
  branch: string | null;
  amountLabel: string;
  amountCopy: string;
  content: string;
  qrPayload: string;
  deadlineLabel: string;
  note: string;
};

export function formatVnDeadline(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

export function transferView(input: {
  config: PaymentConfig;
  amount: number;
  orderNumber: string;
  dueAt: Date | null;
}): TransferView | null {
  if (!bankReady(input.config)) return null;
  const known = bankByBin(input.config.bankBin);
  const account = input.config.bankAccountNumber.replace(/\s/g, "");
  return {
    bankName: input.config.bankName.trim(),
    bankShortName: known?.shortName || input.config.bankName.trim(),
    logoUrl: known?.logo || null,
    accountNumber: account,
    accountName: input.config.bankAccountName.trim(),
    branch: input.config.bankBranch.trim() || null,
    amountLabel: formatVnd(input.amount),
    amountCopy: String(input.amount),
    content: input.orderNumber,
    qrPayload: buildVietQrPayload({
      bankBin: input.config.bankBin.trim(),
      bankAccountNumber: account,
      bankAccountName: input.config.bankAccountName,
      amount: input.amount,
      orderNumber: input.orderNumber,
    }),
    deadlineLabel: input.dueAt ? formatVnDeadline(input.dueAt) : "",
    note: NOTE,
  };
}

export function transferEmailText(view: TransferView) {
  return [
    `Ngân hàng: ${view.bankName}`,
    `Số tài khoản: ${view.accountNumber}`,
    `Tên chủ tài khoản: ${view.accountName}`,
    view.branch ? `Chi nhánh: ${view.branch}` : "",
    `Số tiền: ${view.amountLabel}`,
    `Nội dung: ${view.content}`,
    view.deadlineLabel ? `Hạn chuyển khoản: ${view.deadlineLabel} (giờ Việt Nam)` : "",
    view.note,
    "Mã QR VietQR đính kèm trong email.",
  ].filter(Boolean).join("\n");
}

export function transferEmailLogText(view: TransferView) {
  return transferEmailText({ ...view, accountNumber: maskAccount(view.accountNumber) });
}
