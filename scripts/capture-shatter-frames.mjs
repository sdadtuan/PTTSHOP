import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const out =
  "C:/Users/ADMIN/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-277c8ed9-f1c9-4705-96c7-25d86dbd9ada/files/media/home-v2/shatter-frames";
fs.mkdirSync(out, { recursive: true });

const CYCLE = 7000;
const FRAMES = [
  { name: "01-vo", pct: 0.92 }, // vỡ
  { name: "02-rap", pct: 0.08 }, // ráp
  { name: "03-xong", pct: 0.4 }, // xong / assembled
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3000/", {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForTimeout(1500);

const collage = page.getByTestId("hero-shatter-collage");
await collage.waitFor({ state: "visible" });

for (const frame of FRAMES) {
  await page.evaluate(
    ({ pct, cycle }) => {
      document.querySelectorAll(".hero-shatter__cell--anim").forEach((el) => {
        const anims = el.getAnimations?.() || [];
        if (anims.length) {
          anims.forEach((a) => {
            a.pause();
            a.currentTime = pct * cycle;
          });
          return;
        }
        // fallback: negative delay
        const node = /** @type {HTMLElement} */ (el);
        node.style.animationPlayState = "paused";
        node.style.animationDelay = `${-Math.round(pct * cycle)}ms`;
      });
    },
    { pct: frame.pct, cycle: CYCLE },
  );
  await page.waitForTimeout(150);
  const file = path.join(out, `${frame.name}.png`);
  await collage.screenshot({ path: file });
  console.log("wrote", file);
}

await browser.close();
console.log("shatter frames done");
