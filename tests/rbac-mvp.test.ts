import { execSync } from "child_process";
import { describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));

import { GET as invoicesGet } from "@/app/api/admin/invoices/route";
import { GET as rolesGet } from "@/app/api/admin/phan-quyen/route";
import { POST as rolesPost } from "@/app/api/admin/phan-quyen/route";
import { GET as pricingGet } from "@/app/api/admin/pricing-rules/route";
import { GET as auditGet } from "@/app/api/admin/audit/route";
import { GET as integrationsGet } from "@/app/api/admin/integrations/route";
import { POST as twoFactorPost } from "@/app/api/admin/two-factor/route";
import { POST as shipmentsPost } from "@/app/api/admin/shipments/route";
import { GET as ordersGet } from "@/app/api/admin/orders/route";
import { PATCH as variantPatch } from "@/app/api/admin/variants/route";
import { POST as refundPost } from "@/app/api/admin/refunds/route";
import { adminEntryRedirect } from "@/lib/admin-gate";
import { adminPermissionDenied, can, maskCustomerPhone } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { consumeRecovery, hashRecoveryCode, totpCode, verifyTotp } from "@/lib/two-factor";
import { maskSecret } from "@/lib/integrations-view";

function db() {
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }, stdio: "pipe" });
  return prisma;
}

function asUser(id: string) {
  authMock.mockResolvedValue({ user: { id, role: "ADMIN", email: `${id}@example.com` } });
}

describe("rbac matrix", () => {
  it("unions roles and keeps a legacy admin open", () => {
    expect(can({ roles: ["WAREHOUSE"], legacy: false }, "pricing.read")).toBe(false);
    expect(can({ roles: ["WAREHOUSE"], legacy: false }, "shipping.write")).toBe(true);
    expect(can({ roles: ["WAREHOUSE", "ACCOUNTANT"], legacy: false }, "pricing.read")).toBe(true);
    expect(can({ roles: ["WAREHOUSE", "ACCOUNTANT"], legacy: false }, "invoices.write")).toBe(true);
    expect(can({ roles: ["MARKETING"], legacy: false }, "orders.phone")).toBe(false);
    expect(can({ roles: ["ADMIN"], legacy: true }, "invoices.write")).toBe(true);
    expect(adminPermissionDenied("/admin/quy-tac-gia", { role: "ADMIN", rbacRoles: ["WAREHOUSE"], legacyAdmin: false })?.status).toBe(403);
    expect(adminPermissionDenied("/admin/van-chuyen", { role: "ADMIN", rbacRoles: ["WAREHOUSE"], legacyAdmin: false })).toBeNull();
    expect(adminEntryRedirect("http://localhost", "/admin/phan-quyen", "", null)?.status).toBe(307);
    expect(adminEntryRedirect("http://localhost", "/admin/tich-hop", "", null)?.status).toBe(307);
    expect(adminEntryRedirect("http://localhost", "/admin/nhat-ky", "", null)?.status).toBe(307);
    expect(adminEntryRedirect("http://localhost", "/admin/quy-tac-gia", "", null)?.status).toBe(307);
    expect(maskCustomerPhone("0901234567")).not.toContain("0901234567");
  });

  it("blocks warehouse on pricing, invoices and roles, and allows a shipment", async () => {
    const client = db();
    const warehouse = await client.user.create({ data: { email: `kho-${Date.now()}@example.com`, role: "ADMIN", roleAssignments: { create: { role: "WAREHOUSE" } } } });
    asUser(warehouse.id);
    const pricing = new Request("http://localhost/api/admin/pricing-rules");
    const invoices = new Request("http://localhost/api/admin/invoices");
    const roles = new Request("http://localhost/api/admin/phan-quyen");
    expect((await pricingGet(pricing)).status).toBe(403);
    expect((await invoicesGet(invoices)).status).toBe(403);
    expect((await rolesGet(roles)).status).toBe(403);
    const shipment = await shipmentsPost(new Request("http://localhost/api/admin/shipments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId: "missing-order" }),
    }));
    expect(shipment.status).not.toBe(403);
    const legacy = await client.user.create({ data: { email: `legacy-${Date.now()}@example.com`, role: "ADMIN" } });
    asUser(legacy.id);
    expect((await pricingGet(new Request("http://localhost/api/admin/pricing-rules"))).status).not.toBe(403);
    const factor = await client.adminTwoFactor.findUnique({ where: { userId: legacy.id } });
    expect(factor?.enabled ?? false).toBe(false);
  });

  it("masks a marketing order phone", async () => {
    const client = db();
    const user = await client.user.create({ data: { email: `mkt-${Date.now()}@example.com`, role: "ADMIN", roleAssignments: { create: { role: "MARKETING" } } } });
    const product = await client.product.create({
      data: { name: "Ao", slug: `rbac-${Date.now()}`, gender: "UNISEX", variants: { create: { sku: `rbac-${Date.now()}`, color: "Den", size: "M", price: 1000, stock: 2 } } },
      include: { variants: true },
    });
    await client.order.create({
      data: {
        orderNumber: `PTTRB${Date.now()}`,
        status: "PENDING",
        paymentMethod: "COD",
        paymentStatus: "UNPAID",
        customerName: "An",
        customerPhone: "0901234567",
        address: "73 Ta Hien",
        subtotal: 1000,
        shippingFee: 0,
        discount: 0,
        total: 1000,
        items: { create: { variantId: product.variants[0]!.id, name: "Ao", color: "Den", size: "M", price: 1000, quantity: 1 } },
      },
    });
    asUser(user.id);
    const res = await ordersGet(new Request("http://localhost/api/admin/orders"));
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("0901234567");
    expect(body.orders[0].customerPhone).toContain("•");
  });
});

