import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { testPgUrl } from "./pg";
import { describe, expect, it } from "vitest";
import { matchGhnWard } from "@/lib/shipping/address-map";
import { GhnProvider, ManualProvider } from "@/lib/shipping/provider";
import { resolveCarrierFee } from "@/lib/shipping/ghn";
import { normalizeShippingConfig, shippingFeeForCheckout } from "@/lib/shipping/policy";
import { buildSlips, reviewPrintAccess } from "@/lib/shipping/print";
import { reconcileCod } from "@/lib/shipping/reconcile";
import { applyShippingWebhook, createOrderShipment, cancelShipmentRecord, publicShipments, quoteCheckout } from "@/lib/shipping/service";
import { canTransitionShipment, orderStatusAfterShipments } from "@/lib/shipping/status";

const config = normalizeShippingConfig({ freeShipThreshold: 500000, fallbackFee: 30000 });

describe("shipping fee", () => {
  it("frees shipping at the threshold and ignores a fake client fee", () => {
    const free = shippingFeeForCheckout({ subtotal: 500000, config, sameProvince: null, carrierFee: 45000, carrierAvailable: true, clientFee: 1 });
    const paid = shippingFeeForCheckout({ subtotal: 499000, config, sameProvince: null, carrierFee: null, carrierAvailable: false, clientFee: 0 });
    expect(free).toEqual({ fee: 0, source: "FREE" });
    expect(paid.fee).toBe(30000);
    expect(paid.source).toBe("FALLBACK");
  });

  it("uses the intra fee only when the admin set it and the province matches", () => {
    const intra = normalizeShippingConfig({ intraProvinceFee: 15000, interProvinceFee: 35000 });
    expect(shippingFeeForCheckout({ subtotal: 100000, config: intra, sameProvince: true, carrierFee: null, carrierAvailable: false }).fee).toBe(15000);
    expect(shippingFeeForCheckout({ subtotal: 100000, config: intra, sameProvince: false, carrierFee: null, carrierAvailable: false }).fee).toBe(35000);
    expect(shippingFeeForCheckout({ subtotal: 100000, config, sameProvince: true, carrierFee: null, carrierAvailable: false }).fee).toBe(30000);
  });

  it("does not call the carrier when env is missing and falls back when the API fails", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return new Response("no", { status: 500 });
    }) as typeof fetch;
    const missing = await resolveCarrierFee({
      provider: "GHN",
      env: {},
      provinceName: "Thành phố Hồ Chí Minh",
      wardName: "Phường Bến Nghé",
      weightGrams: 500,
      fetchImpl,
    });
    expect(missing.available).toBe(false);
    expect(calls).toBe(0);
    const failed = await resolveCarrierFee({
      provider: "GHN",
      env: { GHN_TOKEN: "token", GHN_SHOP_ID: "1" },
      provinceName: "Thành phố Hồ Chí Minh",
      wardName: "Phường Bến Nghé",
      weightGrams: 500,
      fetchImpl,
    });
    expect(failed).toEqual({ available: false, fee: null });
    expect(shippingFeeForCheckout({ subtotal: 100000, config, sameProvince: null, carrierFee: failed.fee, carrierAvailable: failed.available }).fee).toBe(30000);
  });
});

describe("address map", () => {
  it("maps a unique ward and refuses an ambiguous name", () => {
    const wards = [
      { provinceName: "Thành phố Hồ Chí Minh", districtId: 1442, districtName: "Quận 1", wardCode: "20101", wardName: "Phường Bến Nghé" },
      { provinceName: "Thành phố Hồ Chí Minh", districtId: 1443, districtName: "Quận 3", wardCode: "20301", wardName: "Phường Võ Thị Sáu" },
      { provinceName: "Thành phố Hồ Chí Minh", districtId: 1444, districtName: "Quận 10", wardCode: "21001", wardName: "Phường Võ Thị Sáu" },
    ];
    expect(matchGhnWard({ provinceName: "TP. Hồ Chí Minh", wardName: "Phường Bến Nghé" }, wards)).toEqual({
      districtId: 1442,
      wardCode: "20101",
    });
    expect(matchGhnWard({ provinceName: "Thành phố Hồ Chí Minh", wardName: "Phường Võ Thị Sáu" }, wards)).toBeNull();
  });
});

