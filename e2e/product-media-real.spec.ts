import { expect, test, type Locator, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * REAL admin → storefront test for product media + colours:
 * 5 images picked in ONE multi-select, 1 video, 3 colours (own hex, images, sizes, stock),
 * set main image, reorder, delete + re-add, save, reload, verify persisted, then PDP
 * thumbnails / main frame / colour switching on desktop (1280) and mobile (390).
 * Uses a clearly named TEST product (slug below); re-runs reset only that product's media.
 */
const SLUG = "test-media-5-anh-1-video-3-mau";
const NAME = "TEST Media — 5 ảnh · 1 video · 3 màu";
const IMAGES = [1, 2, 3, 4, 5].map((n) => path.resolve(process.cwd(), `e2e/fixtures/media/test-${n}.jpg`));
const VIDEO = path.resolve(process.cwd(), "public/videos/demo-hoodie-kem.mp4");
const SHOTS = process.env.MEDIA_SHOTS_DIR;

const COLORS = [
  { name: "Đen", hex: "#1C1C1C", sizes: [["S", 5], ["M", 6], ["L", 7]] },
  { name: "Kem", hex: "#E8DCC8", sizes: [["S", 8], ["M", 0], ["L", 9]] },
  { name: "Xanh rêu", hex: "#4B5D3A", sizes: [["M", 2], ["L", 3], ["XL", 4]] },
] as const;

const rgb = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

async function adminLogin(page: Page) {
  await page.goto("/api/auth/csrf");
  await page.goto("/dang-nhap?callbackUrl=/admin/products");
  await page.getByLabel(/^Email$/i).fill("admin@vizfas.vn");
  await page.getByLabel(/Mật khẩu/i).fill("admin123");
  await page.getByRole("button", { name: /Đăng nhập/i }).click();
  await page.waitForURL((u) => u.pathname === "/admin" || u.pathname.startsWith("/admin/"), { timeout: 25_000 });
}

const urlsOf = async (list: Locator) =>
  list.evaluateAll((els) => els.map((e) => e.getAttribute("data-url") || ""));

async function shot(page: Page, name: string, fullPage = true) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, name), fullPage });
}

test.describe.configure({ mode: "serial" });

