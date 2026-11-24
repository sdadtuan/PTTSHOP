import { execSync } from "child_process";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));

import { GET as invoiceList, POST as invoicePost } from "@/app/api/admin/invoices/route";
import { GET as invoiceSettingsGet } from "@/app/api/admin/invoice-settings/route";
import { GET as codHistory } from "@/app/api/admin/cod-reconcile/route";
import { adminEntryRedirect } from "@/lib/admin-gate";
import { vatFromGross } from "@/lib/invoices/money";
import { MisaMeInvoiceProvider, SandboxMockInvoiceProvider, ViettelSInvoiceProvider } from "@/lib/invoices/provider";
import { attemptIssue, createLinkedInvoice, issueOriginalForOrder } from "@/lib/invoices/service";

const dbUrl = `file:${path.resolve("prisma/invoice-test.db")}`;

function db() {
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" });
  return new PrismaClient({ datasourceUrl: dbUrl });
}

async function settings(client: PrismaClient, maxRetries = 5) {
  await client.invoiceSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      provider: "SANDBOX_MOCK",
      autoIssueEnabled: false,
      issueTrigger: "ON_DELIVERED",
      vatRate: 8,
      maxRetries,
      retryBaseMinutes: 15,
    },
    update: { provider: "SANDBOX_MOCK", autoIssueEnabled: false, vatRate: 8, maxRetries },
  });
}

async function order(client: PrismaClient, extra: Record<string, unknown> = {}) {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const product = await client.product.create({
    data: {
      name: "Hoa don tee",
      slug: `hd-${stamp}`,
      gender: "UNISEX",
      variants: { create: { sku: `hd-${stamp}`, color: "Den", size: "M", price: 549000, stock: 5 } },
    },
    include: { variants: true },
  });
  return client.order.create({
    data: {
      orderNumber: `PTTHD${stamp}`,
      status: "COMPLETED",
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "PAID",
      customerName: "Khach le",
      customerPhone: "0901000000",
      customerEmail: "le@example.com",
      address: "73 Ta Hien",
      subtotal: 549000,
      shippingFee: 0,
      discount: 0,
      total: 549000,
      items: {
        create: {
          variantId: product.variants[0]!.id,
          name: "Hoa don tee",
          color: "Den",
          size: "M",
          price: 549000,
          quantity: 1,
        },
      },
      ...extra,
    },
  });
}

const blankRequest = {
  idempotencyKey: "k",
  buyerName: "A",
  buyerTaxCode: null,
  lines: [],
  subtotalAmount: 0,
  vatAmount: 0,
  totalAmount: 0,
  vatRate: 8,
  templateCode: null,
  invoiceSeries: null,
};

