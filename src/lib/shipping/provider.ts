import {
  cancelGhnShipment,
  createGhnShipment,
  ghnEnv,
  parseGhnWebhook,
  resolveCarrierFee,
  tokenMatches,
  type CarrierEnv,
  type ShippingEnv,
} from "@/lib/shipping/ghn";

export type ShipmentDraft = {
  idempotencyKey: string;
  toName: string;
  toPhone: string;
  toAddress: string;
  toDistrictId?: number;
  toWardCode?: string;
  weightGrams: number;
  codAmount: number;
  provinceName?: string;
  wardName?: string;
};

export type ParsedWebhook = {
  eventId: string;
  status: string;
  clientOrderCode: string;
  orderCode: string;
};

export interface ShippingProvider {
  readonly code: "MANUAL" | "GHN" | "GHTK";
  quoteFee(input: { provinceName: string; wardName: string; weightGrams: number }): Promise<{ fee: number } | { error: string }>;
  createShipment(input: ShipmentDraft): Promise<{ trackingCode: string | null } | { error: string }>;
  cancelShipment(trackingCode: string): Promise<{ ok: boolean; error?: string }>;
  verifyWebhook(token: string | null): boolean;
  parseWebhook(raw: string): ParsedWebhook | null;
}

export class ManualProvider implements ShippingProvider {
  readonly code = "MANUAL" as const;

  async quoteFee() {
    return { error: "Chưa gọi hãng vận chuyển." };
  }

  async createShipment() {
    return { trackingCode: null };
  }

  async cancelShipment() {
    return { ok: true };
  }

  verifyWebhook(token: string | null) {
    return tokenMatches(token, "");
  }

  parseWebhook(): ParsedWebhook | null {
    return null;
  }
}

export class GhnProvider implements ShippingProvider {
  readonly code = "GHN" as const;

  constructor(
    private readonly env: CarrierEnv,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async quoteFee(input: { provinceName: string; wardName: string; weightGrams: number }) {
    const quoted = await resolveCarrierFee({
      provider: "GHN",
      provinceName: input.provinceName,
      wardName: input.wardName,
      weightGrams: input.weightGrams,
      fetchImpl: this.fetchImpl,
      env: { GHN_TOKEN: this.env.token, GHN_SHOP_ID: this.env.shopId, GHN_ENV: this.env.baseUrl.includes("dev-online") ? "sandbox" : "production" },
    });
    if (!quoted.available || quoted.fee === null) return { error: "GHN không trả phí." };
    return { fee: quoted.fee };
  }

  async createShipment(input: ShipmentDraft) {
    if (!this.env.enabled || !input.toDistrictId || !input.toWardCode) {
      return { error: "Chưa ánh xạ được địa chỉ sang GHN." };
    }
    try {
      const trackingCode = await createGhnShipment({
        env: this.env,
        idempotencyKey: input.idempotencyKey,
        toName: input.toName,
        toPhone: input.toPhone,
        toAddress: input.toAddress,
        toDistrictId: input.toDistrictId,
        toWardCode: input.toWardCode,
        weightGrams: input.weightGrams,
        codAmount: input.codAmount,
        fetchImpl: this.fetchImpl,
      });
      return { trackingCode };
    } catch {
      return { error: "GHN không tạo được vận đơn." };
    }
  }

  async cancelShipment(trackingCode: string) {
    try {
      const ok = await cancelGhnShipment(this.env, trackingCode, this.fetchImpl);
      return ok ? { ok: true } : { ok: false, error: "Hãng đã lấy hàng, không huỷ vận đơn." };
    } catch {
      return { ok: false, error: "GHN không huỷ được vận đơn." };
    }
  }

  verifyWebhook(token: string | null) {
    return tokenMatches(token, this.env.webhookToken);
  }

  parseWebhook(raw: string): ParsedWebhook | null {
    const event = parseGhnWebhook(raw);
    if (!event) return null;
    return {
      eventId: event.eventId,
      status: event.status,
      clientOrderCode: event.clientOrderCode,
      orderCode: event.orderCode,
    };
  }
}

export function providerFor(configProvider: string, env: ShippingEnv = process.env, fetchImpl?: typeof fetch): ShippingProvider {
  const ghn = ghnEnv(env);
  if (configProvider === "GHN" && ghn.enabled) return new GhnProvider(ghn, fetchImpl);
  return new ManualProvider();
}
