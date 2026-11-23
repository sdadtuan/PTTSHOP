/**
 * Generate local homepage + per-colour hoodie assets with sharp.
 * Additive / offline-friendly — no DB wipe.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = (...parts) => join(root, "public", "images", ...parts);

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "PTTSHOP-asset-gen/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function saveJpeg(buf, dest, w, h) {
  mkdirSync(dirname(dest), { recursive: true });
  await sharp(buf)
    .resize(w, h, { fit: "cover", position: "centre" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(dest);
  console.log("wrote", dest.replace(root, ""));
}

/** Soft fashion plate with apparel color block + grain (fallback when remote fails). */
async function fashionPlate({
  w,
  h,
  bg,
  accent,
  title,
  subtitle,
  shirt,
  pants,
}) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 0.08 0"/></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" filter="url(#n)" opacity="0.35"/>
  <!-- soft figure -->
  <ellipse cx="${w * 0.5}" cy="${h * 0.18}" rx="${w * 0.09}" ry="${h * 0.06}" fill="#f5e6d3"/>
  <path d="M ${w * 0.38} ${h * 0.24} Q ${w * 0.5} ${h * 0.22} ${w * 0.62} ${h * 0.24}
           L ${w * 0.72} ${h * 0.55} L ${w * 0.62} ${h * 0.55}
           L ${w * 0.58} ${h * 0.42} L ${w * 0.58} ${h * 0.78}
           L ${w * 0.42} ${h * 0.78} L ${w * 0.42} ${h * 0.42}
           L ${w * 0.38} ${h * 0.55} L ${w * 0.28} ${h * 0.55} Z"
        fill="${shirt}" opacity="0.95"/>
  <path d="M ${w * 0.42} ${h * 0.55} L ${w * 0.58} ${h * 0.55}
           L ${w * 0.6} ${h * 0.92} L ${w * 0.51} ${h * 0.92}
           L ${w * 0.5} ${h * 0.62} L ${w * 0.49} ${h * 0.92}
           L ${w * 0.4} ${h * 0.92} Z"
        fill="${pants}"/>
  <rect x="${w * 0.06}" y="${h * 0.08}" width="${w * 0.1}" height="${h * 0.06}" rx="10" fill="#f97316" opacity="0.9"/>
  <text x="${w * 0.08}" y="${h * 0.88}" fill="#111" font-family="Arial,sans-serif" font-size="${Math.round(w * 0.045)}" font-weight="700">${title}</text>
  <text x="${w * 0.08}" y="${h * 0.93}" fill="#444" font-family="Arial,sans-serif" font-size="${Math.round(w * 0.028)}">${subtitle}</text>
</svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

