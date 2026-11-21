import { chromium, devices } from "@playwright/test";
import fs from "fs";
import path from "path";

const base = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const outDir = process.argv[2];
if (!outDir) {
  console.error("Usage: node scripts/capture-video-screens.mjs <outDir>");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const adminEmail = process.env.E2E_ADMIN_EMAIL?.trim();
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
if (!adminEmail || !adminPassword) {
  console.error("Thiếu E2E_ADMIN_EMAIL hoặc E2E_ADMIN_PASSWORD");
  process.exit(1);
}

async function login(page) {
  await page.goto(`${base}/api/auth/csrf`);
  await page.goto(`${base}/dang-nhap?callbackUrl=/admin/products`);
  await page.getByLabel(/^Email$/i).fill(adminEmail);
  await page.getByLabel(/Mật khẩu/i).fill(adminPassword);
  await page.getByRole("button", { name: /Đăng nhập/i }).click();
  await page.waitForURL(
    (url) => url.pathname === "/admin" || url.pathname.startsWith("/admin/"),
    { timeout: 25_000 },
  );
}

const browser = await chromium.launch();

// Desktop PDP
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${base}/san-pham/ao-hoodie-essential`, {
    waitUntil: "networkidle",
  });
  const video = page.getByTestId("pdp-product-video");
  await video.waitFor({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(outDir, "pdp-video-desktop.png"),
    fullPage: false,
  });
  await page.close();
}

// Mobile PDP
{
  const iPhone = devices["iPhone 13"];
  const page = await browser.newPage({ ...iPhone });
  await page.goto(`${base}/san-pham/ao-hoodie-essential`, {
    waitUntil: "networkidle",
  });
  await page.getByTestId("pdp-product-video").waitFor({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(outDir, "pdp-video-mobile.png"),
    fullPage: false,
  });
  await page.close();
}

// Admin upload UI
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page);
  await page.goto(`${base}/admin/products`, { waitUntil: "networkidle" });
  const manage = page.getByTestId("manage-media-ao-hoodie-essential");
  if (await manage.count()) {
    await manage.click();
    await page.getByTestId("admin-video-manager").waitFor();
  } else {
    await page.getByRole("button", { name: /Thêm sản phẩm/i }).click();
    await page.getByTestId("admin-video-dropzone").waitFor();
  }
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(outDir, "admin-video-upload.png"),
    fullPage: false,
  });
  await page.close();
}

await browser.close();
console.log("Screenshots written to", outDir);
