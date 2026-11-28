import type { PrismaClient } from "@prisma/client";
import { scriptsForConsent, type MeasurementIds } from "@/lib/analytics/ids";

export const COOKIE_CHOICE = "pttshop_cookie";

export const CONSENT_DEFAULT_SCRIPT =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}" +
  "gtag('consent','default',{" +
  "ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'," +
  "wait_for_update:500});";

export function trackerScriptUrls(ids: MeasurementIds) {
  return scriptsForConsent("all", ids);
}

export function optionalTrackingAllowed() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").includes(`${COOKIE_CHOICE}=all`);
}

export function consentGranted(cookieHeader: string | null | undefined) {
  if (!cookieHeader) return false;
  return cookieHeader.split(";").some((part) => part.trim() === `${COOKIE_CHOICE}=all`);
}

export function purchaseParams(orderNumber: string, value: number) {
  return {
    transaction_id: orderNumber,
    event_id: orderNumber,
    currency: "VND",
    value,
  };
}

type ClaimDb = Pick<PrismaClient, "analyticsEvent">;

/** Inserts one row per channel. A second call for the same order returns false for that channel. */
export async function claimPurchase(db: ClaimDb, orderNumber: string) {
  const channels = ["ga4", "meta", "tiktok"] as const;
  const claimed = { ga4: false, meta: false, tiktok: false };
  for (const channel of channels) {
    const result = await db.analyticsEvent.createMany({
      data: {
        orderNumber,
        channel,
        eventName: "purchase",
        eventId: orderNumber,
      },
      skipDuplicates: true,
    });
    claimed[channel] = result.count > 0;
  }
  return claimed;
}