async function hoodieShot({
  w,
  h,
  color,
  hex,
  brand,
  angle = "front",
  closeup = false,
}) {
  const hood = hex;
  const shade = shadeHex(hex, -18);
  const light = shadeHex(hex, 22);
  const bg = closeup ? "#f3f0ea" : "#efeae3";
  const labelY = Math.round(h * 0.58);
  const chestY = Math.round(h * 0.42);

  let body;
  if (closeup) {
    body = `
      <rect x="0" y="0" width="${w}" height="${h}" fill="${hood}"/>
      <rect x="${w * 0.08}" y="${h * 0.25}" width="${w * 0.84}" height="${h * 0.2}" rx="8" fill="${shade}" opacity="0.35"/>
      <text x="${w * 0.5}" y="${h * 0.42}" text-anchor="middle" fill="${contrastText(hex)}"
        font-family="Arial Black,Arial,sans-serif" font-size="${Math.round(w * 0.09)}" letter-spacing="6" font-weight="800">${brand}</text>
      <text x="${w * 0.5}" y="${h * 0.78}" text-anchor="middle" fill="${contrastText(hex)}" opacity="0.7"
        font-family="Arial,sans-serif" font-size="${Math.round(w * 0.035)}">CHI TIẾT VẢI · ${color.toUpperCase()}</text>
    `;
  } else if (angle === "back") {
    body = `
      <ellipse cx="${w * 0.5}" cy="${h * 0.16}" rx="${w * 0.08}" ry="${h * 0.055}" fill="#e8d5c4"/>
      <path d="M ${w * 0.32} ${h * 0.2} Q ${w * 0.5} ${h * 0.14} ${w * 0.68} ${h * 0.2}
               L ${w * 0.78} ${h * 0.36} L ${w * 0.7} ${h * 0.4}
               L ${w * 0.68} ${h * 0.72} L ${w * 0.32} ${h * 0.72}
               L ${w * 0.3} ${h * 0.4} L ${w * 0.22} ${h * 0.36} Z" fill="${hood}"/>
      <path d="M ${w * 0.4} ${h * 0.2} Q ${w * 0.5} ${h * 0.12} ${w * 0.6} ${h * 0.2}
               L ${w * 0.58} ${h * 0.3} L ${w * 0.42} ${h * 0.3} Z" fill="${shade}"/>
      <rect x="${w * 0.34}" y="${h * 0.72}" width="${w * 0.14}" height="${h * 0.2}" fill="#2a2a2a"/>
      <rect x="${w * 0.52}" y="${h * 0.72}" width="${w * 0.14}" height="${h * 0.2}" fill="#2a2a2a"/>
    `;
  } else if (angle === "side") {
    body = `
      <ellipse cx="${w * 0.55}" cy="${h * 0.17}" rx="${w * 0.07}" ry="${h * 0.05}" fill="#e8d5c4"/>
      <path d="M ${w * 0.42} ${h * 0.22} L ${w * 0.62} ${h * 0.2}
               L ${w * 0.78} ${h * 0.38} L ${w * 0.7} ${h * 0.42}
               L ${w * 0.66} ${h * 0.72} L ${w * 0.4} ${h * 0.72}
               L ${w * 0.38} ${h * 0.4} L ${w * 0.3} ${h * 0.36} Z" fill="${hood}"/>
      <path d="M ${w * 0.48} ${h * 0.2} Q ${w * 0.58} ${h * 0.12} ${w * 0.64} ${h * 0.22}
               L ${w * 0.6} ${h * 0.32} L ${w * 0.48} ${h * 0.3} Z" fill="${shade}"/>
      <path d="M ${w * 0.42} ${h * 0.72} L ${w * 0.55} ${h * 0.72} L ${w * 0.56} ${h * 0.92} L ${w * 0.43} ${h * 0.92} Z" fill="#1f1f1f"/>
      <path d="M ${w * 0.55} ${h * 0.72} L ${w * 0.66} ${h * 0.72} L ${w * 0.68} ${h * 0.92} L ${w * 0.56} ${h * 0.92} Z" fill="#2c2c2c"/>
    `;
  } else {
    // front model
    body = `
      <ellipse cx="${w * 0.5}" cy="${h * 0.16}" rx="${w * 0.085}" ry="${h * 0.055}" fill="#f0dcc8"/>
      <!-- hood -->
      <path d="M ${w * 0.36} ${h * 0.22} Q ${w * 0.5} ${h * 0.12} ${w * 0.64} ${h * 0.22}
               L ${w * 0.62} ${h * 0.3} L ${w * 0.38} ${h * 0.3} Z" fill="${shade}"/>
      <!-- torso -->
      <path d="M ${w * 0.3} ${h * 0.28} L ${w * 0.7} ${h * 0.28}
               L ${w * 0.82} ${h * 0.4} L ${w * 0.72} ${h * 0.44}
               L ${w * 0.7} ${h * 0.72} L ${w * 0.3} ${h * 0.72}
               L ${w * 0.28} ${h * 0.44} L ${w * 0.18} ${h * 0.4} Z" fill="${hood}"/>
      <!-- pocket -->
      <path d="M ${w * 0.36} ${h * 0.52} L ${w * 0.64} ${h * 0.52}
               L ${w * 0.62} ${h * 0.66} L ${w * 0.38} ${h * 0.66} Z" fill="${shade}" opacity="0.55"/>
      <!-- brand -->
      <text x="${w * 0.5}" y="${chestY}" text-anchor="middle" fill="${contrastText(hex)}"
        font-family="Arial Black,Arial,sans-serif" font-size="${Math.round(w * 0.045)}" letter-spacing="4" font-weight="800">${brand}</text>
      <!-- cords -->
      <line x1="${w * 0.46}" y1="${h * 0.3}" x2="${w * 0.46}" y2="${h * 0.4}" stroke="${light}" stroke-width="3"/>
      <line x1="${w * 0.54}" y1="${h * 0.3}" x2="${w * 0.54}" y2="${h * 0.4}" stroke="${light}" stroke-width="3"/>
      <!-- pants -->
      <rect x="${w * 0.34}" y="${h * 0.72}" width="${w * 0.14}" height="${h * 0.2}" fill="#222"/>
      <rect x="${w * 0.52}" y="${h * 0.72}" width="${w * 0.14}" height="${h * 0.2}" fill="#222"/>
      <text x="${w * 0.5}" y="${labelY + 120}" text-anchor="middle" fill="#666"
        font-family="Arial,sans-serif" font-size="${Math.round(w * 0.03)}">${color}</text>
    `;
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <rect x="${w * 0.05}" y="${h * 0.05}" width="${w * 0.07}" height="${h * 0.045}" rx="8" fill="#f97316"/>
  ${body}
</svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
}

function shadeHex(hex, amount) {
  const n = hex.replace("#", "");
  const num = parseInt(n, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0xff) + amount;
  let b = (num & 0xff) + amount;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function contrastText(hex) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#1a1a1a" : "#f7f7f7";
}

/** Try remote photo; on failure generate a local plate. */
async function remoteOrPlate(url, plateOpts, dest, w, h) {
  try {
    const buf = await fetchBuffer(url);
    await saveJpeg(buf, dest, w, h);
  } catch (err) {
    console.warn("remote fail, plate:", url, String(err.message || err));
    const buf = await fashionPlate(plateOpts);
    await saveJpeg(buf, dest, w, h);
  }
}

const COLORS = [
  { key: "kem", name: "Kem", hex: "#E8DCC8", brand: "PTT SHOP" },
  { key: "den", name: "Đen", hex: "#1A1A1A", brand: "PTT SHOP" },
  { key: "nau", name: "Nâu", hex: "#6B4423", brand: "PTT SHOP" },
  { key: "xam", name: "Xám", hex: "#B8B8B8", brand: "PTT Shop" },
  { key: "hong", name: "Hồng", hex: "#E8A0BF", brand: "PTT Shop" },
];

const HOME_REMOTE = [
  {
    file: "hero-1.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 900, h: 1100, bg: "#e8f5e9", accent: "#c8e6c9", title: "TEE", subtitle: "oversized", shirt: "#7cb342", pants: "#333" },
  },
  {
    file: "hero-2.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 900, h: 1100, bg: "#fff3e0", accent: "#ffe0b2", title: "LOOK", subtitle: "street", shirt: "#ffb74d", pants: "#222" },
  },
  {
    file: "hero-3.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 900, h: 1100, bg: "#eceff1", accent: "#cfd8dc", title: "FIT", subtitle: "city", shirt: "#90a4ae", pants: "#37474f" },
  },
  {
    file: "hero-4.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 900, h: 1100, bg: "#fce4ec", accent: "#f8bbd0", title: "LAYER", subtitle: "soft", shirt: "#f48fb1", pants: "#212121" },
  },
  {
    file: "hero-5.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 900, h: 1100, bg: "#e3f2fd", accent: "#bbdefb", title: "CITY", subtitle: "walk", shirt: "#64b5f6", pants: "#263238" },
  },
  {
    file: "hero-6.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 900, h: 1100, bg: "#f3e5f5", accent: "#e1bee7", title: "VIBE", subtitle: "new", shirt: "#ab47bc", pants: "#1a1a1a" },
  },
];

const LOOKBOOK_REMOTE = [
  {
    file: "look-1.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 1000, h: 1200, bg: "#efebe9", accent: "#d7ccc8", title: "BACK", subtitle: "cargo", shirt: "#fff", pants: "#8d6e63" },
  },
  {
    file: "look-2.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 800, h: 800, bg: "#e8f5e9", accent: "#a5d6a7", title: "GREEN", subtitle: "tee", shirt: "#66bb6a", pants: "#333" },
  },
  {
    file: "look-3.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 800, h: 800, bg: "#fff8e1", accent: "#ffe082", title: "SHORTS", subtitle: "summer", shirt: "#111", pants: "#fdd835" },
  },
  {
    file: "look-4.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 800, h: 800, bg: "#efebe9", accent: "#bcaaa4", title: "CARGO", subtitle: "detail", shirt: "#8d6e63", pants: "#5d4037" },
  },
  {
    file: "look-5.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 800, h: 800, bg: "#fafafa", accent: "#e0e0e0", title: "HOODIE", subtitle: "layer", shirt: "#e0d5c5", pants: "#424242" },
  },
  {
    file: "look-6.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 800, h: 800, bg: "#e0f2f1", accent: "#80cbc4", title: "STYLE", subtitle: "mix", shirt: "#26a69a", pants: "#212121" },
  },
];

const BANNER_REMOTE = [
  {
    file: "banner-left.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 900, h: 1200, bg: "#eceff1", accent: "#b0bec5", title: "SIMPLE", subtitle: "tee", shirt: "#90a4ae", pants: "#263238" },
  },
  {
    file: "banner-right.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 900, h: 1200, bg: "#fff3e0", accent: "#ffcc80", title: "BOLD", subtitle: "set", shirt: "#ffa726", pants: "#1b1b1b" },
  },
  {
    file: "pants-hero.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 1000, h: 1400, bg: "#e8f5e9", accent: "#a5d6a7", title: "WEEKLY", subtitle: "cargo", shirt: "#81c784", pants: "#a5d6a7" },
  },
];

const CAT_REMOTE = [
  {
    file: "ao-thun.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 900, h: 1200, bg: "#e8f5e9", accent: "#81c784", title: "ÁO THUN", subtitle: "graphic", shirt: "#66bb6a", pants: "#333" },
  },
  {
    file: "quan.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 1200, h: 700, bg: "#efebe9", accent: "#d7ccc8", title: "QUẦN", subtitle: "cargo", shirt: "#fff", pants: "#a1887f" },
  },
  {
    file: "phu-kien.jpg",
    url: "/images/placeholder-product.svg",
    plate: { w: 900, h: 900, bg: "#e0f2f1", accent: "#80cbc4", title: "PHỤ KIỆN", subtitle: "cap", shirt: "#26a69a", pants: "#004d40" },
  },
];

async function main() {
  console.log("Generating homepage assets...");
  for (const item of HOME_REMOTE) {
    await remoteOrPlate(item.url, item.plate, out("home", item.file), item.plate.w, item.plate.h);
  }
  for (const item of LOOKBOOK_REMOTE) {
    await remoteOrPlate(item.url, item.plate, out("home", item.file), item.plate.w, item.plate.h);
  }
  for (const item of BANNER_REMOTE) {
    await remoteOrPlate(item.url, item.plate, out("home", item.file), item.plate.w, item.plate.h);
  }
  for (const item of CAT_REMOTE) {
    await remoteOrPlate(item.url, item.plate, out("categories", item.file), item.plate.w, item.plate.h);
  }

  console.log("Generating per-colour hoodie galleries...");
  for (const c of COLORS) {
    const shots = [
      { file: "01-front.jpg", angle: "front", closeup: false },
      { file: "02-side.jpg", angle: "side", closeup: false },
      { file: "03-back.jpg", angle: "back", closeup: false },
      { file: "04-detail.jpg", angle: "front", closeup: false },
      { file: "05-fabric.jpg", angle: "front", closeup: true },
    ];
    for (const s of shots) {
      // slight size variance so thumbs differ
      const w = s.closeup ? 1000 : 900;
      const h = s.closeup ? 1000 : 1200;
      const buf = await hoodieShot({
        w,
        h,
        color: c.name,
        hex: c.hex,
        brand: c.brand,
        angle: s.angle,
        closeup: s.closeup,
      });
      // detail: darker overlay crop feel
      let final = buf;
      if (s.file.startsWith("04")) {
        final = await sharp(buf)
          .modulate({ brightness: 1.05, saturation: 1.05 })
          .jpeg({ quality: 92 })
          .toBuffer();
      }
      const dest = out("hoodies", c.key, s.file);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, final);
      console.log("wrote", dest.replace(root, ""));
    }
  }

  // manifest for upsert
  const manifest = {
    home: HOME_REMOTE.map((i) => `/images/home/${i.file}`),
    lookbook: LOOKBOOK_REMOTE.map((i) => `/images/home/${i.file}`),
    banners: BANNER_REMOTE.map((i) => `/images/home/${i.file}`),
    categories: Object.fromEntries(
      CAT_REMOTE.map((i) => [i.file.replace(".jpg", ""), `/images/categories/${i.file}`]),
    ),
    hoodies: Object.fromEntries(
      COLORS.map((c) => [
        c.name,
        {
          key: c.key,
          hex: c.hex,
          images: [
            `/images/hoodies/${c.key}/01-front.jpg`,
            `/images/hoodies/${c.key}/02-side.jpg`,
            `/images/hoodies/${c.key}/03-back.jpg`,
            `/images/hoodies/${c.key}/04-detail.jpg`,
            `/images/hoodies/${c.key}/05-fabric.jpg`,
          ],
        },
      ]),
    ),
  };
  writeFileSync(out("manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("Done. manifest at public/images/manifest.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
