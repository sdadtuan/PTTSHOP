/**
 * Gắn 12 ảnh webp đã duyệt làm ảnh chính. Ẩn mọi ảnh Unsplash của đúng 12 sản phẩm đó.
 * Không xóa dòng, không xóa file cũ, không đụng demo, không đọc .env.
 *
 * Staging:
 *   pg_dump --data-only --table='"ProductImage"' --dbname=pttshop_staging \
 *     -f ~/pttshop_staging-productimage-before-ai-v1.dump
 *   DATABASE_URL='postgresql://…/pttshop_staging' MEDIA_DIR=/đường/dẫn/media/staging \
 *     npx tsx scripts/import-approved-images.ts --zip /đường/dẫn/ai-v1.zip --database pttshop_staging --dry-run
 *   # bỏ --dry-run để ghi
 *
 * Production chỉ sau "OK deploy", thêm --confirm-production và --database pttshop_prod.
 * MEDIA_DIR production: /var/www/pttshop/data/media
 *
 * Quay lui: dùng data/media/import-receipts/ai-v1.json
 *   DELETE FROM "ProductImage" WHERE id IN (created ids);
 *   UPDATE từng dòng updated về previous.sortOrder và previous.isHidden;
 *   xóa đúng các file created.url trong uploads.
 */
import { createHash, randomUUID } from "crypto";
import { execFile } from "child_process";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import { PrismaClient } from "@prisma/client";
import { mediaRoot } from "../src/lib/catalog-import-commit";
import {
  APPROVED_SLUGS,
  planApprovedPrimary,
  webpDimensions,
  type ExistingProductImage,
  type ImagePlan,
} from "../src/lib/import-approved-images";

const execFileAsync = promisify(execFile);

