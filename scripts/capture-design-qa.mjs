import { chromium, devices } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const media = join(
  "C:/Users/ADMIN/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-277c8ed9-f1c9-4705-96c7-25d86dbd9ada/files/media",
);
mkdirSync(media, { recursive: true });

const base = "http://localhost:3000";

async function warmImages(page) {
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const height = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
    );
    for (let y = 0; y < height; y += 500) {
      window.scrollTo(0, y);
      await sleep(120);
    }
    window.scrollTo(0, 0);
    await sleep(200);
    await Promise.all(
      [...document.images].map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
          setTimeout(resolve, 2500);
        });
      }),
    );
  });
}

async function shot(page, name, fullPage = true) {
  const path = join(media, name);
  await warmImages(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path, fullPage });
  console.log("saved", path);
}

const browser = await chromium.launch({ headless: true });

// Desktop homepage
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, "homepage-after.png", true);
  await page.close();
}

// Mobile homepage
{
  const iPhone = devices["iPhone 13"];
  const page = await browser.newPage({ ...iPhone });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "homepage-after-mobile.png", true);
  await page.close();
}

// PDP colour 1 (Kem default)
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + "/san-pham/ao-hoodie-essential", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1000);
  await shot(page, "pdp-after.png", true);
  await page.close();
}

// PDP colour 2 (Đen)
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + "/san-pham/ao-hoodie-essential", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(800);
  // click black swatch — look for button/label containing Đen or title
  const swatches = page.locator('button[aria-label*="Đen"], button[title*="Đen"]');
  if ((await swatches.count()) > 0) {
    await swatches.first().click();
  } else {
    // fallback: colour buttons near "Màu sắc"
    const buttons = page.locator("button").filter({ hasText: /^$/ });
    // click second colour circle (Đen) by role near text
    const colorRow = page.locator("text=Màu sắc").locator("..").locator("button");
    if ((await colorRow.count()) >= 2) await colorRow.nth(1).click();
  }
  await page.waitForTimeout(900);
  await shot(page, "pdp-after-color2.png", true);
  await page.close();
}

// Mobile PDP
{
  const iPhone = devices["iPhone 13"];
  const page = await browser.newPage({ ...iPhone });
  await page.goto(base + "/san-pham/ao-hoodie-essential", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1000);
  await shot(page, "pdp-after-mobile.png", true);
  await page.close();
}

await browser.close();
console.log("All screenshots captured.");
