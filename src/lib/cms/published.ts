import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { getHomepageView, type HomepageViewMode } from "@/lib/cms/homepage";
import { DEFAULT_SITE_SETTINGS, type SiteSettingsData } from "@/lib/cms/types";

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
