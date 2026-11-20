import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { cleanDb, resetTestDb, seedMinimal } from "./helpers";

// Route-handler auth tests drive requireAdmin() through a mocked NextAuth session.
const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  discardDraft,
  ensureHomepageCmsSeeded,
  getAdminCmsState,
  getHomepageView,
  getPublishedHomepage,
  publishHomepage,
  restoreHomepageVersion,
  restorePreviousVersion,
  saveDraft,
} from "@/lib/cms/homepage";
import { defaultSectionContent, DEFAULT_SITE_SETTINGS } from "@/lib/cms/types";
import { isSafeHref, isSafeMediaUrl, parseSectionContent, sanitizePlainText, siteSettingsSchema } from "@/lib/cms/validate";
import { detectMimeFromBuffer, validateUploadFile } from "@/lib/upload-validate";
import { GET as cmsGET, POST as cmsPOST } from "@/app/api/admin/homepage-cms/route";
import { POST as uploadPOST } from "@/app/api/upload/route";

const prisma = new PrismaClient();
type Hero = { title: string; ctaHref: string; trustItems: string[] };
const heroTitle = (v: Awaited<ReturnType<typeof getHomepageView>>) => (v.sections.hero.content as Hero).title;

beforeAll(() => {
  resetTestDb();
});

