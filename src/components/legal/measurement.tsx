"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  GA4_MEASUREMENT_ID,
  META_PIXEL_ID,
  optionalTrackingAllowed,
  trackerScriptUrls,
} from "@/lib/tracking";

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    fbq?: Fbq;
    __pttTrackingReady?: boolean;
  }
}

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

export function ensureTrackers() {
  if (typeof window === "undefined") return Promise.resolve();
  if (!optionalTrackingAllowed()) return Promise.resolve();
  if (window.__pttTrackingReady) return Promise.resolve();
  if (loading) return loading;
  loading = (async () => {
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
    const [ga4Src, metaSrc] = trackerScriptUrls();
    await loadScript(ga4Src);
    window.gtag("js", new Date());
    window.gtag("config", GA4_MEASUREMENT_ID);
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
    await loadScript(metaSrc);
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
    window.__pttTrackingReady = true;
    window.dispatchEvent(new Event("pttshop-tracking-ready"));
  })().catch(() => {
    loading = null;
  });
  return loading;
}

export function Measurement() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    void ensureTrackers();
    const onConsent = () => {
      void ensureTrackers();
    };
    window.addEventListener("pttshop-consent", onConsent);
    return () => window.removeEventListener("pttshop-consent", onConsent);
  }, [pathname]);
  return null;
}
