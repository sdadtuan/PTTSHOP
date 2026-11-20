import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { cleanDb, resetTestDb, seedMinimal } from "./helpers";
import { ensureStorefrontPagesSeeded, getStorefrontPageBySlug } from "@/lib/storefront/pages";
import { HOMEPAGE_SECTION_KEYS, defaultSectionContent, DEFAULT_SITE_SETTINGS } from "@/lib/cms/types";
import { parseSectionContent, siteSettingsSchema } from "@/lib/cms/validate";

const prisma = new PrismaClient();

beforeAll(() => {
  resetTestDb();
});

beforeEach(async () => {
  await cleanDb(prisma);
  await seedMinimal(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("storefront static pages", () => {
  it("seeds ve-chung-toi with original copy", async () => {
    await ensureStorefrontPagesSeeded();
    const page = await getStorefrontPageBySlug("ve-chung-toi");
    expect(page?.title).toBe("Về VIZFAS");
    expect(page?.body.some((l) => l.includes("VIZFAS là thương hiệu"))).toBe(true);
  });

  it("concurrent lazy seed does not throw unique errors", async () => {
    await Promise.all([
      ensureStorefrontPagesSeeded(),
      ensureStorefrontPagesSeeded(),
      getStorefrontPageBySlug("tin-tuc"),
      getStorefrontPageBySlug("tuyen-dung"),
    ]);
    const row = await prisma.storefrontPage.findUnique({ where: { slug: "tin-tuc" } });
    expect(row?.title).toBe("Tin tức");
  });
});

describe("extended CMS defaults validate", () => {
  it("every section default passes schema", () => {
    for (const key of HOMEPAGE_SECTION_KEYS) {
      expect(parseSectionContent(key, defaultSectionContent(key))).toEqual(
        defaultSectionContent(key),
      );
    }
    expect(siteSettingsSchema.parse(DEFAULT_SITE_SETTINGS)).toEqual(DEFAULT_SITE_SETTINGS);
  });
});