beforeEach(async () => {
  authMock.mockReset();
  await cleanDb(prisma);
  await seedMinimal(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("CMS validation / sanitising", () => {
  it("rejects javascript:, data: and protocol-relative URLs", () => {
    expect(isSafeHref("javascript:alert(1)")).toBe(false);
    expect(isSafeHref(" JavaScript:alert(1)")).toBe(false);
    expect(isSafeHref("//evil.com")).toBe(false);
    expect(isSafeHref("/san-pham")).toBe(true);
    expect(isSafeHref("https://vizfas.vn")).toBe(true);
    expect(isSafeMediaUrl("data:text/html,hi")).toBe(false);
    expect(isSafeMediaUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeMediaUrl("/images/home-v2/hero-main.jpg")).toBe(true);
    expect(isSafeMediaUrl("/uploads/a.jpg) ;background:url(x")).toBe(false);
    expect(isSafeMediaUrl("https://evil.example/x.jpg")).toBe(false);
    expect(isSafeMediaUrl("https://images.unsplash.com/photo-1")).toBe(true);
  });

  it("strips HTML tags but keeps normal text such as 'Free ship > 500k'", () => {
    expect(sanitizePlainText("<script>alert(1)</script>hi")).toBe("alert(1)hi");
    expect(sanitizePlainText('<img src=x onerror="a()">ok')).toBe("ok");
    expect(sanitizePlainText("Free ship > 500k")).toBe("Free ship > 500k");
  });

  it("every default section passes its schema unchanged (no visual drift)", () => {
    for (const key of [
      "navigation",
      "footer_links",
      "floating_contact",
      "reviews",
      "hero",
      "dual_banner",
      "collections",
      "diverse",
      "featured",
      "color_play",
      "promo_banner",
    ] as const) {
      expect(parseSectionContent(key, defaultSectionContent(key))).toEqual(defaultSectionContent(key));
    }
    expect(siteSettingsSchema.parse(DEFAULT_SITE_SETTINGS)).toEqual(DEFAULT_SITE_SETTINGS);
  });

  it("rejects bad brand colour and bad social link", () => {
    expect(siteSettingsSchema.safeParse({ ...DEFAULT_SITE_SETTINGS, brandColor: "red;}" }).success).toBe(false);
    expect(siteSettingsSchema.safeParse({ ...DEFAULT_SITE_SETTINGS, socialFacebook: "javascript:x" }).success).toBe(false);
  });
});

describe("upload validation (magic bytes)", () => {
  it("detects JPEG magic", () => {
    const buf = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(detectMimeFromBuffer(buf)).toBe("image/jpeg");
  });

  it("rejects spoofed mime when content is not an image", () => {
    const buf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0, 0, 0, 0, 0, 0, 0, 0]); // %PDF
    expect(validateUploadFile({ mime: "image/jpeg", size: buf.length, name: "fake.jpg", buffer: buf }).ok).toBe(false);
  });

  it("rejects a text file and an oversize image", () => {
    const txt = new TextEncoder().encode("not-an-image-at-all");
    expect(validateUploadFile({ mime: "text/plain", size: txt.length, name: "a.txt", buffer: txt }).ok).toBe(false);
    const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(validateUploadFile({ mime: "image/jpeg", size: 6 * 1024 * 1024, name: "big.jpg", buffer: jpg }).ok).toBe(false);
  });
});

describe("homepage CMS draft / publish / versions", () => {
  it("seeds exactly the current homepage content", async () => {
    await ensureHomepageCmsSeeded();
    const v = await getPublishedHomepage();
    expect(heroTitle(v)).toBe("Mặc Đơn Giản");
    expect((v.sections.hero.content as Hero).trustItems).toContain("Free ship > 500k");
    expect(v.sections.promo_banner.isEnabled).toBe(false);
    expect(v.settings).toEqual(DEFAULT_SITE_SETTINGS);
    expect(await prisma.homepageVersion.count()).toBe(1);
  });

  it("draft does not touch live; publish does; restore reverts; restore_previous undoes", async () => {
    await ensureHomepageCmsSeeded();
    const before = await getPublishedHomepage();
    await saveDraft({
      sections: [{ key: "hero", draftContent: { ...(before.sections.hero.content as object), title: "Hero Nháp CMS" } }],
      settings: { ...before.settings, brandColor: "#123456" },
    });

    expect(heroTitle(await getHomepageView("published"))).toBe("Mặc Đơn Giản");
    expect(heroTitle(await getHomepageView("draft"))).toBe("Hero Nháp CMS");
    expect((await getHomepageView("draft")).settings.brandColor).toBe("#123456");
    expect((await getAdminCmsState()).hasUnpublishedChanges).toBe(true);

    await publishHomepage();
    const live = await getPublishedHomepage();
    expect(heroTitle(live)).toBe("Hero Nháp CMS");
    expect(live.settings.brandColor).toBe("#123456");
    expect((await getAdminCmsState()).hasUnpublishedChanges).toBe(false);

    const v1 = await prisma.homepageVersion.findFirstOrThrow({ where: { version: 1 } });
    await restoreHomepageVersion(v1.id);
    expect(heroTitle(await getPublishedHomepage())).toBe("Mặc Đơn Giản");
    expect((await getPublishedHomepage()).settings.brandColor).toBe("#f97316");

    await restorePreviousVersion(); // back to the published "Hero Nháp CMS"
    expect(heroTitle(await getPublishedHomepage())).toBe("Hero Nháp CMS");
    expect(await prisma.homepageVersion.count()).toBe(4);
  });

  it("section order and on/off are draft-only until publish", async () => {
    await ensureHomepageCmsSeeded();
    await saveDraft({ sections: [{ key: "featured", sortOrder: 1, draftEnabled: false }, { key: "hero", sortOrder: 5 }] });
    const live = await getPublishedHomepage();
    expect(live.sections.featured.isEnabled).toBe(true);
    expect(live.sections.hero.sortOrder).toBe(5);
    const draft = await getHomepageView("draft");
    expect(draft.sections.featured.isEnabled).toBe(false);
    expect(draft.sections.hero.sortOrder).toBe(5);

    await discardDraft();
    expect((await getHomepageView("draft")).sections.featured.isEnabled).toBe(true);
  });

  it("rejects unsafe href on draft save and keeps previous draft", async () => {
    await ensureHomepageCmsSeeded();
    const before = await getPublishedHomepage();
    await expect(
      saveDraft({ sections: [{ key: "hero", draftContent: { ...(before.sections.hero.content as object), ctaHref: "javascript:alert(1)" } }] }),
    ).rejects.toBeTruthy();
    expect((( await getHomepageView("draft")).sections.hero.content as Hero).ctaHref).toBe("/san-pham");
  });

  it("uses the active HeroBanner image (from /admin/banners) for the shatter hero", async () => {
    await prisma.heroBanner.create({ data: { imageUrl: "/uploads/banner-x.jpg", isActive: true, sortOrder: 0 } });
    const v = await getPublishedHomepage();
    expect((v.sections.hero.content as { imageUrl: string }).imageUrl).toBe("/uploads/banner-x.jpg");
  });

  it("falls back to hard-coded defaults if CMS rows are corrupted", async () => {
    await ensureHomepageCmsSeeded();
    await prisma.homepageSection.update({ where: { key: "hero" }, data: { contentJson: "{not json" } });
    expect(heroTitle(await getPublishedHomepage())).toBe("Mặc Đơn Giản");
  });
});

describe("CMS API access control", () => {
  const req = (body: unknown) =>
    new Request("http://localhost/api/admin/homepage-cms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  it("guest gets 401, customer gets 403 (GET, POST, upload)", async () => {
    authMock.mockResolvedValue(null);
    expect((await cmsGET()).status).toBe(401);
    expect((await cmsPOST(req({ action: "publish" }))).status).toBe(401);

    authMock.mockResolvedValue({ user: { id: "c1", role: "CUSTOMER" } });
    expect((await cmsGET()).status).toBe(403);
    expect((await cmsPOST(req({ action: "publish" }))).status).toBe(403);
    const fd = new FormData();
    fd.append("file", new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])], "a.jpg", { type: "image/jpeg" }));
    expect((await uploadPOST(new Request("http://localhost/api/upload", { method: "POST", body: fd }))).status).toBe(403);
  });

  it("admin can read, save draft and publish; invalid payload → 400", async () => {
    const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
    authMock.mockResolvedValue({ user: { id: admin.id, role: "ADMIN" } });
    const state = await (await cmsGET()).json();
    expect(state.sections.length).toBe(13);

    const bad = await cmsPOST(req({ action: "save_draft", settings: { ...DEFAULT_SITE_SETTINGS, brandColor: "url(x)" } }));
    expect(bad.status).toBe(400);
    expect((await cmsPOST(req({ action: "nope" }))).status).toBe(400);

    const hero = state.sections.find((s: { key: string }) => s.key === "hero");
    const ok = await cmsPOST(req({ action: "save_draft", sections: [{ key: "hero", draftContent: { ...hero.draftContent, title: "API Title" } }] }));
    expect(ok.status).toBe(200);
    expect((await cmsPOST(req({ action: "publish" }))).status).toBe(200);
    expect(heroTitle(await getPublishedHomepage())).toBe("API Title");
    const last = await prisma.homepageVersion.findFirstOrThrow({ orderBy: { version: "desc" } });
    expect(last.createdById).toBe(admin.id);
  });

  it("admin upload rejects a .txt file", async () => {
    authMock.mockResolvedValue({ user: { id: "a1", role: "ADMIN" } });
    const fd = new FormData();
    fd.append("file", new File(["hello world, not an image"], "x.txt", { type: "text/plain" }));
    const res = await uploadPOST(new Request("http://localhost/api/upload", { method: "POST", body: fd }));
    expect(res.status).toBe(400);
  });
});
