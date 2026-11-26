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
  const admin = pathname.startsWith("/admin");

  useEffect(() => {
    scroller.current?.scrollTo(0, 0);
  }, [pathname]);

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
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
      {banner}
      {extras}
    </div>
  );
}
