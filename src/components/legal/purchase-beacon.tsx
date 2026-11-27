"use client";

import { useEffect } from "react";
import { purchaseParams } from "@/lib/tracking";
import { ensureTrackers } from "@/components/legal/measurement";

type Props = {
  orderNumber: string;
  value: number;
};

export function PurchaseBeacon({ orderNumber, value }: Props) {
  useEffect(() => {
    let cancelled = false;
    let sent = false;
    const send = () => {
      if (cancelled || sent) return;
      void (async () => {
        await ensureTrackers();
        if (cancelled || sent || !window.__pttTrackingReady) return;
        if (sessionStorage.getItem(`ptt-purchase-${orderNumber}`) === "1") return;
        const res = await fetch("/api/analytics/purchase", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderNumber }),
        });
        const data = (await res.json()) as { ga4?: boolean; meta?: boolean; tiktok?: boolean; value?: number };
        if (cancelled || typeof data.value !== "number") return;
        sent = true;
        sessionStorage.setItem(`ptt-purchase-${orderNumber}`, "1");
        const params = purchaseParams(orderNumber, data.value);
        if (data.ga4) window.gtag?.("event", "purchase", params);
        if (data.meta) {
          window.fbq?.("track", "Purchase", { currency: params.currency, value: params.value }, { eventID: params.event_id });
        }
        if (data.tiktok) {
          window.ttq?.track("Purchase", { currency: params.currency, value: params.value }, { event_id: params.event_id });
        }
      })();
    };
    send();
    window.addEventListener("pttshop-consent", send);
    return () => {
      cancelled = true;
      window.removeEventListener("pttshop-consent", send);
    };
  }, [orderNumber, value]);
  return null;
}
