import { timingSafeEqual } from "crypto";
import { foldAddress, matchGhnWard, type GhnWard } from "@/lib/shipping/address-map";

const SANDBOX_BASE = "https://dev-online-gateway.ghn.vn/shiip/public-api";
const PRODUCTION_BASE = "https://online-gateway.ghn.vn/shiip/public-api";

export type CarrierEnv = {
  token: string;
  shopId: string;
  webhookToken: string;
  enabled: boolean;
  webhookEnabled: boolean;
  baseUrl: string;
};

export type ShippingEnv = Record<string, string | undefined>;

export function ghnEnv(env: ShippingEnv = process.env): CarrierEnv {
  const token = env.GHN_TOKEN?.trim() || "";
  const shopId = env.GHN_SHOP_ID?.trim() || "";
  const webhookToken = env.GHN_WEBHOOK_TOKEN?.trim() || "";
  return {
    token,
    shopId,
    webhookToken,
    enabled: Boolean(token && shopId),
    webhookEnabled: Boolean(webhookToken),
    baseUrl: env.GHN_ENV === "production" ? PRODUCTION_BASE : SANDBOX_BASE,
  };
}

export function tokenMatches(given: string | null, secret: string) {
  if (!given || !secret) return false;
  const left = Buffer.from(given);
  const right = Buffer.from(secret);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

type FetchLike = typeof fetch;

export async function resolveCarrierFee(input: {
  provider: string;
  env?: ShippingEnv;
  provinceName: string;
  wardName: string;
  weightGrams: number;
  fromProvinceName?: string;
  fromWardName?: string;
  fetchImpl?: FetchLike;
}): Promise<{ available: boolean; fee: number | null }> {
  const env = ghnEnv(input.env);
  if (input.provider !== "GHN" || !env.enabled) return { available: false, fee: null };
  try {
    const fetchImpl = input.fetchImpl || fetch;
    const to = await findGhnDestination(
      { provinceName: input.provinceName, wardName: input.wardName, token: env.token, baseUrl: env.baseUrl },
      fetchImpl,
    );
    const from =
      input.fromProvinceName && input.fromWardName
        ? await findGhnDestination(
            {
              provinceName: input.fromProvinceName,
              wardName: input.fromWardName,
              token: env.token,
              baseUrl: env.baseUrl,
            },
            fetchImpl,
          )
        : null;
    if (!to) return { available: false, fee: null };
    const response = await ghnPost(
      env,
      "/v2/shipping-order/fee",
      {
        service_type_id: input.weightGrams > 20_000 ? 5 : 2,
        to_district_id: to.districtId,
        to_ward_code: to.wardCode,
        from_district_id: from?.districtId,
        from_ward_code: from?.wardCode,
        weight: input.weightGrams,
        insurance_value: 0,
      },
      fetchImpl,
    );
    const data = response?.data;
    const fee = Number(data && !Array.isArray(data) ? data.total : undefined);
    if (!Number.isInteger(fee) || fee < 0) return { available: false, fee: null };
    return { available: true, fee };
  } catch {
    return { available: false, fee: null };
  }
}

const destinationCache = new Map<string, GhnWard[]>();

export async function findGhnDestination(
  input: { provinceName: string; wardName: string; token: string; baseUrl: string },
  fetchImpl: FetchLike,
) {
  const wards = await wardsForProvince(input, fetchImpl);
  if (!wards) return null;
  return matchGhnWard(input, wards);
}

async function wardsForProvince(
  input: { provinceName: string; token: string; baseUrl: string },
  fetchImpl: FetchLike,
) {
  const key = input.provinceName;
  const cached = destinationCache.get(key);
  if (cached) return cached;
  const provinces = await ghnGet(input, "/master-data/province", fetchImpl);
  const province = (provinces?.data || []).find(
    (row: { ProvinceName?: string }) =>
      matchName(row.ProvinceName || "", input.provinceName),
  );
  if (!province?.ProvinceID) return null;
  const districts = await ghnGet(
    input,
    `/master-data/district?province_id=${province.ProvinceID}`,
    fetchImpl,
  );
  const wards: GhnWard[] = [];
  for (const district of districts?.data || []) {
    const list = await ghnGet(
      input,
      `/master-data/ward?district_id=${district.DistrictID}`,
      fetchImpl,
    );
    for (const ward of list?.data || []) {
      wards.push({
        provinceName: input.provinceName,
        districtId: Number(district.DistrictID),
        districtName: String(district.DistrictName || ""),
        wardCode: String(ward.WardCode),
        wardName: String(ward.WardName || ""),
      });
    }
  }
  destinationCache.set(key, wards);
  return wards;
}

function matchName(candidate: string, expected: string) {
  return foldAddress(candidate) === foldAddress(expected);
}

async function ghnGet(
  input: { token: string; baseUrl: string },
  path: string,
  fetchImpl: FetchLike,
) {
  const response = await fetchImpl(`${input.baseUrl}${path}`, {
    headers: { Token: input.token, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("GHN master data failed");
  return response.json();
}

export async function ghnPost(
  env: CarrierEnv,
  path: string,
  body: Record<string, unknown>,
  fetchImpl: FetchLike = fetch,
) {
  const response = await fetchImpl(`${env.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Token: env.token,
      ShopId: env.shopId,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.code !== 200) {
    throw new Error("GHN request failed");
  }
  return payload as { data?: { total?: number; order_code?: string; result?: boolean } | { result?: boolean }[] };
}

export async function createGhnShipment(input: {
  env: CarrierEnv;
  idempotencyKey: string;
  toName: string;
  toPhone: string;
  toAddress: string;
  toDistrictId: number;
  toWardCode: string;
  weightGrams: number;
  codAmount: number;
  fetchImpl?: FetchLike;
}) {
  const payload = await ghnPost(
    input.env,
    "/v2/shipping-order/create",
    {
      client_order_code: input.idempotencyKey,
      to_name: input.toName,
      to_phone: input.toPhone,
      to_address: input.toAddress,
      to_ward_code: input.toWardCode,
      to_district_id: input.toDistrictId,
      weight: input.weightGrams,
      length: 20,
      width: 15,
      height: 10,
      service_type_id: input.weightGrams > 20_000 ? 5 : 2,
      payment_type_id: 1,
      cod_amount: input.codAmount,
      required_note: "KHONGCHOXEMHANG",
      items: [{ name: "Hang PTT Shop", quantity: 1 }],
    },
    input.fetchImpl,
  );
  const code = payload.data && !Array.isArray(payload.data) ? payload.data.order_code : undefined;
  if (!code) throw new Error("GHN did not return a waybill");
  return code;
}

export async function cancelGhnShipment(env: CarrierEnv, trackingCode: string, fetchImpl: FetchLike = fetch) {
  const payload = await ghnPost(
    env,
    "/v2/switch-status/cancel",
    { order_codes: [trackingCode], reason_code: "GHN-CANCEL-OTHER", reason: "Shop huy don" },
    fetchImpl,
  );
  const row = Array.isArray(payload.data) ? payload.data[0] : undefined;
  if (row && row.result === false) return false;
  return true;
}

export type GhnWebhook = {
  eventId: string;
  clientOrderCode: string;
  orderCode: string;
  status: string;
  shopId: number;
};

export function parseGhnWebhook(raw: string): GhnWebhook | null {
  try {
    const body = JSON.parse(raw) as Record<string, unknown>;
    const orderCode = String(body.OrderCode || "");
    const type = String(body.Type || "");
    const time = String(body.Time || "");
    if (!orderCode || !type || !time) return null;
    return {
      eventId: `${orderCode}:${type}:${time}`,
      clientOrderCode: String(body.ClientOrderCode || ""),
      orderCode,
      status: String(body.Status || ""),
      shopId: Number(body.ShopID || 0),
    };
  } catch {
    return null;
  }
}