function argValue(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function parseSums(text: string): Map<string, string> {
  const sums = new Map<string, string>();
  for (const line of text.split("\n")) {
    const match = /^([a-f0-9]{64})\s+(\S+)\s*$/i.exec(line.trim());
    if (!match) continue;
    sums.set(path.posix.basename(match[2]!), match[1]!.toLowerCase());
  }
  return sums;
}

async function extractWebDir(zipPath: string): Promise<string> {
  const dest = path.join(tmpdir(), `ptt-ai-v1-${Date.now()}`);
  await mkdir(dest, { recursive: true });
  await execFileAsync("unzip", ["-q", zipPath, "ai-v1/web/*", "-d", dest]);
  return path.join(dest, "ai-v1", "web");
}

async function findUploadBySha(dir: string, digest: string): Promise<string | null> {
  let names: string[] = [];
  try {
    names = await readdir(dir);
  } catch {
    return null;
  }
  for (const name of names) {
    if (!name.endsWith(".webp")) continue;
    const buf = await readFile(path.join(dir, name));
    if (sha256(buf) === digest) return `/media/uploads/${name}`;
  }
  return null;
}

async function storeWebp(dir: string, buf: Buffer): Promise<string> {
  await mkdir(dir, { recursive: true });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
    const dest = path.join(dir, name);
    try {
      await writeFile(dest, buf, { flag: "wx" });
      return `/media/uploads/${name}`;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  }
  throw new Error("Không tạo được tên file upload không trùng");
}

async function main() {
  const zipPath = argValue("--zip");
  const expectedDb = argValue("--database");
  const dryRun = process.argv.includes("--dry-run");
  const confirmProduction = process.argv.includes("--confirm-production");
  if (!zipPath || !expectedDb) {
    console.error("Cần --zip <ai-v1.zip> và --database <tên database>.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("Thiếu DATABASE_URL trong môi trường lệnh. Không đọc .env. Dừng.");
    process.exit(1);
  }
  if (expectedDb === "pttshop_prod" && !confirmProduction) {
    console.error("pttshop_prod cần --confirm-production sau câu OK deploy. Dừng.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const current = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  const dbName = current[0]?.name ?? "";
  console.log(`database=${dbName}`);
  if (dbName !== expectedDb) {
    console.error(`Database hiện tại là ${dbName}, lệnh yêu cầu ${expectedDb}. Dừng, không ghi.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const webDir = await extractWebDir(path.resolve(zipPath));
  const sums = parseSums(await readFile(path.join(webDir, "SHA256SUMS"), "utf8"));
  const sources = new Map<string, Buffer>();
  for (const slug of APPROVED_SLUGS) {
    const file = path.join(webDir, `${slug}.webp`);
    const buf = await readFile(file);
    const digest = sha256(buf);
    const expected = sums.get(`${slug}.webp`);
    if (digest !== expected) {
      console.error(`${slug}: sha256 không khớp SHA256SUMS. Dừng.`);
      await prisma.$disconnect();
      process.exit(1);
    }
    const size = webpDimensions(buf);
    if (!size || size.width !== 1200 || size.height !== 1500) {
      console.error(`${slug}: cần 1200x1500, đọc được ${size ? `${size.width}x${size.height}` : "không"}. Dừng.`);
      await prisma.$disconnect();
      process.exit(1);
    }
    sources.set(slug, buf);
  }

  const products = await prisma.product.findMany({
    where: { slug: { in: [...APPROVED_SLUGS] } },
    select: {
      id: true,
      name: true,
      slug: true,
      isDemo: true,
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, sortOrder: true, isHidden: true } },
    },
  });
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  for (const slug of APPROVED_SLUGS) {
    const product = bySlug.get(slug);
    if (!product) {
      console.error(`${slug}: không có trong database. Dừng, không ghi.`);
      await prisma.$disconnect();
      process.exit(1);
    }
    if (product.isDemo) {
      console.error(`${slug}: là demo. Dừng, không ghi.`);
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  const uploadDir = path.join(mediaRoot(), "uploads");
  const plans = new Map<string, { productId: string; name: string; digest: string; plan: ImagePlan; buf: Buffer }>();
  for (const slug of APPROVED_SLUGS) {
    const product = bySlug.get(slug)!;
    const buf = sources.get(slug)!;
    const digest = sha256(buf);
    const images: ExistingProductImage[] = [];
    for (const image of product.images) {
      let imageSha: string | null = null;
      if (image.url.startsWith("/media/uploads/") && image.url.endsWith(".webp")) {
        try {
          imageSha = sha256(await readFile(path.join(mediaRoot(), image.url.replace(/^\/media\//, ""))));
        } catch {
          imageSha = null;
        }
      }
      images.push({ ...image, sha256: imageSha });
    }
    const plan = planApprovedPrimary({ images, approvedSha256: digest });
    const reused = await findUploadBySha(uploadDir, digest);
    plans.set(slug, { productId: product.id, name: product.name, digest, plan, buf });
    const hidden = plan.updates.filter((update) => update.isHidden && !update.previous.isHidden);
    console.log(
      [
        dryRun ? "DRY" : "APPLY",
        slug,
        product.name,
        plan.needsCreate ? `ảnh chính ${reused ?? "(file mới)"}` : "giữ ảnh đã duyệt",
        `ẩn Unsplash ${hidden.length}`,
        `đẩy thứ tự ${plan.updates.filter((update) => update.sortOrder !== update.previous.sortOrder).length}`,
      ].join("\t"),
    );
  }

  if (dryRun) {
    console.log("Dry-run. Không copy file, không ghi database.");
    await prisma.$disconnect();
    return;
  }

  const created: Array<{ id: string; slug: string; url: string }> = [];
  const updated: Array<{ id: string; slug: string; previous: { sortOrder: number; isHidden: boolean }; next: { sortOrder: number; isHidden: boolean } }> = [];

  for (const slug of APPROVED_SLUGS) {
    const item = plans.get(slug)!;
    let url = await findUploadBySha(uploadDir, item.digest);
    if (item.plan.needsCreate && !url) url = await storeWebp(uploadDir, item.buf);
    const written = url;
    await prisma.$transaction(async (tx) => {
      for (const update of item.plan.updates) {
        await tx.productImage.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder, isHidden: update.isHidden },
        });
        updated.push({
          id: update.id,
          slug,
          previous: update.previous,
          next: { sortOrder: update.sortOrder, isHidden: update.isHidden },
        });
      }
      if (!item.plan.needsCreate || !written) return;
      const already = await tx.productImage.findFirst({ where: { productId: item.productId, url: written } });
      if (already) return;
      const row = await tx.productImage.create({
        data: {
          productId: item.productId,
          url: written,
          alt: item.name,
          color: null,
          type: "image",
          isHidden: false,
          sortOrder: 0,
        },
      });
      created.push({ id: row.id, slug, url: written });
    });
  }

  const receiptDir = path.join(mediaRoot(), "import-receipts");
  await mkdir(receiptDir, { recursive: true });
  const receiptPath = path.join(receiptDir, "ai-v1.json");
  await writeFile(
    receiptPath,
    JSON.stringify({ database: dbName, created, updated }, null, 2),
  );
  console.log(`Đã ghi ${created.length} ảnh chính. Ẩn/đẩy ${updated.length} dòng cũ. Biên bản ${receiptPath}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