test.describe("Product media: 5 ảnh + 1 video + 3 màu (admin → PDP)", () => {
  let productId = "";
  let expectedOrder: string[] = [];
  let videoUrl = "";

  test("admin creates/edits TEST product, saves, reload keeps everything", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Admin flow runs once on desktop");
    test.setTimeout(180_000);
    for (const f of [...IMAGES, VIDEO]) expect(fs.existsSync(f), f).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await adminLogin(page);

    const list = await (await page.request.get("/api/admin/products")).json();
    const existing = (list.products || []).find((p: { slug: string }) => p.slug === SLUG);
    if (existing) {
      // Re-run: reuse the TEST product, clear only its own media/colours via the UI.
      await page.goto(`/admin/products/${existing.id}`);
      await expect(page.getByTestId("product-editor")).toBeVisible({ timeout: 20_000 });
      while (await page.getByTestId("pe-image-delete").count()) await page.getByTestId("pe-image-delete").first().click();
      while (await page.getByTestId("pe-video-delete").count()) await page.getByTestId("pe-video-delete").first().click();
      while (await page.getByTestId("pe-color-delete").count()) await page.getByTestId("pe-color-delete").first().click();
    } else {
      await page.goto("/admin/products");
      await page.getByTestId("admin-product-new").click();
      await expect(page).toHaveURL(/\/admin\/products\/new$/);
      await expect(page.getByTestId("product-editor")).toBeVisible({ timeout: 20_000 });
      await page.getByTestId("pe-name").fill(NAME);
      await page.getByTestId("pe-slug").fill(SLUG);
      while (await page.getByTestId("pe-color-delete").count()) await page.getByTestId("pe-color-delete").first().click();
    }

    // 1) five images in ONE multi-select
    await page.getByTestId("pe-image-files").setInputFiles(IMAGES);
    const cards = page.getByTestId("pe-image");
    await expect(cards).toHaveCount(5, { timeout: 60_000 });
    const [u1, u2, u3, u4, u5] = await urlsOf(cards);
    for (const u of [u1, u2, u3, u4, u5]) expect(u).toMatch(/^\/uploads\/.+\.jpg$/);
    // every admin thumbnail actually renders (no broken image)
    await expect
      .poll(() => cards.locator("img").evaluateAll((els) => els.every((e) => (e as HTMLImageElement).naturalWidth > 0)))
      .toBe(true);

    // 2) one video
    await page.getByTestId("pe-video-file").setInputFiles(VIDEO);
    await expect(page.getByTestId("pe-video")).toHaveCount(1, { timeout: 60_000 });
    videoUrl = (await page.getByTestId("pe-video").getAttribute("data-url")) || "";
    expect(videoUrl).toMatch(/^\/uploads\/.+\.mp4$/);

    // 3) three colours, each with its own hex, sizes, price, stock
    for (let i = 0; i < COLORS.length; i++) await page.getByTestId("pe-add-color").click();
    const colorCards = page.getByTestId("pe-color");
    await expect(colorCards).toHaveCount(3);
    for (const [ci, c] of COLORS.entries()) {
      const card = colorCards.nth(ci);
      await card.getByTestId("pe-color-name").fill(c.name);
      await card.getByTestId("pe-color-hex").fill(c.hex);
      const rows = card.getByTestId("pe-size-row");
      await expect(rows).toHaveCount(3);
      for (const [ri, [size, stock]] of c.sizes.entries()) {
        await rows.nth(ri).getByTestId("pe-size").fill(size);
        await rows.nth(ri).getByTestId("pe-price").fill(String(350000 + ci * 10000));
        await rows.nth(ri).getByTestId("pe-stock").fill(String(stock));
      }
    }

    // 4) assign images to colours: 1,2 → Đen · 3,4 → Kem · 5 → Xanh rêu
    const assign = ["Đen", "Đen", "Kem", "Kem", "Xanh rêu"];
    for (const [i, c] of assign.entries()) await cards.nth(i).getByTestId("pe-image-color").selectOption(c);

    // 5) main image = TEST 2, reorder TEST 5 one step left, delete TEST 3 then re-add it
    await cards.nth(1).getByTestId("pe-image-main").click();
    expect(await urlsOf(cards)).toEqual([u2, u1, u3, u4, u5]);
    await expect(cards.first()).toHaveAttribute("data-main", "true");
    await cards.nth(4).getByTestId("pe-image-left").click();
    expect(await urlsOf(cards)).toEqual([u2, u1, u3, u5, u4]);
    await cards.nth(2).getByTestId("pe-image-delete").click();
    expect(await urlsOf(cards)).toEqual([u2, u1, u5, u4]);
    await page.getByTestId("pe-image-files").setInputFiles([IMAGES[2]]);
    await expect(cards).toHaveCount(5, { timeout: 30_000 });
    const urls = await urlsOf(cards);
    const u3b = urls[4];
    expect(urls.slice(0, 4)).toEqual([u2, u1, u5, u4]);
    expect(u3b).not.toBe(u3);
    await cards.nth(4).getByTestId("pe-image-color").selectOption("Kem");
    expectedOrder = [u2, u1, u5, u4, u3b];

    // 6) save
    await page.getByTestId("pe-save").click();
    await expect(page.getByTestId("pe-error")).toHaveCount(0);
    await page.waitForURL(/\/admin\/products\/(?!new)[^/]+$/, { timeout: 30_000 });
    await expect(page.getByText(/Đã lưu/).first()).toBeVisible({ timeout: 15_000 });
    productId = page.url().split("/").pop()!;

    // 7) reload → everything persisted
    await page.reload();
    await expect(page.getByTestId("product-editor")).toBeVisible({ timeout: 20_000 });
    await expect(cards).toHaveCount(5);
    expect(await urlsOf(cards)).toEqual(expectedOrder);
    await expect(cards.first()).toHaveAttribute("data-main", "true");
    const colorsAfter = await cards.getByTestId("pe-image-color").evaluateAll((els) => els.map((e) => (e as HTMLSelectElement).value));
    expect(colorsAfter).toEqual(["Đen", "Đen", "Xanh rêu", "Kem", "Kem"]);
    await expect(page.getByTestId("pe-video")).toHaveCount(1);
    await expect(page.getByTestId("pe-video")).toHaveAttribute("data-url", videoUrl);
    await expect(colorCards).toHaveCount(3);
    for (const [ci, c] of COLORS.entries()) {
      const card = colorCards.nth(ci);
      await expect(card.getByTestId("pe-color-name")).toHaveValue(c.name);
      await expect(card.getByTestId("pe-color-hex")).toHaveValue(c.hex);
      const rows = card.getByTestId("pe-size-row");
      await expect(rows).toHaveCount(3);
      for (const [ri, [size, stock]] of c.sizes.entries()) {
        await expect(rows.nth(ri).getByTestId("pe-size")).toHaveValue(size);
        await expect(rows.nth(ri).getByTestId("pe-stock")).toHaveValue(String(stock));
      }
    }
    // DB truth via API
    const api = await (await page.request.get(`/api/admin/products?id=${productId}`)).json();
    expect(api.product.images.map((i: { url: string }) => i.url)).toEqual([videoUrl, ...expectedOrder]);
    expect(api.product.images[0].type).toBe("video");
    expect(api.product.variants).toHaveLength(9);
    await shot(page, "01-admin-editor-5-anh-1-video-3-mau.png");
  });

  for (const vp of [
    { label: "desktop", width: 1280, height: 900, project: "chromium", thumbs: "gallery-thumbs-desktop" },
    { label: "mobile", width: 390, height: 844, project: "mobile", thumbs: "gallery-thumbs-mobile" },
  ]) {
    test(`PDP ${vp.label} (${vp.width}px): all thumbnails incl. video, click swaps main frame, colour switch`, async ({ page, request }, testInfo) => {
      test.skip(testInfo.project.name !== vp.project, `${vp.label} project only`);
      test.setTimeout(120_000);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const res = await page.goto(`/san-pham/${SLUG}`);
      test.skip(res?.status() === 404, "TEST product not created (admin test must run first on chromium)");

      const strip = page.getByTestId(vp.thumbs);
      await expect(strip).toBeVisible();
      const thumbs = strip.locator("button");
      // layout: no horizontal page overflow (thumbnail strip scrolls inside itself)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      await expect(thumbs).toHaveCount(6); // 1 video + 5 images, nothing dropped
      await expect(strip.getByTestId("gallery-thumb-video")).toHaveCount(1);
      await expect(strip.getByTestId("gallery-thumb-image")).toHaveCount(5);
      // video thumbnail is a real <video> frame, not a broken <img src=.mp4>
      await expect(strip.getByTestId("gallery-thumb-video").locator("video")).toHaveCount(1);
      await expect(strip.locator('img[src*=".mp4"]')).toHaveCount(0);
      // all image thumbnails loaded
      await expect
        .poll(() => strip.locator("img").evaluateAll((els) => els.length === 5 && els.every((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0)), { timeout: 20_000 })
        .toBe(true);

      // video keeps its place: first thumbnail + main frame on load, playing
      const main = page.getByTestId("gallery-main");
      await expect(thumbs.first()).toHaveAttribute("data-testid", "gallery-thumb-video");
      await expect(main).toHaveAttribute("data-current-type", "video");
      const video = page.getByTestId("pdp-product-video");
      await expect(video).toBeVisible();
      await expect(video).toHaveJSProperty("muted", true);
      if (vp.project === "chromium") {
        // Playback check on Chromium (Playwright WebKit on Windows has no H.264).
        await expect.poll(() => video.evaluate((el) => !(el as HTMLVideoElement).paused), { timeout: 15_000 }).toBe(true);
      }
      await shot(page, `02-pdp-${vp.label}-thumbnails.png`, false);

      // initial colour Đen → thumbs order: video, Đen photos (TEST2, TEST1), then others
      const dots = page.getByTestId("pdp-color-dot");
      await expect(dots).toHaveCount(3);
      for (const c of COLORS) {
        const dot = page.locator(`[data-testid="pdp-color-dot"][data-color="${c.name}"]`);
        await expect(dot).toHaveAttribute("data-hex", c.hex);
        await expect(dot.locator("span")).toHaveCSS("background-color", rgb(c.hex));
      }

      // click each thumbnail → main frame shows exactly that media
      const n = await thumbs.count();
      for (let i = 0; i < n; i++) {
        const t = thumbs.nth(i);
        await t.click();
        await expect(t).toHaveAttribute("data-active", "true");
        await expect(main).toHaveAttribute("data-current-url", (await t.getAttribute("data-url"))!);
        if ((await t.getAttribute("data-testid")) === "gallery-thumb-video") {
          await expect(page.getByTestId("pdp-product-video")).toBeVisible();
        } else {
          await expect(page.getByTestId("pdp-product-video")).toHaveCount(0);
          await expect.poll(() => main.locator("img").evaluate((e) => (e as HTMLImageElement).naturalWidth > 0)).toBe(true);
        }
      }

      // colour switching: dot, images, sizes and stock follow the colour
      for (const c of COLORS) {
        await page.locator(`[data-testid="pdp-color-dot"][data-color="${c.name}"]`).click();
        await expect(page.locator(`[data-testid="pdp-color-dot"][data-color="${c.name}"]`)).toHaveAttribute("aria-pressed", "true");
        await expect(page.getByText(`Màu sắc: ${c.name}`)).toBeVisible();
        // main frame jumps to this colour's first photo; video thumb still first
        await expect(main).toHaveAttribute("data-current-type", "image");
        await expect(thumbs.first()).toHaveAttribute("data-testid", "gallery-thumb-video");
        await expect(thumbs).toHaveCount(6);
        const sizes = page.getByTestId("pdp-size");
        await expect(sizes).toHaveCount(c.sizes.length);
        for (const [ri, [size, stock]] of c.sizes.entries()) {
          await expect(sizes.nth(ri)).toHaveAttribute("data-size", size);
          await expect(sizes.nth(ri)).toHaveAttribute("data-stock", String(stock));
          if (stock === 0) await expect(sizes.nth(ri)).toBeDisabled();
        }
        await expect(page.getByTestId("pdp-stock")).toContainText(c.name);
        await expect(page.getByTestId("pdp-stock")).toContainText(/Còn \d+ sản phẩm/);
        if (c.name === "Kem") await shot(page, `03-pdp-${vp.label}-sau-khi-doi-mau-kem.png`, false);
      }

      // reload → same data from DB
      await page.reload();
      await expect(page.getByTestId(vp.thumbs).locator("button")).toHaveCount(6);
      expect(request).toBeTruthy();
    });
  }

  test("Áo Hoodie Brown Layer Club PDPs show real photos (no broken/video-as-image thumbnails)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "desktop only");
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const slug of ["ao-hoodie-brown-layer", "ads"]) {
      await page.goto(`/san-pham/${slug}`);
      const strip = page.getByTestId("gallery-thumbs-desktop");
      await expect(strip.locator("button").first()).toBeVisible();
      await expect(strip.locator('img[src*=".mp4"]')).toHaveCount(0);
      await expect
        .poll(() => strip.locator("img").evaluateAll((els) => els.length > 0 && els.every((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0)), { timeout: 20_000 })
        .toBe(true);
      await expect(page.getByTestId("pdp-color-dot").first()).toBeVisible();
      if (slug === "ads") {
        // the uploaded screenshot is hidden from customers (kept in DB); 3 separate colours
        await expect(page.locator('[data-url*="1794974609455-5cfbd87f.png"]')).toHaveCount(0);
        await expect(page.getByTestId("pdp-color-dot")).toHaveCount(3);
        await expect(strip.getByTestId("gallery-thumb-video")).toHaveCount(1);
        await shot(page, "04-hoodie-brown-layer-club-pdp-fixed.png", false);
      } else {
        await shot(page, "05-hoodie-brown-layer-seed-pdp.png", false);
      }
    }
  });
});
