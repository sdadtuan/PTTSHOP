import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SITE_SETTINGS,
  defaultSectionContent,
  defaultSectionsSeed,
  type HomepageSectionKey,
  type HomepageSnapshot,
  type SectionContentMap,
  type SiteSettingsData,
  HOMEPAGE_SECTION_KEYS,
  SECTION_LABELS,
} from "@/lib/cms/types";
import { parseSectionContent, siteSettingsSchema } from "@/lib/cms/validate";

/** "published" = what customers see; "draft" = admin preview of unsaved-to-live edits. */
export type HomepageViewMode = "published" | "draft";

type SettingsRow = {
  brandName: string;
  brandColor: string;
  logoUrl: string | null;
  footerTagline: string | null;
  contactAddress: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactHours: string | null;
  socialInstagram: string | null;
  socialFacebook: string | null;
  socialTiktok: string | null;
  socialYoutube: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  draftJson: string | null;
};

type SectionRow = {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
  draftSortOrder: number;
  isEnabled: boolean;
  draftEnabled: boolean;
  contentJson: string;
  draftContentJson: string;
  updatedAt: Date;
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isSectionKey(key: string): key is HomepageSectionKey {
  return (HOMEPAGE_SECTION_KEYS as readonly string[]).includes(key);
}

function normalizeSettings(input: unknown, fallback: SiteSettingsData): SiteSettingsData {
  const merged = { ...fallback, ...(input && typeof input === "object" ? input : {}) };
  const parsed = siteSettingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : fallback;
}

export function settingsFromRow(row: SettingsRow): {
  published: SiteSettingsData;
  draft: SiteSettingsData;
} {
  const d = DEFAULT_SITE_SETTINGS;
  const published: SiteSettingsData = {
    brandName: row.brandName || d.brandName,
    brandColor: row.brandColor || d.brandColor,
    logoUrl: row.logoUrl || null,
    footerTagline: row.footerTagline ?? d.footerTagline,
    contactAddress: row.contactAddress ?? d.contactAddress,
    contactEmail: row.contactEmail ?? d.contactEmail,
    contactPhone: row.contactPhone ?? d.contactPhone,
    contactHours: row.contactHours ?? d.contactHours,
    socialInstagram: row.socialInstagram ?? d.socialInstagram,
    socialFacebook: row.socialFacebook ?? d.socialFacebook,
    socialTiktok: row.socialTiktok ?? d.socialTiktok,
    socialYoutube: row.socialYoutube ?? d.socialYoutube,
    seoTitle: row.seoTitle ?? d.seoTitle,
    seoDescription: row.seoDescription ?? d.seoDescription,
  };
  const draftParsed = parseJson<Partial<SiteSettingsData> | null>(row.draftJson, null);
  const draft = draftParsed ? normalizeSettings(draftParsed, published) : { ...published };
  return { published, draft };
}

function settingsColumns(s: SiteSettingsData) {
  return {
    brandName: s.brandName,
    brandColor: s.brandColor,
    logoUrl: s.logoUrl || null,
    footerTagline: s.footerTagline,
    contactAddress: s.contactAddress,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    contactHours: s.contactHours,
    socialInstagram: s.socialInstagram,
    socialFacebook: s.socialFacebook,
    socialTiktok: s.socialTiktok,
    socialYoutube: s.socialYoutube,
    seoTitle: s.seoTitle,
    seoDescription: s.seoDescription,
  };
}

/** Parse stored JSON for a section; any invalid/missing field falls back to the 6003c40 defaults. */
function contentForKey<K extends HomepageSectionKey>(key: K, raw: string): SectionContentMap[K] {
  const fallback = defaultSectionContent(key) as SectionContentMap[K];
  const parsed = parseJson<Record<string, unknown>>(raw, {});
  try {
    return parseSectionContent(key, {
      ...(fallback as object),
      ...parsed,
    }) as unknown as SectionContentMap[K];
  } catch {
    return fallback;
  }
}

let seeding: Promise<void> | null = null;

/** Idempotent: creates default rows (exactly the 6003c40 content) only when missing. */
export async function ensureHomepageCmsSeeded() {
  if (seeding) return seeding;
  seeding = seedInner().finally(() => {
    seeding = null;
  });
  return seeding;
}

async function seedInner() {
  const existingKeys = new Set(
    (await prisma.homepageSection.findMany({ select: { key: true } })).map((s) => s.key),
  );
  const missing = defaultSectionsSeed().filter((s) => !existingKeys.has(s.key));
  for (const s of missing) {
    await prisma.homepageSection.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key,
        label: s.label,
        sortOrder: s.sortOrder,
        draftSortOrder: s.sortOrder,
        isEnabled: s.isEnabled,
        draftEnabled: s.isEnabled,
        contentJson: JSON.stringify(s.content),
        draftContentJson: JSON.stringify(s.content),
      },
    });
  }

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      ...settingsColumns(DEFAULT_SITE_SETTINGS),
      draftJson: JSON.stringify(DEFAULT_SITE_SETTINGS),
      publishedAt: new Date(),
    },
  });

  if ((await prisma.homepageVersion.count()) === 0) {
    await prisma.homepageVersion.create({
      data: {
        version: 1,
        label: "Bản gốc (giao diện 6003c40)",
        snapshotJson: JSON.stringify(await buildSnapshot("published")),
      },
    });
  }
}

