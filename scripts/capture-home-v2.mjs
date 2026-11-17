import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const out =
  "C:/Users/ADMIN/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-277c8ed9-f1c9-4705-96c7-25d86dbd9ada/files/media/home-v2";
fs.mkdirSync(out, { recursive: true });

async function settle(page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll("img")];
    await Promise.all(
      imgs.map((img) =>
        img.decode?.().catch(() => undefined) || Promise.resolve(),
      ),
    );
  });
}

async function assertNoGray(page) {
  const featured = await page.locator("article img").evaluateAll((imgs) =>
    imgs
      .filter((img) => /featured/.test(img.currentSrc || img.src))
      .map((img) => ({
        src: (img.currentSrc || img.src).split("url=")[1]?.slice(0, 60),
        w: img.naturalWidth,
        h: img.naturalHeight,
      })),
  );
  const phoi = await page
    .locator('[data-testid^="phoi-grid-cell-"] img')
    .evaluateAll((imgs) =>
      imgs.map((img) => ({
        w: img.naturalWidth,
        h: img.naturalHeight,
        src: img.currentSrc || img.src,
      })),
    );
  return { featured, phoi };
}

const browser = await chromium.launch();

const desktop = await browser.newPage({
  viewport: { width: 1280, height: 900 },
});
await desktop.goto("http://localhost:3000/", {
  waitUntil: "networkidle",
  timeout: 90000,
});
await desktop.waitForTimeout(2000);
await settle(desktop);
const d = await assertNoGray(desktop);
console.log("desktop featured", d.featured);
console.log(
  "desktop phoi",
  d.phoi.map((p) => ({ w: p.w, h: p.h })),
);
const vert = desktop.getByTestId("phoi-vertical-label");
console.log("vertical", await vert.isVisible(), await vert.textContent());
const mainPhoi = await desktop
  .locator('img[alt="Phối màu tạo chất"]')
  .evaluate((img) => ({
    w: img.naturalWidth,
    h: img.naturalHeight,
    box: img.getBoundingClientRect().width,
  }));
console.log("phoi main", mainPhoi);
if (d.featured.length < 6 || d.featured.some((f) => f.w === 0)) {
  throw new Error(`featured empty: ${JSON.stringify(d.featured)}`);
}
if (d.phoi.length < 6 || d.phoi.some((p) => p.w === 0)) {
  throw new Error(`phoi empty: ${JSON.stringify(d.phoi)}`);
}
await desktop.screenshot({
  path: path.join(out, "homepage-desktop-full.png"),
  fullPage: true,
});
await desktop.screenshot({
  path: path.join(out, "hero-viewport.png"),
  fullPage: false,
});
await desktop.close();

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
});
await mobile.goto("http://localhost:3000/", {
  waitUntil: "networkidle",
  timeout: 90000,
});
await mobile.waitForTimeout(1500);
await settle(mobile);
const m = await assertNoGray(mobile);
console.log(
  "mobile featured",
  m.featured.length,
  "empty",
  m.featured.filter((f) => f.w === 0).length,
);
console.log("mobile phoi empty", m.phoi.filter((p) => p.w === 0).length);
if (m.featured.some((f) => f.w === 0) || m.phoi.some((p) => p.w === 0)) {
  throw new Error("mobile still has empty frames");
}
await mobile.screenshot({
  path: path.join(out, "homepage-mobile-full.png"),
  fullPage: true,
});
await browser.close();
console.log("ok");