describe("two factor and secrets", () => {
  it("enables with a valid code, rejects a bad code, and consumes a recovery code once", async () => {
    const client = db();
    const user = await client.user.create({ data: { email: `otp-${Date.now()}@example.com`, role: "ADMIN" } });
    asUser(user.id);
    const started = await twoFactorPost(new Request("http://localhost/api/admin/two-factor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    }));
    const startBody = await started.json();
    const secret = new URL(startBody.otpauth).searchParams.get("secret") || "";
    const bad = await twoFactorPost(new Request("http://localhost/api/admin/two-factor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "enable", code: "000000" }),
    }));
    expect(bad.status).toBe(400);
    const good = await twoFactorPost(new Request("http://localhost/api/admin/two-factor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "enable", code: totpCode(secret) }),
    }));
    const enabled = await good.json();
    expect(enabled.enabled).toBe(true);
    expect(verifyTotp(secret, totpCode(secret))).toBe(true);
    const recovery = enabled.recoveryCodes[0] as string;
    const row = await client.adminTwoFactor.findUniqueOrThrow({ where: { userId: user.id } });
    const remaining = consumeRecovery(row.recoveryCodesHash, recovery);
    expect(remaining).not.toBeNull();
    expect(consumeRecovery(JSON.stringify(remaining), recovery)).toBeNull();
    expect(hashRecoveryCode(recovery)).toHaveLength(64);
  });

  it("shows only the last four characters of a configured secret", async () => {
    const client = db();
    const user = await client.user.create({ data: { email: `sec-${Date.now()}@example.com`, role: "ADMIN" } });
    asUser(user.id);
    const secret = "super-secret-value-abcd";
    const res = await integrationsGet(new Request("http://localhost/api/admin/integrations"));
    const body = await res.json();
    const text = JSON.stringify(body);
    expect(text).not.toContain(secret);
    expect(maskSecret(secret).label).toBe("••••abcd");
    expect(maskSecret("").label).toBe("Chưa cấu hình");
    expect(maskSecret("short").label).toBe("Đã cấu hình (quá ngắn)");
  });
});

describe("audit log", () => {
  it("records price, refund and role changes and has no write endpoint", async () => {
    const client = db();
    const admin = await client.user.create({ data: { email: `audit-${Date.now()}@example.com`, role: "ADMIN" } });
    const product = await client.product.create({
      data: { name: "Ao audit", slug: `audit-${Date.now()}`, gender: "UNISEX", variants: { create: { sku: `aud-${Date.now()}`, color: "Den", size: "M", price: 1000, stock: 3 } } },
      include: { variants: true },
    });
    asUser(admin.id);
    const variant = product.variants[0]!;
    expect((await variantPatch(new Request("http://localhost/api/admin/variants", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: variant.id, price: 1200 }),
    }))).status).toBe(200);
    const order = await client.order.create({
      data: {
        orderNumber: `PTTAU${Date.now()}`,
        status: "CONFIRMED",
        paymentMethod: "COD",
        paymentStatus: "PAID",
        customerName: "An",
        customerPhone: "0901000000",
        address: "73",
        subtotal: 2500000,
        shippingFee: 0,
        discount: 0,
        total: 2500000,
        items: { create: { variantId: variant.id, name: "Ao", color: "Den", size: "M", price: 1200, quantity: 1 } },
      },
    });
    const refund = await client.refundRequest.create({
      data: { orderId: order.id, idempotencyKey: `rbac-${order.id}`, amount: 2500000, refundMethod: "BANK_TRANSFER_MANUAL", status: "PENDING" },
    });
    expect((await refundPost(new Request("http://localhost/api/admin/refunds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "approve", refundId: refund.id }),
    }))).status).toBe(200);
    const staff = await client.user.create({ data: { email: `staff-${Date.now()}@example.com`, role: "ADMIN" } });
    expect((await rolesPost(new Request("http://localhost/api/admin/phan-quyen", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: staff.id, roles: ["WAREHOUSE"] }),
    }))).status).toBe(200);
    const rows = await client.adminAuditLog.findMany({ orderBy: { createdAt: "asc" } });
    expect(rows.map((row) => row.action)).toEqual(expect.arrayContaining(["VARIANT_PRICE_STOCK", "REFUND_APPROVE", "ROLE_ASSIGN"]));
    const price = rows.find((row) => row.action === "VARIANT_PRICE_STOCK");
    expect(price?.beforeJson).toContain("1000");
    expect(price?.afterJson).toContain("1200");
    const auditModule = await import("@/app/api/admin/audit/route");
    expect("PUT" in auditModule || "PATCH" in auditModule || "DELETE" in auditModule).toBe(false);
    authMock.mockResolvedValue(null);
    expect((await auditGet(new Request("http://localhost/api/admin/audit"))).status).toBe(401);
    expect((await pricingGet(new Request("http://localhost/api/admin/pricing-rules"))).status).toBe(401);
    expect((await integrationsGet(new Request("http://localhost/api/admin/integrations"))).status).toBe(401);
    expect((await rolesGet(new Request("http://localhost/api/admin/phan-quyen"))).status).toBe(401);
  });
});

describe("production seed", () => {
  it("refuses prisma seed when NODE_ENV is production", () => {
    let status = 0;
    try {
      execSync("npx tsx prisma/seed.ts", {
        env: { ...process.env, NODE_ENV: "production" },
        stdio: "pipe",
      });
    } catch (err) {
      status = (err as { status?: number }).status || 1;
    }
    expect(status).not.toBe(0);
  });
});
