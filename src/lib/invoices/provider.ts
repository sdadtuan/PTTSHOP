import type { InvoiceLine } from "@/lib/invoices/money";

export type IssueRequest = {
  idempotencyKey: string;
  buyerName: string;
  buyerTaxCode: string | null;
  lines: InvoiceLine[];
  subtotalAmount: number;
  vatAmount: number;
  totalAmount: number;
  vatRate: number;
  templateCode: string | null;
  invoiceSeries: string | null;
  reason?: string;
  parentInvoiceNumber?: string | null;
};

export type IssueResult =
  | {
      ok: true;
      providerInvoiceId: string;
      invoiceNumber: string;
      lookupCode: string;
      lookupUrl: string;
    }
  | { ok: false; temporary: boolean; error: string };

export interface InvoiceProvider {
  issueInvoice(input: IssueRequest): Promise<IssueResult>;
  adjustInvoice(input: IssueRequest): Promise<IssueResult>;
  replaceInvoice(input: IssueRequest): Promise<IssueResult>;
  getStatus(providerInvoiceId: string): Promise<{ status: string }>;
}

export const VIETTEL_ENV_KEYS = [
  "EINVOICE_VIETTEL_USERNAME",
  "EINVOICE_VIETTEL_PASSWORD",
  "EINVOICE_VIETTEL_SUPPLIER_TAX_CODE",
] as const;

export const MISA_ENV_KEYS = ["EINVOICE_MISA_APP_ID", "EINVOICE_MISA_TAX_CODE", "EINVOICE_MISA_TOKEN"] as const;

export type InvoiceEnv = Record<string, string | undefined>;

export function missingEnv(env: InvoiceEnv, keys: readonly string[]) {
  return keys.filter((key) => !env[key]?.trim());
}

function blocked(message: string): IssueResult {
  return { ok: false, temporary: false, error: message };
}

export class DisabledInvoiceProvider implements InvoiceProvider {
  async issueInvoice(): Promise<IssueResult> {
    return blocked("Phát hành hoá đơn đang tắt.");
  }
  async adjustInvoice(): Promise<IssueResult> {
    return blocked("Phát hành hoá đơn đang tắt.");
  }
  async replaceInvoice(): Promise<IssueResult> {
    return blocked("Phát hành hoá đơn đang tắt.");
  }
  async getStatus() {
    return { status: "DISABLED" };
  }
}

/** Chỉ dùng khi admin chọn rõ chế độ giả lập. Không gọi mạng. */
export class SandboxMockInvoiceProvider implements InvoiceProvider {
  failRemaining: number;

  constructor(failRemaining = 0) {
    this.failRemaining = failRemaining;
  }

  private async reply(input: IssueRequest, kind: string): Promise<IssueResult> {
    if (this.failRemaining > 0) {
      this.failRemaining -= 1;
      return { ok: false, temporary: true, error: "Lỗi mạng giả lập" };
    }
    const invoiceNumber = `MOCK-${kind}-${input.idempotencyKey}`.slice(0, 40);
    return {
      ok: true,
      providerInvoiceId: invoiceNumber,
      invoiceNumber,
      lookupCode: invoiceNumber,
      lookupUrl: `https://sandbox.invalid/hoa-don/${encodeURIComponent(invoiceNumber)}`,
    };
  }

  issueInvoice(input: IssueRequest) {
    return this.reply(input, "GOC");
  }
  adjustInvoice(input: IssueRequest) {
    return this.reply(input, "DC");
  }
  replaceInvoice(input: IssueRequest) {
    return this.reply(input, "TT");
  }
  async getStatus(providerInvoiceId: string) {
    return { status: providerInvoiceId.startsWith("MOCK-") ? "ISSUED" : "UNKNOWN" };
  }
}

export class ViettelSInvoiceProvider implements InvoiceProvider {
  constructor(
    private readonly env: InvoiceEnv,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private gate(input: IssueRequest): IssueResult | null {
    if (missingEnv(this.env, VIETTEL_ENV_KEYS).length > 0) {
      return blocked("Thiếu biến môi trường Viettel S-Invoice. Không gọi cổng phát hành.");
    }
    if (!input.templateCode || !input.invoiceSeries) {
      return blocked("Thiếu mẫu số hoặc ký hiệu hoá đơn. Kế toán cần chốt trước khi phát hành.");
    }
    return blocked("Chưa nối API Viettel S-Invoice. Không gọi cổng phát hành.");
  }

  private assertLocalOnly() {
    if (typeof this.fetchImpl !== "function") {
      throw new Error("Thiếu hàm gọi mạng.");
    }
  }

  async issueInvoice(input: IssueRequest) {
    this.assertLocalOnly();
    return this.gate(input)!;
  }
  async adjustInvoice(input: IssueRequest) {
    return this.gate(input)!;
  }
  async replaceInvoice(input: IssueRequest) {
    return this.gate(input)!;
  }
  async getStatus() {
    return { status: "NOT_CONNECTED" };
  }
}

export class MisaMeInvoiceProvider implements InvoiceProvider {
  constructor(
    private readonly env: InvoiceEnv,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private gate(input: IssueRequest): IssueResult | null {
    if (missingEnv(this.env, MISA_ENV_KEYS).length > 0) {
      return blocked("Thiếu biến môi trường MISA meInvoice. Không gọi cổng phát hành.");
    }
    if (!input.templateCode || !input.invoiceSeries) {
      return blocked("Thiếu mẫu số hoặc ký hiệu hoá đơn. Kế toán cần chốt trước khi phát hành.");
    }
    return blocked("Chưa nối API MISA meInvoice. Không gọi cổng phát hành.");
  }

  private assertLocalOnly() {
    if (typeof this.fetchImpl !== "function") {
      throw new Error("Thiếu hàm gọi mạng.");
    }
  }

  async issueInvoice(input: IssueRequest) {
    this.assertLocalOnly();
    return this.gate(input)!;
  }
  async adjustInvoice(input: IssueRequest) {
    return this.gate(input)!;
  }
  async replaceInvoice(input: IssueRequest) {
    return this.gate(input)!;
  }
  async getStatus() {
    return { status: "NOT_CONNECTED" };
  }
}
