"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ShopProfile } from "@/lib/shop/profile";

const EMPTY_PROFILE: ShopProfile = {
  hotline: null,
  email: null,
  address: null,
  hours: null,
  zaloUrl: null,
  freeShipThreshold: null,
  fallbackFee: null,
  returnWindowDays: null,
  codEnabled: true,
  bankTransferEnabled: false,
  bankVisible: false,
  lowStockThreshold: null,
};

const ShopProfileContext = createContext<ShopProfile>(EMPTY_PROFILE);

export function ShopProfileProvider({ value, children }: { value: ShopProfile; children: ReactNode }) {
  return <ShopProfileContext.Provider value={value}>{children}</ShopProfileContext.Provider>;
}

export function useShopProfile() {
  return useContext(ShopProfileContext);
}
