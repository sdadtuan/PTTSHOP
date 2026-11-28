import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { ApiError } from "@/lib/api";
import { resolveAddress } from "@/lib/address/vn-admin";
import { autoIssueIfReady } from "@/lib/invoices/service";
import { withSqliteRetry } from "@/lib/payments/sqlite-retry";
import { findGhnDestination, ghnEnv, parseGhnWebhook, resolveCarrierFee, type ShippingEnv } from "@/lib/shipping/ghn";
import { GhnProvider, providerFor } from "@/lib/shipping/provider";
import {
  normalizeShippingConfig,
  sameProvince,
  shippingFeeForCheckout,
  type ShippingConfig,
} from "@/lib/shipping/policy";
import {
  canCancelShipment,
  canTransitionShipment,
  mapGhnStatus,
  orderStatusAfterShipments,
} from "@/lib/shipping/status";

type Db = PrismaClient;

export async function getShippingConfig(db: Db): Promise<ShippingConfig> {
  const row = await db.shippingSettings.findUnique({ where: { id: "default" } });
  return normalizeShippingConfig(row);
}

export async function quoteCheckout(input: {
  db: Db;
  subtotal: number;
  provinceCode?: string;
  wardCode?: string;
  env?: ShippingEnv;
  fetchImpl?: typeof fetch;
  clientFee?: number;
}) {
  const config = await getShippingConfig(input.db);
  const place =
    input.provinceCode && input.wardCode ? resolveAddress(input.provinceCode, input.wardCode) : null;
  const warehouse = config.warehouseProvinceCode
    ? resolveAddress(config.warehouseProvinceCode, config.warehouseWardCode)
    : null;
  const carrier = await resolveCarrierFee({
    provider: config.defaultProvider,
    env: input.env,
    provinceName: place?.provinceName || "",
    wardName: place?.wardName || "",
    fromProvinceName: warehouse?.provinceName,
    fromWardName: warehouse?.wardName,
    weightGrams: config.parcelWeightGrams,
    fetchImpl: input.fetchImpl,
  });
  return shippingFeeForCheckout({
    subtotal: input.subtotal,
    config,
    sameProvince: sameProvince(config.warehouseProvinceCode, input.provinceCode || ""),
    carrierFee: carrier.fee,
    carrierAvailable: carrier.available,
    clientFee: input.clientFee,
  });
}

export function activeProvider(config: ShippingConfig, env: ShippingEnv = process.env) {
  const ghn = ghnEnv(env);
  if (config.defaultProvider === "GHN" && ghn.enabled) return "GHN" as const;
  return "MANUAL" as const;
}

export async function createOrderShipment(
  db: Db,
  input: {
    orderId: string;
    idempotencyKey?: string;
    env?: ShippingEnv;
    fetchImpl?: typeof fetch;
    destination?: { districtId: number; wardCode: string } | null;
  },
) {
  const order = await db.order.findUnique({
    where: { id: input.orderId },
    include: { items: true, shipments: { include: { items: true } } },
  });
  if (!order) throw new ApiError("Không tìm thấy đơn.", 404);
  const key = input.idempotencyKey?.trim() || `${order.orderNumber}-K1`;
  const existing = order.shipments.find((row) => row.idempotencyKey === key);
  if (existing) return { shipment: existing, created: false };

  const taken = new Map<string, number>();
  for (const shipment of order.shipments) {
    if (shipment.status === "CANCELLED") continue;
    for (const item of shipment.items) {
      if (!item.orderItemId) continue;
      taken.set(item.orderItemId, (taken.get(item.orderItemId) || 0) + (item.quantity || 0));
    }
  }
  const lines = order.items
    .map((item) => ({
      orderItemId: item.id,
      quantity: item.quantity - (taken.get(item.id) || 0),
    }))
    .filter((line) => line.quantity > 0);
  if (lines.length === 0) throw new ApiError("Không còn hàng để tạo kiện.", 400);

  const config = await getShippingConfig(db);
  const provider = activeProvider(config, input.env);
  const openCod = order.shipments
    .filter((row) => row.status !== "CANCELLED")
    .reduce((sum, row) => sum + (row.codAmount || 0), 0);
  const codAmount = order.paymentMethod === "COD" ? Math.max(0, order.total - openCod) : 0;
  const hasOpen = order.shipments.some((row) => row.status !== "CANCELLED");

  try {
    const shipment = await db.shipment.create({
      data: {
        orderId: order.id,
        shipmentNumber: key,
        idempotencyKey: key,
        provider,
        status: "CREATED",
        shippingFee: hasOpen ? 0 : order.shippingFee,
        codAmount,
        items: { create: lines },
      },
      include: { items: true },
    });
    if (provider === "GHN") {
      const tracking = await attachGhnWaybill(db, {
        shipmentId: shipment.id,
        order,
        key,
        config,
        codAmount,
        env: input.env,
        fetchImpl: input.fetchImpl,
        destination: input.destination,
      });
      return { shipment: { ...shipment, trackingCode: tracking }, created: true };
    }
    return { shipment, created: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const again = await db.shipment.findUnique({ where: { idempotencyKey: key }, include: { items: true } });
      if (again) return { shipment: again, created: false };
    }
    throw err;
  }
}

