import type { PrismaClient } from "@prisma/client";

export const COOKIE_CHOICE = "pttshop_cookie";
export const GA4_MEASUREMENT_ID = "G-69N0FCKD7P";
export const META_PIXEL_ID = "1508219437865650";

export const CONSENT_DEFAULT_SCRIPT =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}" +
  "gtag('consent','default',{" +
  "ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'," +
  "wait_for_update:500});";

const GA4_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
const META_SRC = "https://connect.facebook.net/en_US/fbevents.js";

export function trackerScriptUrls() {
  return [GA4_SRC, META_SRC];
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
  const channels = ["ga4", "meta"] as const;
  const claimed = { ga4: false, meta: false };
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
