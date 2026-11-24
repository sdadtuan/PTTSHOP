import type { InvoiceEnv } from "@/lib/invoices/provider";
import { missingEnv, MISA_ENV_KEYS, VIETTEL_ENV_KEYS } from "@/lib/invoices/provider";

export const DEFAULT_VAT_RATE = 8;

export type InvoiceConfig = {
  provider: "DISABLED" | "SANDBOX_MOCK" | "VIETTEL_SINVOICE" | "MISA_MEINVOICE";
  autoIssueEnabled: boolean;
  issueTrigger: "ON_DELIVERED" | "ON_PAID";
  templateCode: string | null;
  invoiceSeries: string | null;
  vatRate: number;
  sellerName: string;
  sellerTaxCode: string;
  sellerAddress: string;
  maxRetries: number;
  retryBaseMinutes: number;
};

type SettingsRow = {
  provider?: string | null;
  autoIssueEnabled?: boolean | null;
  issueTrigger?: string | null;
  templateCode?: string | null;
  invoiceSeries?: string | null;
  vatRate?: number | null;
  sellerName?: string | null;
  sellerTaxCode?: string | null;
  sellerAddress?: string | null;
  maxRetries?: number | null;
  retryBaseMinutes?: number | null;
};

const PROVIDERS = ["DISABLED", "SANDBOX_MOCK", "VIETTEL_SINVOICE", "MISA_MEINVOICE"] as const;

export function normalizeInvoiceSettings(row: SettingsRow | null): InvoiceConfig {
  const provider = PROVIDERS.find((item) => item === row?.provider) || "DISABLED";
  const vat = row?.vatRate;
  return {
    provider,
    autoIssueEnabled: row?.autoIssueEnabled ?? false,
    issueTrigger: row?.issueTrigger === "ON_PAID" ? "ON_PAID" : "ON_DELIVERED",
    templateCode: row?.templateCode?.trim() || null,
    invoiceSeries: row?.invoiceSeries?.trim() || null,
    vatRate: vat === 0 || vat === 8 || vat === 10 ? vat : DEFAULT_VAT_RATE,
    sellerName: row?.sellerName?.trim() || "CÔNG TY TNHH GIẢI PHÁP QUẢNG CÁO PTT",
    sellerTaxCode: row?.sellerTaxCode?.trim() || "0319378318",
    sellerAddress: row?.sellerAddress?.trim() || "Số 73 Đường Tạ Hiện, Phường Cát Lái, TP. Hồ Chí Minh",
    maxRetries: row?.maxRetries && row.maxRetries > 0 ? row.maxRetries : 5,
    retryBaseMinutes: row?.retryBaseMinutes && row.retryBaseMinutes > 0 ? row.retryBaseMinutes : 15,
  };
}

/** Trả về lý do chặn, hoặc null khi được phép gọi nhà cung cấp. Sandbox không cần mẫu số. */
export function invoiceBlockReason(settings: InvoiceConfig, env: InvoiceEnv) {
  if (settings.provider === "DISABLED") return "Phát hành hoá đơn đang tắt.";
  if (settings.provider === "SANDBOX_MOCK") return null;
  if (settings.provider === "VIETTEL_SINVOICE" && missingEnv(env, VIETTEL_ENV_KEYS).length > 0) {
    return "Thiếu biến môi trường Viettel S-Invoice. Không gọi cổng phát hành.";
  }
  if (settings.provider === "MISA_MEINVOICE" && missingEnv(env, MISA_ENV_KEYS).length > 0) {
    return "Thiếu biến môi trường MISA meInvoice. Không gọi cổng phát hành.";
  }
  if (!settings.templateCode || !settings.invoiceSeries) {
    return "Thiếu mẫu số hoặc ký hiệu hoá đơn. Kế toán cần chốt trước khi phát hành.";
  }
  if (settings.provider === "VIETTEL_SINVOICE") return "Chưa nối API Viettel S-Invoice. Không gọi cổng phát hành.";
  if (settings.provider === "MISA_MEINVOICE") return "Chưa nối API MISA meInvoice. Không gọi cổng phát hành.";
  return "Nhà cung cấp hoá đơn chưa được hỗ trợ.";
}