async function attachGhnWaybill(
  db: Db,
  input: {
    shipmentId: string;
    order: { customerName: string; customerPhone: string; address: string; provinceName: string | null; wardName: string | null };
    key: string;
    config: ShippingConfig;
    codAmount: number;
    env?: ShippingEnv;
    fetchImpl?: typeof fetch;
    destination?: { districtId: number; wardCode: string } | null;
  },
) {
  const env = ghnEnv(input.env);
  if (!env.enabled || !input.order.provinceName || !input.order.wardName) return null;
  try {
    const destination =
      input.destination === undefined
        ? await findGhnDestination(
            {
              provinceName: input.order.provinceName,
              wardName: input.order.wardName,
              token: env.token,
              baseUrl: env.baseUrl,
            },
            input.fetchImpl || fetch,
          )
        : input.destination;
    if (!destination) return null;
    const remote = await providerFor("GHN", input.env, input.fetchImpl).createShipment({
      idempotencyKey: input.key,
      toName: input.order.customerName,
      toPhone: input.order.customerPhone,
      toAddress: input.order.address,
      toDistrictId: destination.districtId,
      toWardCode: destination.wardCode,
      weightGrams: input.config.parcelWeightGrams,
      codAmount: input.codAmount,
    });
    if ("error" in remote || !remote.trackingCode) return null;
    const tracking = remote.trackingCode;
    await db.shipment.update({ where: { id: input.shipmentId }, data: { trackingCode: tracking } });
    return tracking;
  } catch {
    return null;
  }
}

export async function cancelShipmentRecord(
  db: Db,
  shipmentId: string,
  env: ShippingEnv = process.env,
  fetchImpl: typeof fetch = fetch,
) {
  const shipment = await db.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) return { ok: false as const, error: "Không tìm thấy kiện." };
  if (!canCancelShipment(shipment.status || "")) {
    return { ok: false as const, error: "Hãng đã lấy hàng, không huỷ vận đơn." };
  }
  if (shipment.provider === "GHN" && shipment.trackingCode && ghnEnv(env).enabled) {
    const cancelled = await providerFor("GHN", env, fetchImpl).cancelShipment(shipment.trackingCode);
    if (!cancelled.ok) return { ok: false as const, error: cancelled.error || "Hãng đã lấy hàng, không huỷ vận đơn." };
  }
  const updated = await db.shipment.update({ where: { id: shipment.id }, data: { status: "CANCELLED" } });
  return { ok: true as const, shipment: updated };
}

export async function cancelOpenShipments(db: Db, orderId: string) {
  const rows = await db.shipment.findMany({ where: { orderId } });
  let cancelled = 0;
  let blocked = 0;
  for (const row of rows) {
    if (row.status === "CANCELLED") continue;
    const result = await cancelShipmentRecord(db, row.id);
    if (result.ok) cancelled += 1;
    else blocked += 1;
  }
  return { cancelled, blocked };
}

export class ShipmentTransitionError extends Error {}

