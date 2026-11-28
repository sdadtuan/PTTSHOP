import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { getHomepageView, type HomepageViewMode } from "@/lib/cms/homepage";
import {
  DEFAULT_SITE_SETTINGS,
  defaultSectionContent,
  type FloatingContactContent,
  type FooterLinksContent,
  type NavigationContent,
  type ReviewsSectionContent,
  type SiteSettingsData,
} from "@/lib/cms/types";
import { lookbookNav } from "@/lib/looks";
import { quizIsOpen, quizNav } from "@/lib/quiz";
import { prisma } from "@/lib/prisma";
import { getStorefrontUi } from "@/lib/storefront/ui-copy";

/** Header set by middleware for `/?cmsPreview=draft` requests from an ADMIN session. */
export const CMS_PREVIEW_HEADER = "x-cms-preview";

/** Draft mode only when the middleware flagged the request AND the session is ADMIN. */
export async function resolveHomepageMode(): Promise<HomepageViewMode> {
  try {
    const h = await headers();
    if (h.get(CMS_PREVIEW_HEADER) !== "draft") return "published";
    const session = await auth();
    return session?.user?.role === "ADMIN" ? "draft" : "published";
  } catch {
    return "published";
  }
}

/** One CMS read per request even though layout + page both need it. */
const viewForMode = cache((mode: HomepageViewMode) => getHomepageView(mode));

export async function getSiteSettingsForRequest(): Promise<SiteSettingsData> {
  try {
    const data = await viewForMode(await resolveHomepageMode());
    return data.settings;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

/** Kept for existing imports. */
export async function getPublishedSiteSettings(): Promise<SiteSettingsData> {
  return getSiteSettingsForRequest();
}

export async function getHomeSectionsForRequest() {
  return viewForMode(await resolveHomepageMode());
}

export async function getPublishedHomeSections() {
  return getHomepageView("published");
}

export type StorefrontLayoutSnapshot = {
  settings: SiteSettingsData;
  navigation: NavigationContent;
  footerLinks: FooterLinksContent;
  floatingContact: FloatingContactContent;
  reviews: ReviewsSectionContent;
  ui: Awaited<ReturnType<typeof getStorefrontUi>>;
};

async function publishedLookCount() {
  try {
    return await prisma.look.count({ where: { isPublished: true } });
  } catch {
    return 0;
  }
}

async function quizOpen() {
  try {
    const [settings, activeQuestions] = await Promise.all([
      prisma.quizSettings.findUnique({ where: { id: "default" } }),
      prisma.quizQuestion.count({ where: { isActive: true } }),
    ]);
    return quizIsOpen({ enabled: settings?.enabled === true, activeQuestions });
  } catch {
    return false;
  }
}

export async function getStorefrontLayoutForRequest(): Promise<StorefrontLayoutSnapshot> {
  try {
    const [data, ui, looks, quiz] = await Promise.all([
      viewForMode(await resolveHomepageMode()),
      getStorefrontUi("published"),
      publishedLookCount(),
      quizOpen(),
    ]);
    const navigation = (data.sections.navigation?.content ??
      defaultSectionContent("navigation")) as NavigationContent;
    return {
      settings: data.settings,
      ui,
      navigation: { ...navigation, primaryNav: quizNav(lookbookNav(navigation.primaryNav, looks), quiz) },
      footerLinks: (data.sections.footer_links?.content ??
        defaultSectionContent("footer_links")) as FooterLinksContent,
      floatingContact: (data.sections.floating_contact?.content ??
        defaultSectionContent("floating_contact")) as FloatingContactContent,
      reviews: (data.sections.reviews?.content ??
        defaultSectionContent("reviews")) as ReviewsSectionContent,
    };
  } catch {
    const ui = await getStorefrontUi("published");
    return {
      settings: DEFAULT_SITE_SETTINGS,
      navigation: defaultSectionContent("navigation") as NavigationContent,
      footerLinks: defaultSectionContent("footer_links") as FooterLinksContent,
      floatingContact: defaultSectionContent("floating_contact") as FloatingContactContent,
      reviews: defaultSectionContent("reviews") as ReviewsSectionContent,
      ui,
    };
  }
}
