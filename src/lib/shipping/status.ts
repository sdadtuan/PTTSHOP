import type { OrderStatus } from "@prisma/client";
import { canTransitionOrder } from "@/lib/order-status";

export const SHIPMENT_STATUSES = [
  "CREATED",
  "PICKED",
  "IN_TRANSIT",
  "DELIVERED",
  "RETURNING",
  "RETURNED",
  "CANCELLED",
  "FAILED",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

const NEXT: Record<ShipmentStatus, ShipmentStatus[]> = {
  CREATED: ["PICKED", "CANCELLED", "FAILED"],
  PICKED: ["IN_TRANSIT", "RETURNING", "FAILED"],
  IN_TRANSIT: ["DELIVERED", "RETURNING", "FAILED"],
  RETURNING: ["RETURNED", "FAILED"],
  DELIVERED: [],
  RETURNED: [],
  CANCELLED: [],
  FAILED: [],
};

export function isShipmentStatus(value: string): value is ShipmentStatus {
  return (SHIPMENT_STATUSES as readonly string[]).includes(value);
}

export function canTransitionShipment(from: string, to: string) {
  if (!isShipmentStatus(from) || !isShipmentStatus(to)) return false;
  if (from === to) return true;
  return NEXT[from].includes(to);
}

/** Chỉ huỷ khi hãng chưa lấy hàng. */
export function canCancelShipment(status: string) {
  return status === "CREATED";
}

const GHN_STATUS: Record<string, ShipmentStatus> = {
  ready_to_pick: "CREATED",
  picking: "CREATED",
  money_collect_picking: "PICKED",
  picked: "PICKED",
  storing: "IN_TRANSIT",
  transporting: "IN_TRANSIT",
  sorting: "IN_TRANSIT",
  delivering: "IN_TRANSIT",
  money_collect_delivering: "IN_TRANSIT",
  delivery_fail: "IN_TRANSIT",
  delivered: "DELIVERED",
  waiting_to_return: "RETURNING",
  return: "RETURNING",
  returning: "RETURNING",
  return_sorting: "RETURNING",
  return_transporting: "RETURNING",
  return_delivering: "RETURNING",
  returned: "RETURNED",
  cancel: "CANCELLED",
  exception: "FAILED",
  damage: "FAILED",
  lost: "FAILED",
};

export function mapGhnStatus(status: string): ShipmentStatus | null {
  return GHN_STATUS[status] ?? null;
}

/** Chỉ đề xuất bước đơn hàng mà máy trạng thái đơn cho phép. */
export function orderStatusAfterShipments(
  orderStatus: OrderStatus,
  shipmentStatuses: string[],
): OrderStatus | null {
  const active = shipmentStatuses.filter((status) => status && status !== "CANCELLED");
  if (active.length === 0) return null;
  const allDelivered = active.every((status) => status === "DELIVERED");
  const moving = active.some((status) =>
    ["PICKED", "IN_TRANSIT", "DELIVERED", "RETURNING", "RETURNED"].includes(status),
  );
  if (allDelivered && canTransitionOrder(orderStatus, "COMPLETED")) return "COMPLETED";
  if (moving && canTransitionOrder(orderStatus, "SHIPPING")) return "SHIPPING";
  return null;
}