describe("shipment rules", () => {
  const dbUrl = testPgUrl("pttshop_ship");

  async function db() {
    execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" });
    return new PrismaClient({ datasourceUrl: dbUrl });
  }

  async function order(client: PrismaClient, paymentMethod: "COD" | "BANK_TRANSFER" = "COD") {
    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const product = await client.product.create({
      data: {
        name: "Ship Tee",
        slug: `ship-tee-${stamp}`,
        gender: "UNISEX",
        variants: { create: { sku: `ship-${stamp}`, color: "Den", size: "M", price: 200000, stock: 5 } },
      },
      include: { variants: true },
    });
    return client.order.create({
      data: {
        orderNumber: `PTTSHIP${stamp}`,
        status: "CONFIRMED",
        paymentMethod,
        paymentStatus: "UNPAID",
        customerName: "An",
        customerPhone: "0901234567",
        address: "1 Nguyen Hue, Phuong Ben Nghe, TP. Ho Chi Minh",
        provinceName: "Thành phố Hồ Chí Minh",
        wardName: "Phường Bến Nghé",
        subtotal: 200000,
        shippingFee: 30000,
        total: 230000,
        items: { create: { variantId: product.variants[0].id, name: "Ship Tee", color: "Den", size: "M", price: 200000, quantity: 2 } },
      },
    });
  }

  it("creates one shipment when the same key is sent twice and blocks cancel after pickup", async () => {
    const client = await db();
    const saved = await order(client);
    const key = `${saved.orderNumber}-K1`;
    const [first, second] = await Promise.all([
      createOrderShipment(client, { orderId: saved.id, idempotencyKey: key, env: {} }),
      createOrderShipment(client, { orderId: saved.id, idempotencyKey: key, env: {} }),
    ]);
    expect(await client.shipment.count({ where: { idempotencyKey: key } })).toBe(1);
    expect([first.created, second.created].filter(Boolean)).toHaveLength(1);
    const created = await cancelShipmentRecord(client, first.shipment.id, {});
    expect(created.ok).toBe(true);
    await client.shipment.update({ where: { id: first.shipment.id }, data: { status: "PICKED" } });
    const blocked = await cancelShipmentRecord(client, first.shipment.id, {});
    expect(blocked.ok).toBe(false);
    expect((await client.shipment.findUniqueOrThrow({ where: { id: first.shipment.id } })).status).toBe("PICKED");
    await client.$disconnect();
  });

  it("shows both tracking codes on lookup", async () => {
    const client = await db();
    const saved = await order(client);
    await client.shipment.createMany({
      data: [
        { orderId: saved.id, shipmentNumber: `${saved.orderNumber}-A`, idempotencyKey: `${saved.orderNumber}-A`, provider: "MANUAL", trackingCode: "VD001", status: "IN_TRANSIT" },
        { orderId: saved.id, shipmentNumber: `${saved.orderNumber}-B`, idempotencyKey: `${saved.orderNumber}-B`, provider: "MANUAL", trackingCode: "VD002", status: "CREATED" },
      ],
    });
    const found = await client.order.findUniqueOrThrow({ where: { orderNumber: saved.orderNumber }, include: { shipments: true } });
    const view = publicShipments(found.shipments);
    expect(view.map((row) => row.trackingCode).sort()).toEqual(["VD001", "VD002"]);
    expect(new Set(view.map((row) => row.status)).size).toBe(2);
    await client.$disconnect();
  });
});

describe("shipping webhook", () => {
  const dbUrl = testPgUrl("pttshop_ship");
  const env = { GHN_TOKEN: "token", GHN_SHOP_ID: "99", GHN_WEBHOOK_TOKEN: "hook-secret" };

  function payload(orderCode: string, clientCode: string, status: string, time: string) {
    return JSON.stringify({
      ShopID: 99,
      Time: time,
      OrderCode: orderCode,
      ClientOrderCode: clientCode,
      Type: "switch_status",
      Status: status,
    });
  }

  it("returns 404 without a secret and 401 for a bad token", async () => {
    const client = new PrismaClient({ datasourceUrl: dbUrl });
    const missing = await applyShippingWebhook(client, { provider: "ghn", tokenHeader: "hook-secret", rawBody: "{}", env: {} });
    expect(missing.status).toBe(404);
    const bad = await applyShippingWebhook(client, { provider: "ghn", tokenHeader: "wrong", rawBody: payload("LAD", "PTT-K1", "picked", "t1"), env });
    expect(bad.status).toBe(401);
    await client.$disconnect();
  });

  it("applies one of two concurrent events and rejects a backward status", async () => {
    execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" });
    const client = new PrismaClient({ datasourceUrl: dbUrl });
    const stamp = Date.now();
    const product = await client.product.create({
      data: {
        name: "Hook Tee",
        slug: `hook-tee-${stamp}`,
        gender: "UNISEX",
        variants: { create: { sku: `hook-${stamp}`, color: "Den", size: "M", price: 100000, stock: 2 } },
      },
      include: { variants: true },
    });
    const saved = await client.order.create({
      data: {
        orderNumber: `PTTHOOK${stamp}`,
        status: "CONFIRMED",
        paymentMethod: "COD",
        paymentStatus: "UNPAID",
        customerName: "An",
        customerPhone: "0901234567",
        address: "Test",
        subtotal: 100000,
        total: 100000,
        items: { create: { variantId: product.variants[0].id, name: "Hook Tee", color: "Den", size: "M", price: 100000, quantity: 1 } },
      },
    });
    const key = `${saved.orderNumber}-K1`;
    const tracking = `LAD${stamp}`;
    await client.shipment.create({
      data: { orderId: saved.id, shipmentNumber: key, idempotencyKey: key, provider: "GHN", trackingCode: tracking, status: "CREATED" },
    });
    const raw = payload(tracking, key, "picked", `t-${stamp}`);
    const [first, second] = await Promise.all([
      applyShippingWebhook(client, { provider: "ghn", tokenHeader: "hook-secret", rawBody: raw, env }),
      applyShippingWebhook(client, { provider: "ghn", tokenHeader: "hook-secret", rawBody: raw, env }),
    ]);
    expect([first.status, second.status].sort()).toEqual([200, 200]);
    expect([first.body.duplicate, second.body.duplicate].filter(Boolean)).toHaveLength(1);
    expect((await client.shipment.findFirstOrThrow({ where: { idempotencyKey: key } })).status).toBe("PICKED");
    expect(await client.shippingWebhookEvent.count({ where: { eventId: `${tracking}:switch_status:t-${stamp}` } })).toBe(1);
    const backward = await applyShippingWebhook(client, {
      provider: "ghn",
      tokenHeader: "hook-secret",
      rawBody: payload(tracking, key, "ready_to_pick", `back-${stamp}`),
      env,
    });
    expect(backward.status).toBe(409);
    expect((await client.shipment.findFirstOrThrow({ where: { idempotencyKey: key } })).status).toBe("PICKED");
    const orderAfter = await client.order.findUniqueOrThrow({ where: { id: saved.id } });
    expect(orderAfter.status).toBe("SHIPPING");
    expect(canTransitionShipment("DELIVERED", "CREATED")).toBe(false);
    expect(orderStatusAfterShipments("PENDING", ["PICKED"])).toBeNull();
    await client.$disconnect();
  });
});

