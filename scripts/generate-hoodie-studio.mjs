/**
 * Consistent studio hoodie renders — same silhouette per colour, never mismatched SKUs.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = (...p) => join(root, "public", "images", "hoodies", ...p);

const COLORS = [
  { name: "Kem", key: "kem", hex: "#E8DCC8", brand: "ESSENTIALS", ink: "#1a1a1a" },
  { name: "Đen", key: "den", hex: "#1C1C1C", brand: "ESSENTIALS", ink: "#f5f5f5" },
  { name: "Nâu", key: "nau", hex: "#6B4423", brand: "ESSENTIALS", ink: "#f5f5f5" },
  { name: "Xám", key: "xam", hex: "#C4C4C4", brand: "PTT Shop", ink: "#1a1a1a" },
  { name: "Hồng", key: "hong", hex: "#E8A0BF", brand: "PTT Shop", ink: "#1a1a1a" },
];

function shade(hex, amt) {
  const n = hex.replace("#", "");
  let r = parseInt(n.slice(0, 2), 16) + amt;
  let g = parseInt(n.slice(2, 4), 16) + amt;
  let b = parseInt(n.slice(4, 6), 16) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function hoodieSvg({
  w,
  h,
  hex,
  brand,
  ink,
  colorName,
  pose = "front",
  fabric = false,
}) {
  const mid = shade(hex, 12);
  const dark = shade(hex, -28);
  const light = shade(hex, 28);
  const bg = "#f4f1ec";

  if (fabric) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <pattern id="knit" width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="${hex}"/>
      <path d="M0 5 H10 M5 0 V10" stroke="${dark}" stroke-width="0.6" opacity="0.25"/>
    </pattern>
    <radialGradient id="vignette" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="${light}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${dark}" stop-opacity="0.25"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#knit)"/>
  <rect width="${w}" height="${h}" fill="url(#vignette)"/>
  <text x="${w / 2}" y="${h / 2}" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial Black, Impact, sans-serif" font-size="${Math.round(w * 0.09)}"
    letter-spacing="10" fill="${ink}" opacity="0.92">${brand}</text>
  <text x="${w / 2}" y="${h * 0.62}" text-anchor="middle"
    font-family="Arial,sans-serif" font-size="${Math.round(w * 0.028)}"
    fill="${ink}" opacity="0.55">CHI TIẾT CHẤT NỈ · ${colorName.toUpperCase()}</text>
</svg>`;
  }

  const head =
    pose === "back"
      ? `<ellipse cx="450" cy="165" rx="58" ry="46" fill="#e7c9ad"/>`
      : `<g>
          <ellipse cx="450" cy="155" rx="60" ry="48" fill="#e7c9ad"/>
          <ellipse cx="430" cy="150" rx="6" ry="4" fill="#5c4033" opacity="0.35"/>
          <ellipse cx="470" cy="150" rx="6" ry="4" fill="#5c4033" opacity="0.35"/>
        </g>`;

  const hood =
    pose === "side"
      ? `<path d="M410 210 Q470 120 540 210 L520 280 L430 275 Z" fill="${dark}"/>`
      : `<path d="M340 220 Q450 110 560 220 L540 295 L360 295 Z" fill="${dark}"/>`;

  const body =
    pose === "side"
      ? `<path d="M390 250 L560 235 L650 360 L590 395 L575 760 L395 760 L380 400 L310 360 Z" fill="${hex}"/>
         <path d="M420 520 L560 510 L550 640 L430 650 Z" fill="${dark}" opacity="0.45"/>`
      : pose === "back"
        ? `<path d="M280 260 L620 260 L730 390 L640 430 L620 760 L280 760 L260 430 L170 390 Z" fill="${hex}"/>
           <path d="M360 220 Q450 140 540 220 L520 300 L380 300 Z" fill="${dark}"/>`
        : `<path d="M270 270 L630 270 L740 400 L650 440 L625 760 L275 760 L250 440 L160 400 Z" fill="${hex}"/>
           <path d="M330 520 L570 520 L555 670 L345 670 Z" fill="${dark}" opacity="0.4"/>
           <line x1="415" y1="295" x2="415" y2="430" stroke="${light}" stroke-width="5" stroke-linecap="round"/>
           <line x1="485" y1="295" x2="485" y2="430" stroke="${light}" stroke-width="5" stroke-linecap="round"/>`;

  const brandY = pose === "back" ? 430 : 430;
  const brandText =
    fabric
      ? ""
      : `<text x="450" y="${brandY}" text-anchor="middle"
          font-family="Arial Black, Impact, sans-serif" font-size="42"
          letter-spacing="8" fill="${ink}" opacity="0.92">${brand}</text>`;

  const pants = `<g opacity="0.95">
    <rect x="320" y="760" width="105" height="230" rx="6" fill="#222"/>
    <rect x="475" y="760" width="105" height="230" rx="6" fill="#1a1a1a"/>
  </g>`;

  const sleeveFold =
    pose === "front"
      ? `<path d="M170 400 L250 440 L255 560 L175 530 Z" fill="${mid}" opacity="0.55"/>
         <path d="M730 400 L650 440 L645 560 L725 530 Z" fill="${mid}" opacity="0.55"/>`
      : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#faf8f4"/>
      <stop offset="100%" stop-color="#ebe6de"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity="0.18"/>
    </filter>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${light}" stop-opacity="0.35"/>
      <stop offset="55%" stop-color="${hex}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${dark}" stop-opacity="0.25"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="36" y="36" width="54" height="40" rx="10" fill="#f97316"/>
  <g filter="url(#soft)">
    ${head}
    ${hood}
    ${body}
    <rect x="270" y="270" width="360" height="490" fill="url(#shine)" opacity="0.55"/>
    ${sleeveFold}
    ${brandText}
    ${pants}
  </g>
  <text x="450" y="1040" text-anchor="middle" font-family="Arial,sans-serif"
    font-size="22" fill="#666">${colorName} · Hoodie Essential</text>
</svg>`;
}

async function render(c, file, opts) {
  const w = opts.fabric ? 1000 : 900;
  const h = opts.fabric ? 1000 : 1200;
  const svg = hoodieSvg({
    w,
    h,
    hex: c.hex,
    brand: c.brand,
    ink: c.ink,
    colorName: c.name,
    ...opts,
  });
  const buf = await sharp(Buffer.from(svg))
    .jpeg({ quality: 93, mozjpeg: true })
    .toBuffer();
  const dest = out(c.key, file);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, buf);
  console.log("wrote", dest.replace(root, ""));
  return `/images/hoodies/${c.key}/${file}`;
}

async function main() {
  for (const c of COLORS) {
    const shots = [];
    shots.push(await render(c, "01-front.jpg", { pose: "front" }));
    shots.push(await render(c, "02-side.jpg", { pose: "side" }));
    shots.push(await render(c, "03-back.jpg", { pose: "back" }));
    shots.push(await render(c, "04-front-alt.jpg", { pose: "front" }));
    shots.push(await render(c, "05-fabric.jpg", { fabric: true }));
    writeFileSync(
      out(c.key, "meta.json"),
      JSON.stringify({ name: c.name, hex: c.hex, brand: c.brand, shots }, null, 2),
    );
  }
  console.log("Studio hoodie galleries ready.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
