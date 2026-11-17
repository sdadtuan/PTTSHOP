import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const m = await page.evaluate(() => {
  const allH2 = [...document.querySelectorAll("h2")].map((h) => ({
    t: (h.textContent || "").trim().slice(0, 48),
    fs: getComputedStyle(h).fontSize,
  }));
  const badge = document.querySelector('[data-testid="hero-badge"]');
  const sq = badge?.querySelector("span");
  const badgeP = badge?.querySelector("p");
  const tile = [...document.querySelectorAll("a p")].find((p) =>
    /Áo Thun|Áo thun/i.test(p.textContent || ""),
  );
  const feature = document.querySelector("ul.mt-12 span");
  const footerLogo = [...document.querySelectorAll("footer p")].find((p) =>
    /^VIZFAS$/.test((p.textContent || "").trim()),
  );
  const productName = document.querySelector("article h3");
  return {
    h2s: allH2,
    badgeText: badgeP ? getComputedStyle(badgeP).fontSize : null,
    badgeSquare: sq
      ? {
          w: Math.round(sq.getBoundingClientRect().width),
          h: Math.round(sq.getBoundingClientRect().height),
        }
      : null,
    badgeTextH: badgeP
      ? Math.round(badgeP.getBoundingClientRect().height)
      : null,
    tile: tile ? getComputedStyle(tile).fontSize : null,
    featureIcon: feature ? getComputedStyle(feature).fontSize : null,
    footerLogo: footerLogo ? getComputedStyle(footerLogo).fontSize : null,
    productName: productName ? getComputedStyle(productName).fontSize : null,
  };
});

console.log(JSON.stringify(m, null, 2));
await browser.close();