describe("COD reconcile and print slips", () => {
  it("matches a payout and flags a different amount without changing the order", () => {
    const report = reconcileCod(
      [
        { trackingCode: "VD001", amount: 230000 },
        { trackingCode: "VD002", amount: 1000 },
      ],
      [
        { trackingCode: "VD001", orderNumber: "PTT1", codAmount: 230000 },
        { trackingCode: "VD002", orderNumber: "PTT2", codAmount: 180000 },
      ],
    );
    expect(report.lines.map((line) => line.result)).toEqual(["MATCH", "MISMATCH"]);
    expect(report.lines[1].expectedAmount).toBe(180000);
  });

  it("blocks anonymous print access and renders both parcels for an admin", () => {
    expect(reviewPrintAccess(null)).toEqual({ ok: false, status: 307, location: "/dang-nhap" });
    expect(reviewPrintAccess("CUSTOMER").status).toBe(307);
    expect(reviewPrintAccess("ADMIN").status).toBe(200);
    const slips = buildSlips({
      orderNumber: "PTT1",
      customerName: "An",
      phone: "0901234567",
      address: "1 Nguyen Hue",
      shipments: [
        { shipmentNumber: "PTT1-A", trackingCode: "VD001", status: "IN_TRANSIT", items: [{ name: "Ao", sku: "M", quantity: 1 }] },
        { shipmentNumber: "PTT1-B", trackingCode: "VD002", status: "CREATED", items: [{ name: "Quan", sku: "L", quantity: 1 }] },
      ],
    });
    expect(slips.packing.map((slip) => slip.trackingCode)).toEqual(["VD001", "VD002"]);
    expect(slips.packing[0].customerName).toBe("An");
    expect(slips.picking).toHaveLength(2);
  });

  it("asks GHN to create a waybill with the internal package code", async () => {
    const bodies: unknown[] = [];
    const fetchImpl = (async (_url: string, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      return Response.json({ code: 200, data: { order_code: "LADFYR" } });
    }) as typeof fetch;
    const provider = new GhnProvider(
      { token: "token", shopId: "1", webhookToken: "hook", enabled: true, webhookEnabled: true, baseUrl: "https://dev-online-gateway.ghn.vn/shiip/public-api" },
      fetchImpl,
    );
    const created = await provider.createShipment({
      idempotencyKey: "PTT1-K1",
      toName: "An",
      toPhone: "0901234567",
      toAddress: "1 Nguyen Hue",
      toDistrictId: 1442,
      toWardCode: "20101",
      weightGrams: 500,
      codAmount: 230000,
    });
    expect(created).toEqual({ trackingCode: "LADFYR" });
    expect(bodies[0]).toMatchObject({ client_order_code: "PTT1-K1" });
    expect(new ManualProvider().verifyWebhook("secret")).toBe(false);
    expect(provider.verifyWebhook("nope")).toBe(false);
    expect(provider.verifyWebhook("hook")).toBe(true);
  });
});

describe("server quote", () => {
  it("recomputes from the saved rule when the client sends another fee", async () => {
    const dbUrl = testPgUrl("pttshop_ship");
    execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" });
    const client = new PrismaClient({ datasourceUrl: dbUrl });
    await client.shippingSettings.upsert({
      where: { id: "default" },
      create: { id: "default", freeShipThreshold: 500000, fallbackFee: 30000, defaultProvider: "GHN" },
      update: { freeShipThreshold: 500000, fallbackFee: 30000, defaultProvider: "GHN" },
    });
    const quoted = await quoteCheckout({
      db: client,
      subtotal: 120000,
      provinceCode: "79",
      wardCode: "00226",
      env: {},
      clientFee: 1,
    });
    expect(quoted.fee).toBe(30000);
    await client.$disconnect();
  });
});
