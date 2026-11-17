import { chromium } from "@playwright/test";
import path from "path";

const out =
  "C:/Users/ADMIN/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-277c8ed9-f1c9-4705-96c7-25d86dbd9ada/files/media/home-v2/band-compare";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(700);

const banner = page.locator("section").filter({ has: page.getByTestId("banner-title") });
const diverse = page.locator("section").filter({ has: page.getByTestId("diverse-title") });
const phoi = page.locator("section").filter({ has: page.getByTestId("phoi-mau-type") });
await banner.screenshot({ path: path.join(out, "section-banner.png") });
await diverse.screenshot({ path: path.join(out, "section-diverse.png") });
await phoi.screenshot({ path: path.join(out, "section-phoi.png") });

const m = await page.evaluate(() => {
  const d = document.querySelector("[data-testid=diverse-title]");
  const b = document.querySelector("[data-testid=banner-title]");
  const desc = b?.parentElement?.querySelector("p");
  const br = (el) => (el ? el.getBoundingClientRect() : null);
  return {
    diverseLines: d
      ? [...d.querySelectorAll("span")].map((s) => s.textContent)
      : null,
    diverseH: br(d)?.height,
    bannerW: br(b)?.width,
    descW: br(desc)?.width,
    pageW: window.innerWidth,
    bannerDescFs: desc ? getComputedStyle(desc).fontSize : null,
    verticalFs: getComputedStyle(
      document.querySelector("[data-testid=phoi-vertical-label] p"),
    ).fontSize,
  };
});
console.log(JSON.stringify(m, null, 2));
await browser.close();
