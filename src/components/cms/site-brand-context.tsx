"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettingsData,
} from "@/lib/cms/types";

const SiteBrandContext = createContext<SiteSettingsData>(DEFAULT_SITE_SETTINGS);

export function SiteBrandProvider({
  settings,
  children,
}: {
  settings: SiteSettingsData;
  children: ReactNode;
}) {
  return (
    <SiteBrandContext.Provider value={settings}>
      {children}
    </SiteBrandContext.Provider>
  );
}

export function useSiteBrand() {
  return useContext(SiteBrandContext);
}
