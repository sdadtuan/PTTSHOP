import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const outDir = "C:/Users/ADMIN/AppData/Local/Temp/vizfas-mobile-images";
fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { w: 360, h: 800, suffix: "360" },
  { w: 390, h: 844, suffix: "390" },
];

const beforeSrc = [
  ["360-home-color_play.png", "360-color-play-side-before.png"],
  ["390-home-color_play.png", "390-color-play-side-before.png"],
];

for (const [src, dst] of beforeSrc) {
  const from = path.join(outDir, src);
  const to = path.join(outDir, dst);
  if (fs.existsSync(from) && !fs.existsSync(to)) {
    fs.copyFileSync(from, to);
  }
}

const browser = await chromium.launch();
for (const { w, h, suffix } of viewports) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  const phoi = page.locator("section").filter({
    has: page.getByTestId("phoi-mau-type"),
  });
  await phoi.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await phoi.screenshot({
    path: path.join(outDir, `${suffix}-color-play-side-after.png`),
  });
  await page.close();
}

const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await desktop.goto("http://localhost:3000/", { waitUntil: "networkidle" });
const phoiD = desktop.locator("section").filter({
  has: desktop.getByTestId("phoi-mau-type"),
});
await phoiD.scrollIntoViewIfNeeded();
await desktop.waitForTimeout(400);
await phoiD.screenshot({
  path: path.join(outDir, "1280-color-play-desktop-check.png"),
});
await desktop.close();
await browser.close();

console.log("Screenshots saved to", outDir);