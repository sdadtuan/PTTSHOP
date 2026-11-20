import { revalidatePath } from "next/cache";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { NavigationContent, NavLink } from "@/lib/cms/types";
import { parseSectionContent } from "@/lib/cms/validate";

export const DANH_GIA_NAV_PATCH_ID = "primary_nav_danh_gia_v1";
export const DANH_GIA_NAV_HREF = "/danh-gia";
export const DANH_GIA_NAV_LABEL = "Đánh Giá";

function hasDanhGiaLink(links: NavLink[]) {
  return links.some(
    (l) =>
      l.href === DANH_GIA_NAV_HREF ||
      l.href === `${DANH_GIA_NAV_HREF}/` ||
      /đánh\s*giá/i.test(l.label),
  );
}

/** Insert after Sản phẩm when possible; otherwise before Liên hệ; else append. */
export function insertDanhGiaNavLink(primaryNav: NavLink[]): NavLink[] {
  if (hasDanhGiaLink(primaryNav)) return primaryNav;
  const link: NavLink = { href: DANH_GIA_NAV_HREF, label: DANH_GIA_NAV_LABEL };
  const idxProduct = primaryNav.findIndex(
    (l) => l.href === "/san-pham" || /sản\s*phẩm/i.test(l.label),
  );
  if (idxProduct >= 0) {
    return [...primaryNav.slice(0, idxProduct + 1), link, ...primaryNav.slice(idxProduct + 1)];
  }
  const idxContact = primaryNav.findIndex(
    (l) => l.href === "/lien-he" || /liên\s*hệ/i.test(l.label),
  );
  if (idxContact >= 0) {
    return [...primaryNav.slice(0, idxContact), link, ...primaryNav.slice(idxContact)];
  }
  return [...primaryNav, link];
}

function patchNavigationContent(raw: string): { next: NavigationContent; changed: boolean } {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const nav = parseSectionContent("navigation", parsed) as NavigationContent;
    if (hasDanhGiaLink(nav.primaryNav)) return { next: nav, changed: false };
    const primaryNav = insertDanhGiaNavLink(nav.primaryNav);
    return { next: { ...nav, primaryNav }, changed: true };
  } catch {
    return { next: parseSectionContent("navigation", {}) as NavigationContent, changed: false };
  }
}

type Db = Pick<PrismaClient, "cmsPatch" | "homepageSection">;

/**
 * One-time patch for Version A primary nav only (not demoPrimaryNav).
 * After applied, never runs again — admin can remove the link without it coming back.
 */
export async function ensureDanhGiaNavPatch(db: Db = prisma): Promise<boolean> {
  const done = await db.cmsPatch.findUnique({ where: { id: DANH_GIA_NAV_PATCH_ID } });
  if (done) return false;

  const section = await db.homepageSection.findUnique({ where: { key: "navigation" } });
  if (!section) return false;

  const published = patchNavigationContent(section.contentJson);
  const draft = patchNavigationContent(section.draftContentJson);

  await db.$transaction(async (tx) => {
    if (published.changed || draft.changed) {
      await tx.homepageSection.update({
        where: { key: "navigation" },
        data: {
          ...(published.changed ? { contentJson: JSON.stringify(published.next) } : {}),
          ...(draft.changed ? { draftContentJson: JSON.stringify(draft.next) } : {}),
        },
      });
    }
    await tx.cmsPatch.create({ data: { id: DANH_GIA_NAV_PATCH_ID } });
  });

  try {
    revalidatePath("/", "layout");
  } catch {
    // noop when not in Next.js request (CLI script)
  }

  return published.changed || draft.changed;
}