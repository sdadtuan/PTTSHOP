import { Prisma, type PrismaClient } from "@prisma/client";
import { nextRetryAt } from "@/lib/invoices/retry";
import { crmBlockReason, type CrmEnv } from "@/lib/ops/crm";

type Db = PrismaClient;

export const CRM_ORDER_EVENTS = ["created", "paid", "shipped", "delivered", "cancelled", "refunded"] as const;
export type CrmOrderEvent = (typeof CRM_ORDER_EVENTS)[number];

/** Field đội CRM cần xác nhận trước khi bật gửi thật. Không có giá trị mẫu. */
export const CRM_FIELDS_TO_CONFIRM = [
  "endpoint POST {CRM}/api/shop/orders",
  "tên header credential",
  "shop_order_id",
  "order_number",
  "event",
  "status",
  "payment_status",
  "payment_method",
  "currency",
  "subtotal",
  "shipping_fee",
  "discount",
  "total",
  "items.sku",
  "items.name",
  "items.quantity",
  "items.unit_price",
  "customer.name",
  "customer.phone",
  "customer.email",
  "address",
] as const;

export type ShopOrderPayload = {
  shop_order_id: string;
  order_number: string;
  event: CrmOrderEvent;
  status: string;
  payment_status: string;
  payment_method: string;
  currency: "VND";
  subtotal: number;
  shipping_fee: number | null;
  discount: number;
  total: number;
  items: { sku: string | null; name: string; quantity: number; unit_price: number }[];
  customer: { name: string; phone: string; email: string | null };
  address: string;
};

export type ShopOrderSource = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number | null;
  discount: number;
  total: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  items: { name: string; quantity: number; price: number; variant: { sku: string | null } | null }[];
};

export class MockCrmAdapter {
  failRemaining: number;
  calls: ShopOrderPayload[] = [];
  constructor(failRemaining = 0) {
    this.failRemaining = failRemaining;
  }
  async push(payload?: ShopOrderPayload) {
    if (payload) this.calls.push(payload);
    if (this.failRemaining > 0) {
      this.failRemaining -= 1;
      return { ok: false as const, temporary: true, error: "Lỗi mạng CRM giả lập" };
    }
    return { ok: true as const };
  }
}

export function shopOrderPayload(order: ShopOrderSource, event: CrmOrderEvent): ShopOrderPayload {
  return {
    shop_order_id: order.id,
    order_number: order.orderNumber,
    event,
    status: order.status,
    payment_status: order.paymentStatus,
    payment_method: order.paymentMethod,
    currency: "VND",
    subtotal: order.subtotal,
    shipping_fee: order.shippingFee,
    discount: order.discount,
    total: order.total,
    items: order.items.map((item) => ({
      sku: item.variant?.sku || null,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
    })),
    customer: { name: order.customerName, phone: order.customerPhone, email: order.customerEmail },
    address: order.address,
  };
}

function isUnique(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function enqueueShopOrder(db: Db, order: ShopOrderSource, event: CrmOrderEvent) {
  const settings = await db.crmSettings.findUnique({ where: { id: "default" } });
  if (settings?.provider !== "SANDBOX_MOCK") return null;
  const payload = shopOrderPayload(order, event);
  const dedupKey = `order:${order.id}:${event}`;
  try {
    return await db.crmSyncJob.create({
      data: {
        dedupKey,
        kind: event,
        shopOrderId: order.id,
        payloadJson: JSON.stringify(payload),
        status: "PENDING",
      },
    });
  } catch (err) {
    if (!isUnique(err)) throw err;
    return db.crmSyncJob.findUnique({ where: { dedupKey } });
  }
}

const orderInclude = { items: { include: { variant: { select: { sku: true } } } } } as const;

export async function syncShopOrder(orderId: string, event: CrmOrderEvent, db?: Db) {
  try {
    const client = db || (await import("@/lib/prisma")).prisma;
    const order = await client.order.findUnique({ where: { id: orderId }, include: orderInclude });
    if (!order) return null;
    return await enqueueShopOrder(client, order, event);
  } catch {
    return null;
  }
}

export async function syncShopOrderByNumber(orderNumber: string, event: CrmOrderEvent, db?: Db) {
  try {
    const client = db || (await import("@/lib/prisma")).prisma;
    const order = await client.order.findUnique({ where: { orderNumber }, include: orderInclude });
    if (!order) return null;
    return await enqueueShopOrder(client, order, event);
  } catch {
    return null;
  }
}

export async function attemptShopOrder(db: Db, jobId: string, adapter: MockCrmAdapter, env: CrmEnv, now = new Date()) {
  const settings = await db.crmSettings.findUnique({ where: { id: "default" } });
  const provider = settings?.provider || "DISABLED";
  const block = crmBlockReason(provider, env);
  const job = await db.crmSyncJob.findUnique({ where: { id: jobId } });
  if (!job || job.status === "SENT") return job;
  if (block) {
    return db.crmSyncJob.update({ where: { id: job.id }, data: { lastError: block, status: "PENDING" } });
  }
  const result = await adapter.push(JSON.parse(job.payloadJson) as ShopOrderPayload);
  if (!result.ok) {
    const retryCount = job.retryCount + 1;
    const failed = retryCount >= job.maxRetries;
    return db.crmSyncJob.update({
      where: { id: job.id },
      data: {
        status: failed ? "FAILED" : "RETRYING",
        retryCount,
        lastError: result.error,
        nextRetryAt: failed ? null : nextRetryAt(now, retryCount, settings?.retryBaseMinutes || 15),
      },
    });
  }
  return db.crmSyncJob.update({ where: { id: job.id }, data: { status: "SENT", lastError: null } });
}
