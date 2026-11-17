import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const out =
  "C:/Users/ADMIN/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-277c8ed9-f1c9-4705-96c7-25d86dbd9ada/files/media/home-v2";
const compareDir = path.join(out, "band-compare");
fs.mkdirSync(compareDir, { recursive: true });

async function settle(page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(140);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll("img")];
    await Promise.all(
      imgs.map((img) => img.decode?.().catch(() => undefined) || Promise.resolve()),
    );
  });
}

async function cropBands(fullPath) {
  const meta = await sharp(fullPath).metadata();
  const W = meta.width;
  const H = meta.height;
  const bands = [
    { name: "live-hero", y0: 0, y1: 0.18 },
    { name: "live-collections", y0: 0.28, y1: 0.42 },
    { name: "live-diverse", y0: 0.42, y1: 0.58 },
    { name: "live-featured", y0: 0.58, y1: 0.74 },
    { name: "live-phoi", y0: 0.74, y1: 0.9 },
    { name: "live-footer", y0: 0.88, y1: 1 },
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

const browser = await chromium.launch();

const desktop = await browser.newPage({
  viewport: { width: 1280, height: 900 },
});
await desktop.goto("http://localhost:3000/", {
  waitUntil: "networkidle",
  timeout: 90000,
});
await desktop.waitForTimeout(1800);
await settle(desktop);

const checks = {
  featured: await desktop.locator("article img").evaluateAll((imgs) =>
    imgs.filter((i) => /featured/.test(i.currentSrc || i.src)).length,
  ),
  phoi: await desktop.locator('[data-testid^="phoi-grid-cell-"] img').evaluateAll(
    (imgs) => imgs.filter((i) => i.naturalWidth > 0).length,
  ),
  vertical: await desktop.getByTestId("phoi-vertical-label").isVisible(),
  type: await desktop.getByTestId("phoi-mau-type").textContent(),
  footerLogo: await desktop.locator("footer").innerText(),
};
console.log(checks);
if (checks.featured < 6 || checks.phoi < 6) {
  throw new Error(`missing images featured=${checks.featured} phoi=${checks.phoi}`);
}
if (!/VIZFAS/.test(checks.footerLogo) || /VIZFAS\+/.test(checks.footerLogo)) {
  throw new Error("footer logo should be VIZFAS without +");
}

const desktopFull = path.join(out, "homepage-desktop-full.png");
await desktop.screenshot({ path: desktopFull, fullPage: true });
await desktop.screenshot({
  path: path.join(out, "hero-viewport.png"),
  fullPage: false,
});
await cropBands(desktopFull);
await desktop.close();

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
});
await mobile.goto("http://localhost:3000/", {
  waitUntil: "networkidle",
  timeout: 90000,
});
await mobile.waitForTimeout(1200);
await settle(mobile);
await mobile.screenshot({
  path: path.join(out, "homepage-mobile-full.png"),
  fullPage: true,
});
await browser.close();
console.log("capture ok →", compareDir);
