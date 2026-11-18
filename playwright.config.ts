import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
// Extra device projects only run the responsive specs (full suite stays chromium + mobile).
const RESPONSIVE = /responsive.*\.spec\.ts/;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
      },
    },
    { name: "webkit-iphone", testMatch: RESPONSIVE, use: { ...devices["iPhone 13"] } },
    { name: "pixel", testMatch: RESPONSIVE, use: { ...devices["Pixel 7"] } },
    { name: "ipad", testMatch: RESPONSIVE, use: { ...devices["iPad (gen 7)"] } },
    { name: "ipad-landscape", testMatch: RESPONSIVE, use: { ...devices["iPad (gen 7) landscape"] } },
  ],
});
