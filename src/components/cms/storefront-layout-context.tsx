"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_SITE_SETTINGS, type SiteSettingsData } from "@/lib/cms/types";
import type {
  FloatingContactContent,
  FooterLinksContent,
  NavigationContent,
  ReviewsSectionContent,
} from "@/lib/cms/types";
import { defaultSectionContent } from "@/lib/cms/types";
import { DEFAULT_STOREFRONT_UI, type StorefrontUiCopy } from "@/lib/storefront/ui-copy-types";

export type StorefrontLayoutData = {
  settings: SiteSettingsData;
  navigation: NavigationContent;
  footerLinks: FooterLinksContent;
  floatingContact: FloatingContactContent;
  reviews: ReviewsSectionContent;
  ui: StorefrontUiCopy;
};

const defaults: StorefrontLayoutData = {
  settings: DEFAULT_SITE_SETTINGS,
  navigation: defaultSectionContent("navigation") as StorefrontLayoutData["navigation"],
  footerLinks: defaultSectionContent("footer_links") as StorefrontLayoutData["footerLinks"],
  floatingContact: defaultSectionContent("floating_contact") as StorefrontLayoutData["floatingContact"],
  reviews: defaultSectionContent("reviews") as StorefrontLayoutData["reviews"],
  ui: DEFAULT_STOREFRONT_UI,
};

const StorefrontLayoutContext = createContext<StorefrontLayoutData>(defaults);

export function StorefrontLayoutProvider({
  value,
  children,
}: {
  value: StorefrontLayoutData;
  children: ReactNode;
}) {
  return (
    <StorefrontLayoutContext.Provider value={value}>
      {children}
    </StorefrontLayoutContext.Provider>
  );
}

export function useStorefrontLayout() {
  return useContext(StorefrontLayoutContext);
}

export function useStorefrontUi() {
  return useContext(StorefrontLayoutContext).ui;
}