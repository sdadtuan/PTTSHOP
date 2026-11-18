/**
 * Idempotent, NON-destructive colour repair for ALL products:
 *  1. A variant whose colour field holds several colours ("trắng/nâu/xám/xanh", "Đen/nâu")
 *     AND still has the old default hex (#111111 / empty) is split into one variant per
 *     colour with the right hex. The original row (id, SKU, orders) becomes the first
 *     colour; its stock is DIVIDED across the colours (never invented). If a target
 *     colour+size already exists, its share is added to that row instead.
 *  2. Single-colour variants on the old default #111111 whose name isn't black get the
 *     hex from the name ("Trắng" → #FFFFFF).
 *  3. Two-tone colourways saved with their own hex (e.g. "Đen/Kem" #222222) are left alone.
 *  4. Images tagged with a split combined name become shared (colour = null).
 * Nothing is deleted. Usage: npx tsx scripts/repair-color-variants.ts [--dry]
 */
import { PrismaClient } from "@prisma/client";
import {
  colorNameToHex,
  LEGACY_DEFAULT_HEX,
  prettyColorName,
  resolveSwatch,
  splitColorNames,
} from "../src/lib/color-names";
import { skuPart } from "../src/lib/product-media";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");
const UNKNOWN = "#CCCCCC";

async function uniqueSku(base: string) {
  let sku = base;
  for (let n = 2; await prisma.productVariant.findUnique({ where: { sku } }); n++) sku = `${base}-${n}`;
  return sku;
}

async function main() {
  const products = await prisma.product.findMany({
    include: { variants: { orderBy: { id: "asc" } }, images: true },
    orderBy: { slug: "asc" },
  });
  const report: string[] = [];
  const skipped: string[] = [];

  for (const p of products) {
    const log: string[] = [];
    const splitNames = new Set<string>();
    for (const v of p.variants) {
      const stored = (v.colorHex || "").toUpperCase();
      const sw = resolveSwatch(v.color, stored || null);
      const legacy = !stored || (stored === LEGACY_DEFAULT_HEX && sw.hex !== LEGACY_DEFAULT_HEX);
      const parts = splitColorNames(v.color);
      const orders = await prisma.orderItem.count({ where: { variantId: v.id } });

      if (parts.length > 1 && !legacy) {
        skipped.push(`${p.slug} | ${v.sku} | "${v.color}" ${stored} (2 tông, có mã màu riêng → giữ nguyên)`);
        continue;
      }
      if (parts.length > 1) {
        splitNames.add(v.color);
        const n = parts.length;
        const base = Math.floor(v.stock / n);
        const rem = v.stock - base * n;
        for (const [i, raw] of parts.entries()) {
          const color = prettyColorName(raw);
          const hex = colorNameToHex(raw) ?? UNKNOWN;
          const stock = base + (i < rem ? 1 : 0);
          const unknown = hex === UNKNOWN ? " (KHÔNG NHẬN RA TÊN MÀU → xám, cần chọn lại)" : "";
          if (i === 0) {
            log.push(`  ~ ${v.sku} [id ${v.id}${orders ? `, ${orders} đơn` : ""}]: "${v.color}"/${v.size} stock ${v.stock} → "${color}" ${hex} stock ${stock}${unknown}`);
            if (!DRY) await prisma.productVariant.update({ where: { id: v.id }, data: { color, colorHex: hex, stock } });
            continue;
          }
          const existing = await prisma.productVariant.findFirst({ where: { productId: p.id, color, size: v.size } });
          if (existing) {
            log.push(`  + ${existing.sku}: cộng ${stock} tồn (đã có "${color}"/${v.size})`);
            if (!DRY && stock) await prisma.productVariant.update({ where: { id: existing.id }, data: { stock: existing.stock + stock } });
            continue;
          }
          const sku = DRY ? `${skuPart(p.slug)}-${skuPart(color)}-${skuPart(v.size)}` : await uniqueSku(`${skuPart(p.slug)}-${skuPart(color)}-${skuPart(v.size)}`);
          log.push(`  + ${sku}: "${color}" ${hex} / ${v.size} stock ${stock} giá ${v.price}${unknown}`);
          if (!DRY)
            await prisma.productVariant.create({
              data: { productId: p.id, sku, color, colorHex: hex, size: v.size, price: v.price, compareAt: v.compareAt, stock },
            });
        }
        continue;
      }
      if (legacy) {
        const hex = colorNameToHex(v.color);
        if (hex && hex !== stored) {
          log.push(`  ~ ${v.sku}: "${v.color}" ${stored || "(trống)"} → ${hex}`);
          if (!DRY) await prisma.productVariant.update({ where: { id: v.id }, data: { colorHex: hex } });
        } else if (!hex) {
          skipped.push(`${p.slug} | ${v.sku} | "${v.color}" không nhận ra tên màu — giữ nguyên, PDP hiện chấm trung tính`);
        }
      }
    }
    for (const img of p.images) {
      if (img.color && splitNames.has(img.color)) {
        log.push(`  ~ ảnh ${img.url}: màu "${img.color}" → dùng chung`);
        if (!DRY) await prisma.productImage.update({ where: { id: img.id }, data: { color: null } });
      }
    }
    if (log.length) report.push(`${p.slug} (${p.name}, id ${p.id})\n${log.join("\n")}`);
  }

  console.log(`[${DRY ? "DRY" : "DONE"}] ${report.length} sản phẩm thay đổi`);
  console.log(report.join("\n") || "  (không có gì cần sửa)");
  if (skipped.length) console.log(`Giữ nguyên:\n  ${skipped.join("\n  ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
