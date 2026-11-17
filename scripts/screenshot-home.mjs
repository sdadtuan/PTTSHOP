import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const base = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";
const outDir = process.env.SHOT_DIR
  ? path.resolve(process.env.SHOT_DIR)
  : path.resolve("docs/screenshots/home-v2");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
async function shot(name, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(base + "/", { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(800);
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log("wrote", file);
  await page.close();
}

await shot("homepage-desktop-full.png", 1280, 900);
await shot("homepage-mobile-full.png", 390, 844);
await browser.close();
