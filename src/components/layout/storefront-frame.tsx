"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/** Banner cookie nằm dưới vùng cuộn, không đè giá, CTA hay form thanh toán. */
export function StorefrontFrame({
  header,
  banner,
  extras,
  children,
}: {
  header: ReactNode;
  banner: ReactNode;
  extras: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const scroller = useRef<HTMLDivElement>(null);
  const bannerSlot = useRef<HTMLDivElement>(null);
  const admin = pathname.startsWith("/admin");

  useEffect(() => {
    scroller.current?.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const node = bannerSlot.current;
    if (!node || admin) return;
    const apply = () => {
      document.documentElement.style.setProperty("--ptt-cookie-offset", `${node.offsetHeight}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--ptt-cookie-offset");
    };
  }, [admin, pathname]);

  if (admin) {
    return (
      <>
        {header}
        {children}
        {banner}
        {extras}
      </>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <div className="shrink-0">{header}</div>
      <div ref={scroller} data-storefront-scroller className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
      <div ref={bannerSlot} className="shrink-0">
        {banner}
      </div>
      {extras}
    </div>
  );
}