describe("invoice money and providers", () => {
  it("splits VAT so the parts equal the order total", () => {
    const money = vatFromGross(549000, 8);
    expect(money.subtotalAmount + money.vatAmount).toBe(549000);
    expect(money.totalAmount).toBe(549000);
  });

  it("blocks Viettel and MISA without calling the network", async () => {
    const fetchImpl = vi.fn();
    const viettel = new ViettelSInvoiceProvider({}, fetchImpl);
    const misa = new MisaMeInvoiceProvider({ EINVOICE_MISA_APP_ID: "a" }, fetchImpl);
    const missing = await viettel.issueInvoice(blankRequest);
    const partial = await misa.issueInvoice(blankRequest);
    const ready = await new ViettelSInvoiceProvider(
      {
        EINVOICE_VIETTEL_USERNAME: "user",
        EINVOICE_VIETTEL_PASSWORD: "secret",
        EINVOICE_VIETTEL_SUPPLIER_TAX_CODE: "0319378318",
      },
      fetchImpl,
    ).issueInvoice({ ...blankRequest, templateCode: "1", invoiceSeries: "C26T" });
    expect(missing.ok).toBe(false);
    expect(partial.ok).toBe(false);
    expect(ready.ok).toBe(false);
    if (!ready.ok) expect(ready.error).toMatch(/Không gọi cổng/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("invoice issue", () => {
  it("issues one retail invoice and one company invoice with matching VAT", async () => {
    const client = db();
    await settings(client);
    const provider = new SandboxMockInvoiceProvider();
    const retail = await issueOriginalForOrder(client, (await order(client)).id, provider, {});
    expect(retail.status).toBe("ISSUED");
    expect(retail.buyerKind).toBe("RETAIL");
    expect(retail.buyerName).toBe("Khach le");
    expect(retail.subtotalAmount + retail.vatAmount).toBe(retail.totalAmount);
    expect(retail.lookupUrl).toContain("sandbox.invalid");

    const companyOrder = await order(client, {
      invoiceCompanyName: "Cong ty ABC",
      invoiceTaxCode: "0319000000",
      invoiceAddress: "1 Le Loi",
      invoiceEmail: "hd@abc.vn",
    });
    const company = await issueOriginalForOrder(client, companyOrder.id, provider, {});
    expect(company.buyerKind).toBe("COMPANY");
    expect(company.buyerName).toBe("Cong ty ABC");
    expect(company.buyerTaxCode).toBe("0319000000");
    expect(company.subtotalAmount + company.vatAmount).toBe(549000);
    await client.$disconnect();
  });

  it("keeps a single original invoice for repeated and parallel issue calls", async () => {
    const client = db();
    await settings(client);
    const saved = await order(client);
    const provider = new SandboxMockInvoiceProvider();
    await issueOriginalForOrder(client, saved.id, provider, {});
    await issueOriginalForOrder(client, saved.id, provider, {});
    await Promise.all([
      issueOriginalForOrder(client, saved.id, provider, {}),
      issueOriginalForOrder(client, saved.id, provider, {}),
    ]);
    expect(await client.invoice.count({ where: { orderId: saved.id, type: "ORIGINAL" } })).toBe(1);
    await client.$disconnect();
  });

  it("fails over the retry limit, alerts accounting, then issues on a manual retry", async () => {
    const client = db();
    await settings(client, 5);
    const saved = await order(client);
    const provider = new SandboxMockInvoiceProvider(5);
    let current = await issueOriginalForOrder(client, saved.id, provider, {}, "admin-1");
    for (let i = 0; i < 4; i += 1) {
      current = await attemptIssue(client, current.id, provider, {}, "admin-1");
    }
    expect(current.status).toBe("FAILED");
    expect(current.needsAccountantAttention).toBe(true);
    const attention = await client.invoiceAuditLog.findFirst({ where: { invoiceId: current.id, action: "ATTENTION" } });
    expect(attention?.actorId).toBe("admin-1");
    const issued = await attemptIssue(client, current.id, provider, {}, "admin-1");
    expect(issued.status).toBe("ISSUED");
    expect(issued.invoiceNumber).toMatch(/^MOCK-/);
    expect(issued.lookupUrl).toContain("sandbox.invalid");
    expect(issued.needsAccountantAttention).toBe(false);
    await client.$disconnect();
  });

  it("adjusts and replaces without rewriting the original amounts", async () => {
    const client = db();
    await settings(client);
    const provider = new SandboxMockInvoiceProvider();
    const first = await issueOriginalForOrder(client, (await order(client)).id, provider, {});
    const second = await issueOriginalForOrder(client, (await order(client)).id, provider, {});
    const adjusted = await createLinkedInvoice(client, {
      parentId: first.id,
      type: "ADJUSTMENT",
      reason: "Giam gia mot phan",
      amount: 10000,
      provider,
      env: {},
      actorId: "admin-1",
    });
    expect(adjusted.parent.status).toBe("ADJUSTED");
    expect(adjusted.parent.totalAmount).toBe(549000);
    expect(adjusted.parent.subtotalAmount).toBe(first.subtotalAmount);
    expect(adjusted.child.status).toBe("ISSUED");
    expect(adjusted.child.type).toBe("ADJUSTMENT");
    const replaced = await createLinkedInvoice(client, {
      parentId: second.id,
      type: "REPLACEMENT",
      reason: "Thay the hoa don",
      amount: 500000,
      provider,
      env: {},
      actorId: "admin-1",
    });
    expect(replaced.parent.status).toBe("REPLACED");
    expect(replaced.parent.totalAmount).toBe(549000);
    const logs = await client.invoiceAuditLog.findMany({
      where: { invoiceId: { in: [first.id, second.id] }, action: { in: ["ADJUSTED", "REPLACED"] } },
    });
    expect(logs.map((row) => row.action).sort()).toEqual(["ADJUSTED", "REPLACED"]);
    await client.$disconnect();
  });
});

describe("invoice admin access", () => {
  it("sends guests from the invoice page to login and rejects APIs with 401", async () => {
    const gate = adminEntryRedirect("https://pttshop.vn", "/admin/hoa-don", "", null);
    expect(gate?.status).toBe(307);
    expect(gate?.location).toContain("/dang-nhap");
    expect(gate?.location).toContain("callbackUrl=%2Fadmin%2Fhoa-don");
    authMock.mockResolvedValue(null);
    expect((await invoiceList(new Request("http://local/api/admin/invoices"))).status).toBe(401);
    expect((await invoiceSettingsGet()).status).toBe(401);
    expect((await codHistory()).status).toBe(401);
    expect((await invoicePost(new Request("http://local/api/admin/invoices", { method: "POST", body: "{}" }))).status).toBe(401);
  });
});
