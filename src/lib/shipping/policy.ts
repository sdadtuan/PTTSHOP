/** Khối lượng một kiện khi sản phẩm chưa có cân nặng, tính bằng gam [cần chốt]. */
export const DEFAULT_PARCEL_WEIGHT_GRAMS = 500;

export type ShippingConfig = {
  freeShipThreshold: number | null;
  fallbackFee: number | null;
  intraProvinceFee: number | null;
  interProvinceFee: number | null;
  parcelWeightGrams: number;
  warehouseProvinceCode: string;
  warehouseWardCode: string;
  warehouseAddress: string;
  senderName: string;
  senderPhone: string;
  defaultProvider: "MANUAL" | "GHN" | "GHTK";
};

export type ShippingSource = "FREE" | "CARRIER" | "INTRA" | "INTER" | "FALLBACK" | "PENDING";

export function normalizeShippingConfig(
  row: Partial<{
    freeShipThreshold: number | null;
    fallbackFee: number | null;
    intraProvinceFee: number | null;
    interProvinceFee: number | null;
    parcelWeightGrams: number | null;
    warehouseProvinceCode: string | null;
    warehouseWardCode: string | null;
    warehouseAddress: string | null;
    senderName: string | null;
    senderPhone: string | null;
    defaultProvider: string | null;
  }> | null,
): ShippingConfig {
  const provider = row?.defaultProvider;
  return {
    freeShipThreshold: optionalPositive(row?.freeShipThreshold),
    fallbackFee: optionalFee(row?.fallbackFee),
    intraProvinceFee: optionalFee(row?.intraProvinceFee),
    interProvinceFee: optionalFee(row?.interProvinceFee),
    parcelWeightGrams: positiveOr(row?.parcelWeightGrams, DEFAULT_PARCEL_WEIGHT_GRAMS),
    warehouseProvinceCode: row?.warehouseProvinceCode?.trim() || "",
    warehouseWardCode: row?.warehouseWardCode?.trim() || "",
    warehouseAddress: row?.warehouseAddress?.trim() || "",
    senderName: row?.senderName?.trim() || "",
    senderPhone: row?.senderPhone?.trim() || "",
    defaultProvider: provider === "GHN" || provider === "GHTK" ? provider : "MANUAL",
  };
}

function positiveOr(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

function optionalPositive(value: number | null | undefined) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function optionalFee(value: number | null | undefined) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

/**
 * Một quy tắc phí cho cả site. Không đọc số tiền client gửi lên.
 * sameProvince = null khi chưa biết tỉnh kho hoặc tỉnh nhận.
 */
export function shippingFeeForCheckout(
  input: Parameters<typeof decideShippingFee>[0] & { clientFee?: number },
) {
  return decideShippingFee(input);
}

export function decideShippingFee(input: {
  subtotal: number;
  config: ShippingConfig;
  sameProvince: boolean | null;
  carrierFee: number | null;
  carrierAvailable: boolean;
}): { fee: number | null; source: ShippingSource } {
  if (input.config.freeShipThreshold != null && input.subtotal >= input.config.freeShipThreshold) {
    return { fee: 0, source: "FREE" };
  }
  if (input.carrierAvailable && typeof input.carrierFee === "number" && input.carrierFee >= 0) {
    return { fee: input.carrierFee, source: "CARRIER" };
  }
  if (input.sameProvince === true && input.config.intraProvinceFee !== null) {
    return { fee: input.config.intraProvinceFee, source: "INTRA" };
  }
  if (input.sameProvince === false && input.config.interProvinceFee !== null) {
    return { fee: input.config.interProvinceFee, source: "INTER" };
  }
  if (input.config.fallbackFee != null) return { fee: input.config.fallbackFee, source: "FALLBACK" };
  return { fee: null, source: "PENDING" };
}

export function sameProvince(warehouseCode: string, destinationCode: string): boolean | null {
  if (!warehouseCode || !destinationCode) return null;
  return warehouseCode === destinationCode;
}