async function loadRows() {
  const [settingsRow, sectionRows, heroBanner] = await Promise.all([
    prisma.siteSettings.findUniqueOrThrow({ where: { id: "default" } }),
    prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } }) as Promise<SectionRow[]>,
    prisma.heroBanner.findFirst({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ]);
  return { settingsRow, sectionRows, heroBanner };
}

async function buildSnapshot(mode: HomepageViewMode): Promise<HomepageSnapshot> {
  const { settingsRow, sectionRows } = await loadRows();
  const { published, draft } = settingsFromRow(settingsRow);
  return {
    settings: mode === "draft" ? draft : published,
    sections: sectionRows
      .filter((s) => isSectionKey(s.key))
      .map((s) => {
        const key = s.key as HomepageSectionKey;
        return {
          key,
          label: s.label,
          sortOrder: mode === "draft" ? s.draftSortOrder : s.sortOrder,
          isEnabled: mode === "draft" ? s.draftEnabled : s.isEnabled,
          content: contentForKey(key, mode === "draft" ? s.draftContentJson : s.contentJson),
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function buildPublishedSnapshot(): Promise<HomepageSnapshot> {
  await ensureHomepageCmsSeeded();
  return buildSnapshot("published");
}

export type HomepageViewSection = HomepageSnapshot["sections"][number];

/**
 * Homepage data for the storefront. Never throws: if the CMS tables are empty or broken,
 * returns the hard-coded 6003c40 defaults so the site keeps rendering.
 */
export async function getHomepageView(mode: HomepageViewMode = "published") {
  let snapshot: HomepageSnapshot;
  let heroBanner: Awaited<ReturnType<typeof loadRows>>["heroBanner"] = null;
  try {
    await ensureHomepageCmsSeeded();
    snapshot = await buildSnapshot(mode);
    heroBanner = (await loadRows()).heroBanner;
  } catch {
    snapshot = {
      settings: DEFAULT_SITE_SETTINGS,
      sections: defaultSectionsSeed().map((s) => ({ ...s })),
    };
  }

  const byKey = {} as Record<HomepageSectionKey, HomepageViewSection>;
  for (const s of snapshot.sections) byKey[s.key] = s;
  for (const key of HOMEPAGE_SECTION_KEYS) {
    if (!byKey[key]) {
      byKey[key] = {
        key,
        label: SECTION_LABELS[key],
        sortOrder: HOMEPAGE_SECTION_KEYS.indexOf(key),
        isEnabled: key !== "promo_banner",
        content: defaultSectionContent(key),
      };
    }
  }

  // Hero shatter image is managed in /admin/banners (HeroBanner). When the hero section
  // uses it, the active banner's image wins; text/buttons come from the CMS.
  const hero = byKey.hero.content as SectionContentMap["hero"];
  if (hero.useHeroBanner && heroBanner?.imageUrl) {
    byKey.hero = { ...byKey.hero, content: { ...hero, imageUrl: heroBanner.imageUrl } };
  }

  return { mode, settings: snapshot.settings, sections: byKey, heroBanner };
}

/** Back-compat alias used by tests and the public API. */
export async function getPublishedHomepage() {
  return getHomepageView("published");
}

export async function getAdminCmsState() {
  await ensureHomepageCmsSeeded();
  const [{ settingsRow, sectionRows, heroBanner }, versions] = await Promise.all([
    loadRows(),
    prisma.homepageVersion.findMany({
      orderBy: { version: "desc" },
      take: 30,
      select: { id: true, version: true, label: true, createdAt: true, createdById: true },
    }),
  ]);
  const { published, draft } = settingsFromRow(settingsRow);
  const publishedJson = JSON.stringify({ settings: published, sections: sectionRows.map((s) => [s.key, s.isEnabled, s.sortOrder, s.contentJson]) });
  const draftJson = JSON.stringify({ settings: draft, sections: sectionRows.map((s) => [s.key, s.draftEnabled, s.draftSortOrder, s.draftContentJson]) });
  return {
    settings: { published, draft },
    sections: sectionRows
      .filter((s) => isSectionKey(s.key))
      .map((s) => {
        const key = s.key as HomepageSectionKey;
        return {
          id: s.id,
          key,
          label: s.label,
          sortOrder: s.sortOrder,
          draftSortOrder: s.draftSortOrder,
          isEnabled: s.isEnabled,
          draftEnabled: s.draftEnabled,
          content: contentForKey(key, s.contentJson),
          draftContent: contentForKey(key, s.draftContentJson),
          updatedAt: s.updatedAt,
        };
      })
      .sort((a, b) => a.draftSortOrder - b.draftSortOrder),
    heroBanner: heroBanner
      ? { id: heroBanner.id, imageUrl: heroBanner.imageUrl, title: heroBanner.title }
      : null,
    versions,
    currentVersionId: versions[0]?.id ?? null,
    hasUnpublishedChanges: publishedJson !== draftJson,
    publishedAt: settingsRow.publishedAt,
  };
}

export type SaveDraftInput = {
  settings?: unknown;
  sections?: Array<{
    key: HomepageSectionKey;
    draftEnabled?: boolean;
    sortOrder?: number;
    draftContent?: unknown;
  }>;
};

/** Saves to draft columns only — the live homepage does not change. Validates everything first. */
export async function saveDraft(input: SaveDraftInput) {
  await ensureHomepageCmsSeeded();

  const settings = input.settings !== undefined ? siteSettingsSchema.parse(input.settings) : null;
  const updates = (input.sections ?? []).map((s) => {
    const data: { draftEnabled?: boolean; draftSortOrder?: number; draftContentJson?: string } = {};
    if (typeof s.draftEnabled === "boolean") data.draftEnabled = s.draftEnabled;
    if (typeof s.sortOrder === "number") data.draftSortOrder = s.sortOrder;
    if (s.draftContent !== undefined) {
      data.draftContentJson = JSON.stringify(parseSectionContent(s.key, s.draftContent));
    }
    return { key: s.key, data };
  });

  await prisma.$transaction([
    ...(settings
      ? [
          prisma.siteSettings.update({
            where: { id: "default" },
            data: { draftJson: JSON.stringify(settings) },
          }),
        ]
      : []),
    ...updates.map((u) => prisma.homepageSection.update({ where: { key: u.key }, data: u.data })),
  ]);

  return getAdminCmsState();
}

async function nextVersionNumber() {
  const max = await prisma.homepageVersion.aggregate({ _max: { version: true } });
  return (max._max.version ?? 0) + 1;
}

/** Copies draft → published, then records the new live state as a version. */
export async function publishHomepage(createdById?: string) {
  await ensureHomepageCmsSeeded();
  const { settingsRow, sectionRows } = await loadRows();
  const { draft } = settingsFromRow(settingsRow);

  await prisma.$transaction([
    prisma.siteSettings.update({
      where: { id: "default" },
      data: { ...settingsColumns(draft), draftJson: JSON.stringify(draft), publishedAt: new Date() },
    }),
    ...sectionRows.map((s) =>
      prisma.homepageSection.update({
        where: { id: s.id },
        data: {
          isEnabled: s.draftEnabled,
          sortOrder: s.draftSortOrder,
          contentJson: isSectionKey(s.key)
            ? JSON.stringify(contentForKey(s.key, s.draftContentJson))
            : s.draftContentJson,
        },
      }),
    ),
  ]);

  const snapshot = await buildSnapshot("published");
  await prisma.homepageVersion.create({
    data: {
      version: await nextVersionNumber(),
      label: "Xuất bản",
      snapshotJson: JSON.stringify(snapshot),
      createdById: createdById ?? null,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/demo-v2", "layout");

  return getAdminCmsState();
}

/** Applies a stored snapshot to both live and draft, and logs it as a new version. */
export async function restoreHomepageVersion(versionId: string, createdById?: string) {
  await ensureHomepageCmsSeeded();
  const version = await prisma.homepageVersion.findUnique({ where: { id: versionId } });
  if (!version) throw new Error("Không tìm thấy phiên bản");

  const snapshot = parseJson<HomepageSnapshot | null>(version.snapshotJson, null);
  if (!snapshot?.settings || !Array.isArray(snapshot.sections)) {
    throw new Error("Snapshot không hợp lệ");
  }
  const settings = normalizeSettings(snapshot.settings, DEFAULT_SITE_SETTINGS);
  const sections = snapshot.sections
    .filter((s) => isSectionKey(s.key))
    .map((s) => ({
      key: s.key,
      sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : HOMEPAGE_SECTION_KEYS.indexOf(s.key),
      isEnabled: Boolean(s.isEnabled),
      json: JSON.stringify(contentForKey(s.key, JSON.stringify(s.content ?? {}))),
    }));

  await prisma.$transaction([
    prisma.siteSettings.update({
      where: { id: "default" },
      data: { ...settingsColumns(settings), draftJson: JSON.stringify(settings), publishedAt: new Date() },
    }),
    ...sections.map((s) =>
      prisma.homepageSection.update({
        where: { key: s.key },
        data: {
          sortOrder: s.sortOrder,
          draftSortOrder: s.sortOrder,
          isEnabled: s.isEnabled,
          draftEnabled: s.isEnabled,
          contentJson: s.json,
          draftContentJson: s.json,
        },
      }),
    ),
  ]);

  await prisma.homepageVersion.create({
    data: {
      version: await nextVersionNumber(),
      label: `Khôi phục từ v${version.version}`,
      snapshotJson: JSON.stringify(await buildSnapshot("published")),
      createdById: createdById ?? null,
    },
  });

  return getAdminCmsState();
}

/** "Khôi phục phiên bản trước": go back to the version before the current live one. */
export async function restorePreviousVersion(createdById?: string) {
  await ensureHomepageCmsSeeded();
  const [, previous] = await prisma.homepageVersion.findMany({
    orderBy: { version: "desc" },
    take: 2,
  });
  if (!previous) throw new Error("Chưa có phiên bản trước để khôi phục");
  return restoreHomepageVersion(previous.id, createdById);
}

/** Drops unpublished edits: draft := published. */
export async function discardDraft() {
  await ensureHomepageCmsSeeded();
  const { settingsRow, sectionRows } = await loadRows();
  const { published } = settingsFromRow(settingsRow);
  await prisma.$transaction([
    prisma.siteSettings.update({
      where: { id: "default" },
      data: { draftJson: JSON.stringify(published) },
    }),
    ...sectionRows.map((s) =>
      prisma.homepageSection.update({
        where: { id: s.id },
        data: {
          draftEnabled: s.isEnabled,
          draftSortOrder: s.sortOrder,
          draftContentJson: s.contentJson,
        },
      }),
    ),
  ]);
  return getAdminCmsState();
}
