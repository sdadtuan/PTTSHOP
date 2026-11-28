"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  hasMeasurementId,
  publicEventParams,
  scriptsForConsent,
  type MeasurementIds,
} from "@/lib/analytics/ids";
import { optionalTrackingAllowed } from "@/lib/tracking";

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;
type Ttq = { track: (event: string, params?: Record<string, unknown>, options?: { event_id?: string }) => void; page: () => void; load: (id: string) => void };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    fbq?: Fbq;
    ttq?: Ttq;
    __pttTrackingReady?: boolean;
    __pttMeasurementIds?: MeasurementIds;
  }
}

const EMPTY: MeasurementIds = { ga4: null, meta: null, tiktok: null, clarity: null };

function loadScript(src: string) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("tracker"));
    document.head.appendChild(script);
  });
}

let loading: Promise<void> | null = null;

export function setMeasurementIds(ids: MeasurementIds) {
  window.__pttMeasurementIds = ids;
}

export function ensureTrackers() {
  if (typeof window === "undefined") return Promise.resolve();
  const ids = window.__pttMeasurementIds ?? EMPTY;
  if (!optionalTrackingAllowed() || !hasMeasurementId(ids)) return Promise.resolve();
  if (window.__pttTrackingReady) return Promise.resolve();
  if (loading) return loading;
  const choice = document.cookie.split("; ").find((item) => item.startsWith("pttshop_cookie="))?.split("=")[1];
  const urls = scriptsForConsent(choice, ids);
  if (urls.length === 0) return Promise.resolve();
  loading = (async () => {
    if (ids.ga4) {
      window.dataLayer = window.dataLayer || [];
      if (!window.gtag) {
        window.gtag = (...args: unknown[]) => {
          window.dataLayer?.push(args);
        };
      }
      window.gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted",
      });
      await loadScript(urls[0]);
      window.gtag("js", new Date());
      window.gtag("config", ids.ga4);
    }
    if (ids.meta) {
      if (!window.fbq) {
        const fbq = ((...args: unknown[]) => {
          const fn = fbq as Fbq & { callMethod?: (...a: unknown[]) => void; queue: unknown[][] };
          if (fn.callMethod) fn.callMethod(...args);
          else fn.queue.push(args);
        }) as Fbq & { callMethod?: (...a: unknown[]) => void; queue: unknown[][]; loaded: boolean; version: string };
        fbq.queue = [];
        fbq.loaded = true;
        fbq.version = "2.0";
        window.fbq = fbq;
      }
      await loadScript("https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", ids.meta);
      window.fbq("track", "PageView");
    }
    if (ids.tiktok) {
      await loadScript(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${ids.tiktok}`);
    }
    if (ids.clarity) {
      await loadScript(`https://www.clarity.ms/tag/${ids.clarity}`);
    }
    window.__pttTrackingReady = true;
    window.dispatchEvent(new Event("pttshop-tracking-ready"));
  })().catch(() => {
    loading = null;
  });
  return loading;
}

export function AnalyticsOnce({
  name,
  params = {},
}: {
  name: string;
  params?: Record<string, string | number>;
}) {
  const serialized = JSON.stringify(params);
  useEffect(() => {
    void trackStoreEvent(name, JSON.parse(serialized) as Record<string, unknown>);
  }, [name, serialized]);
  return null;
}

export async function trackStoreEvent(name: string, params: Record<string, unknown> = {}) {
  const safe = publicEventParams(params);
  await ensureTrackers();
  if (!window.__pttTrackingReady) return;
  const ids = window.__pttMeasurementIds ?? EMPTY;
  if (ids.ga4) window.gtag?.("event", name, safe);
  if (ids.meta) window.fbq?.("trackCustom", name, safe);
  if (ids.tiktok) window.ttq?.track(name, safe);
}

export function Measurement({ ids }: { ids: MeasurementIds }) {
  const pathname = usePathname();
  useEffect(() => {
    setMeasurementIds(ids);
    if (pathname.startsWith("/admin")) return;
    void ensureTrackers();
    const onConsent = () => {
      void ensureTrackers();
    };
    window.addEventListener("pttshop-consent", onConsent);
    return () => window.removeEventListener("pttshop-consent", onConsent);
  }, [pathname, ids]);
  return null;
}
