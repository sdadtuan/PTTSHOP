import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const out =
  "C:/Users/ADMIN/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-277c8ed9-f1c9-4705-96c7-25d86dbd9ada/files/media/home-v2";
const compareDir = path.join(out, "band-compare");
const mockDir = path.join(out, "mock-crops");
fs.mkdirSync(compareDir, { recursive: true });

async function settle(page) {
  const height = await page.evaluate(() =>
    Math.min(document.body.scrollHeight || 4000, 8000),
  );
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll("img")].slice(0, 40);
    await Promise.race([
      Promise.all(
        imgs.map(
          (img) =>
            img.decode?.().catch(() => undefined) || Promise.resolve(),
        ),
      ),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  });
}

async function cropBands(fullPath) {
  const meta = await sharp(fullPath).metadata();
  const W = meta.width;
  const H = meta.height;
  const bands = [
    { name: "live-hero", y0: 0, y1: 0.16 },
    { name: "live-banner", y0: 0.14, y1: 0.3 },
    { name: "live-collections", y0: 0.28, y1: 0.42 },
    { name: "live-diverse", y0: 0.4, y1: 0.56 },
    { name: "live-featured", y0: 0.54, y1: 0.7 },
    { name: "live-phoi", y0: 0.68, y1: 0.88 },
    { name: "live-footer", y0: 0.86, y1: 1 },
  ];
  for (const b of bands) {
    const top = Math.max(0, Math.floor(H * b.y0));
    const bottom = Math.min(H, Math.ceil(H * b.y1));
    await sharp(fullPath)
      .extract({ left: 0, top, width: W, height: Math.max(1, bottom - top) })
      .png()
      .toFile(path.join(compareDir, `${b.name}.png`));
  }
}

async function sideBySide(liveName, mockName, outName, width = 640) {
  const livePath = path.join(compareDir, liveName);
  const mockPath = path.join(mockDir, mockName);
  if (!fs.existsSync(livePath) || !fs.existsSync(mockPath)) {
    console.log("skip composite", outName, fs.existsSync(livePath), fs.existsSync(mockPath));
    return;
  }
  const live = await sharp(livePath).resize({ width, withoutEnlargement: false }).png().toBuffer();
  const mock = await sharp(mockPath).resize({ width, withoutEnlargement: false }).png().toBuffer();
  const lm = await sharp(live).metadata();
  const mm = await sharp(mock).metadata();
  const h = Math.max(lm.height, mm.height);
  const livePad = await sharp(live)
    .extend({
      top: 0,
      bottom: Math.max(0, h - lm.height),
      left: 0,
      right: 0,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toBuffer();
  const mockPad = await sharp(mock)
    .extend({
      top: 0,
      bottom: Math.max(0, h - mm.height),
      left: 0,
      right: 0,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toBuffer();
  // label strip
  const gap = 8;
  await sharp({
    create: {
      width: width * 2 + gap,
      height: h + 28,
      channels: 3,
      background: { r: 245, g: 245, b: 245 },
    },
  })
    .composite([
      { input: mockPad, left: 0, top: 28 },
      { input: livePad, left: width + gap, top: 28 },
    ])
    .png()
    .toFile(path.join(compareDir, outName));
  console.log("composite", outName);
}

const browser = await chromium.launch();
const desktop = await browser.newPage({
  viewport: { width: 1280, height: 900 },
});
await desktop.goto("http://localhost:3000/", {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await desktop.waitForTimeout(2000);
await settle(desktop);

const typeSizes = await desktop.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      text: (el.textContent || "").trim().slice(0, 40),
    };
  };
  return {
    heroH1: pick('[data-testid="hero-h1"]'),
    phoiType: pick('[data-testid="phoi-mau-type"]'),
    vertical: pick('[data-testid="phoi-vertical-label"] p'),
    footerLogo: (() => {
      const el = [...document.querySelectorAll("footer p")].find((p) =>
        /^PTT Shop$/.test((p.textContent || "").trim()),
      );
      if (!el) return null;
      return { fontSize: getComputedStyle(el).fontSize };
    })(),
  };
});
console.log("typeSizes", JSON.stringify(typeSizes, null, 2));

const featuredOk = await desktop.locator("article img").evaluateAll((imgs) =>
  imgs.filter((i) => /featured/.test(i.currentSrc || i.src) && i.naturalWidth > 0)
    .length,
);
const phoiOk = await desktop
  .locator('[data-testid^="phoi-grid-cell-"] img')
  .evaluateAll((imgs) => imgs.filter((i) => i.naturalWidth > 0).length);
console.log({ featuredOk, phoiOk });

const desktopFull = path.join(out, "homepage-desktop-full.png");
await desktop.screenshot({ path: desktopFull, fullPage: true });
await desktop.screenshot({
  path: path.join(out, "hero-viewport.png"),
  fullPage: false,
});
await cropBands(desktopFull);

await sideBySide("live-hero.png", "band-hero.png", "compare-hero.png");
await sideBySide("live-banner.png", "band-banner.png", "compare-banner.png");
await sideBySide(
  "live-collections.png",
  "band-collections.png",
  "compare-collections.png",
);
await sideBySide("live-diverse.png", "band-diverse.png", "compare-diverse.png");
await sideBySide("live-phoi.png", "band-phoi-tight.png", "compare-phoi.png");
await sideBySide("live-footer.png", "band-footer.png", "compare-footer.png");

fs.writeFileSync(
  path.join(compareDir, "type-sizes.json"),
  JSON.stringify(typeSizes, null, 2),
);

await desktop.close();

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
});
await mobile.goto("http://localhost:3000/", {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await mobile.waitForTimeout(1500);
await settle(mobile);
await mobile.screenshot({
  path: path.join(out, "homepage-mobile-full.png"),
  fullPage: true,
});
await browser.close();
console.log("done");