export async function applyShippingWebhook(
  db: Db,
  input: { provider: string; tokenHeader: string | null; rawBody: string; env?: ShippingEnv },
) {
  if (input.provider !== "ghn") return { status: 404, body: { error: "Không có webhook cho hãng này." } };
  const env = ghnEnv(input.env);
  if (!env.webhookEnabled) return { status: 404, body: { error: "Webhook chưa được cấu hình." } };
  const event = parseGhnWebhook(input.rawBody);
  if (!event) return { status: 400, body: { error: "Sự kiện không hợp lệ." } };
  const ghn = new GhnProvider(env);
  if (!ghn.verifyWebhook(input.tokenHeader) || (env.shopId && event.shopId && String(event.shopId) !== env.shopId)) {
    return { status: 401, body: { error: "Sai chữ ký webhook." } };
  }
  try {
    const result = await withSqliteRetry(() =>
      db.$transaction(async (tx) => {
        const byClient = event.clientOrderCode
          ? await tx.shipment.findFirst({
              where: { OR: [{ idempotencyKey: event.clientOrderCode }, { shipmentNumber: event.clientOrderCode }] },
            })
          : null;
        const shipment = byClient || (event.orderCode ? await tx.shipment.findFirst({ where: { trackingCode: event.orderCode } }) : null);
        const next = mapGhnStatus(event.status);
        if (shipment && (!next || !canTransitionShipment(shipment.status || "CREATED", next))) {
          throw new ShipmentTransitionError("Không chuyển được trạng thái vận đơn.");
        }
        await tx.shippingWebhookEvent.create({
          data: { eventId: event.eventId, provider: "GHN", shipmentId: shipment?.id || null },
        });
        if (!shipment || !next) return { duplicate: false, ignored: true, deliveredOrderId: null as string | null, shippedOrderId: null as string | null };
        await tx.shipment.update({ where: { id: shipment.id }, data: { status: next, trackingCode: shipment.trackingCode || event.orderCode } });
        let deliveredOrderId: string | null = null;
        let shippedOrderId: string | null = null;
        if (shipment.orderId) {
          const order = await tx.order.findUnique({ where: { id: shipment.orderId } });
          const siblings = await tx.shipment.findMany({ where: { orderId: shipment.orderId } });
          const statuses = siblings.map((row) => (row.id === shipment.id ? next : row.status || ""));
          const orderNext = order ? orderStatusAfterShipments(order.status, statuses) : null;
          if (order && orderNext) {
            await tx.order.update({ where: { id: order.id }, data: { status: orderNext } });
            if (orderNext === "COMPLETED") deliveredOrderId = order.id;
            if (orderNext === "SHIPPING") shippedOrderId = order.id;
          }
        }
        return { duplicate: false, ignored: false, deliveredOrderId, shippedOrderId };
      }),
    );
    const { shippedOrderId, ...publicResult } = result;
    if (publicResult.deliveredOrderId) {
      await autoIssueIfReady(db, publicResult.deliveredOrderId, "DELIVERED");
      const { syncOrderLoyalty } = await import("@/lib/loyalty-sync");
      await syncOrderLoyalty(publicResult.deliveredOrderId);
      const { syncShopOrder } = await import("@/lib/ops/crm-order");
      await syncShopOrder(publicResult.deliveredOrderId, "delivered");
    }
    if (shippedOrderId) {
      const { syncShopOrder } = await import("@/lib/ops/crm-order");
      await syncShopOrder(shippedOrderId, "shipped");
    }
    return { status: 200, body: { ok: true, ...publicResult } };
  } catch (err) {
    if (err instanceof ShipmentTransitionError) {
      return { status: 409, body: { error: err.message } };
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { status: 200, body: { ok: true, duplicate: true } };
    }
    throw err;
  }
}

export function publicShipments(
  rows: { shipmentNumber: string | null; provider: string | null; trackingCode: string | null; status: string | null; fulfillmentSource?: string | null }[],
) {
  return rows.map((row) => ({
    shipmentNumber: row.shipmentNumber,
    provider: row.provider,
    trackingCode: row.trackingCode,
    status: row.status,
    fulfillmentSource: row.fulfillmentSource ?? null,
  }));
}
