/**
 * One-off, idempotent, NON-destructive repair for the two "Áo Hoodie Brown Layer Club"
 * products created through the old admin quick-create form:
 *  - the old form forced one variant with hex #111111 and free-text "Đen/nâu" / "M/S/XL"
 *    → split into one variant per real colour + size (the original variant row/id/SKU is
 *      kept for the first combination; stock is split, never invented);
 *  - the only "photo" was an uploaded admin screenshot → hidden from the storefront
 *    (isHidden = true, row kept), and the real hoodie photos for each colour are added.
 * Nothing is deleted. Usage: npx tsx scripts/repair-hoodie-media.ts [--dry]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

const HEX: Record<string, string> = { Đen: "#1C1C1C", Nâu: "#6B4423", Xám: "#8A8A8A", Kem: "#E8DCC8" };
const FILE: Record<string, string> = { Đen: "den", Nâu: "nau", Xám: "xam", Kem: "kem" };
const SCREENSHOTS = ["/uploads/1794973379825-6df84374.png", "/uploads/1794974609455-5cfbd87f.png"];
const SLUGS = ["ao-hoodie-brown-layer-club", "ads"];

const cap = (s: string) => {
  const t = s.trim().toLocaleLowerCase("vi");
  return t.charAt(0).toLocaleUpperCase("vi") + t.slice(1);
};

async function main() {
  for (const slug of SLUGS) {
    const p = await prisma.product.findUnique({
      where: { slug },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
    });
    if (!p) {
      console.log(`[skip] ${slug} not found`);
      continue;
    }
    const log: string[] = [];

    // 1) variants: split combined colour / size strings
    for (const v of p.variants) {
      if (!/[\/,]/.test(v.color) && !/[\/,]/.test(v.size) && v.colorHex !== "#111111") continue;
      const colors = v.color.split(/[\/,]/).map(cap).filter(Boolean);
      const sizes = v.size.split(/[\/,]/).map((s) => s.trim().toUpperCase()).filter(Boolean);
      const combos = colors.flatMap((c) => sizes.map((s) => ({ c, s })));
      const base = Math.floor(v.stock / combos.length);
      let rest = v.stock - base * combos.length;
      for (const [i, { c, s }] of combos.entries()) {
        const stock = base + (rest-- > 0 ? 1 : 0);
        const hex = HEX[c] ?? v.colorHex ?? "#CCCCCC";
        if (i === 0) {
          log.push(`update ${v.sku}: ${v.color}/${v.size} → ${c}/${s} ${hex} stock ${stock}`);
          if (!DRY) await prisma.productVariant.update({ where: { id: v.id }, data: { color: c, colorHex: hex, size: s, stock } });
          continue;
        }
        const exists = await prisma.productVariant.findFirst({ where: { productId: p.id, color: c, size: s } });
        if (exists) continue;
        const sku = `${v.sku.replace(/-DEFAULT$/, "")}-${FILE[c]?.toUpperCase() ?? i}-${s}`;
        log.push(`create ${sku}: ${c}/${s} ${hex} stock ${stock} price ${v.price}`);
        if (!DRY)
          await prisma.productVariant.create({
            data: { productId: p.id, sku, color: c, colorHex: hex, size: s, price: v.price, compareAt: v.compareAt, stock },
          });
      }
    }

    // 2) media: hide the admin screenshot, add real photos per colour (front, back, fabric)
    for (const img of p.images) {
      if (SCREENSHOTS.includes(img.url) && !img.isHidden) {
        log.push(`hide screenshot ${img.url} (kept in DB)`);
        if (!DRY) await prisma.productImage.update({ where: { id: img.id }, data: { isHidden: true } });
      }
    }
    const variantColors = [...new Set((await prisma.productVariant.findMany({ where: { productId: p.id } })).map((v) => v.color))];
    // Brown first: it is the "Brown" hoodie, so its photo becomes the main image.
    variantColors.sort((a, b) => (a === "Nâu" ? -1 : b === "Nâu" ? 1 : 0));
    const fresh = await prisma.productImage.findMany({ where: { productId: p.id }, orderBy: { sortOrder: "asc" } });
    const toAdd: { url: string; color: string }[] = [];
    for (const c of variantColors) {
      if (!FILE[c]) continue;
      for (const view of ["front", "back", "fabric"]) {
        const url = `/images/ai-hoodies/${FILE[c]}-${view}.jpg`;
        if (!fresh.some((m) => m.url === url && m.color === c)) toAdd.push({ url, color: c });
      }
    }
    if (toAdd.length) {
      const videos = fresh.filter((m) => m.type === "video");
      const others = fresh.filter((m) => m.type !== "video");
      let order = 0;
      for (const m of videos) if (!DRY) await prisma.productImage.update({ where: { id: m.id }, data: { sortOrder: order++ } });
      else order++;
      for (const a of toAdd) {
        log.push(`add photo ${a.url} (${a.color})`);
        if (!DRY)
          await prisma.productImage.create({
            data: { productId: p.id, url: a.url, color: a.color, type: "image", alt: `${p.name} - ${a.color}`, sortOrder: order },
          });
        order++;
      }
      for (const m of others) if (!DRY) await prisma.productImage.update({ where: { id: m.id }, data: { sortOrder: order++ } });
    }
    console.log(`[${DRY ? "dry" : "done"}] ${slug}\n  ${log.join("\n  ") || "nothing to do"}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
