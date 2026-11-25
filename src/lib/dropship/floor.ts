/** Tham số công thức G. Phần vạn: 1500 = 15%. Tiền là đồng. */
export type FloorParams = {
  manualFloor: number | null;
  marginBps: number;
  returnBps: number;
  adsBps: number;
  feeBps: number;
  vatBps: number;
  shippingCost: number;
  paymentCost: number;
  fixedCost: number;
};

export const DEFAULT_FLOOR_PARAMS: FloorParams = {
  manualFloor: null,
  marginBps: 1500,
  returnBps: 500,
  adsBps: 0,
  feeBps: 0,
  vatBps: 0,
  shippingCost: 0,
  paymentCost: 0,
  fixedCost: 0,
};

/** Giá niêm yết từ G, làm tròn lên 1.000đ. Null khi mẫu số không dương. */
export function listedPriceFromCost(cost: number, params: FloorParams): number | null {
  const denom = 10_000 - params.feeBps - params.returnBps - params.adsBps - params.marginBps;
  if (!Number.isInteger(cost) || cost < 0 || denom <= 0) return null;
  const g = ((cost + params.shippingCost + params.paymentCost + params.fixedCost) * 10_000) / denom;
  const withVat = (g * (10_000 + params.vatBps)) / 10_000;
  return Math.ceil(withVat / 1000) * 1000;
}

/** max(giá sàn nhập tay, giá niêm yết từ G). Thiếu cả hai thì chưa có giá sàn. */
export function effectiveFloor(cost: number | null, params: FloorParams): number | null {
  const fromG = cost == null ? null : listedPriceFromCost(cost, params);
  const values = [params.manualFloor, fromG].filter((value): value is number => value != null);
  if (values.length === 0) return null;
  return Math.max(...values);
}

export function priceBelowFloor(price: number, floor: number | null) {
  return floor != null && price < floor;
}
