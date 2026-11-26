/**
 * Gắn 12 ảnh webp đã duyệt làm ảnh chính. Ẩn mọi ảnh Unsplash và file placeholder trống của đúng 12 sản phẩm đó.
 * Danh mục Áo thun (slug ao-thun) nhận ảnh mới của Áo Thun Nam Basic.
 * Danh mục và bộ sưu tập khác đang trỏ Unsplash được để trống, không xóa dòng.
 * Không xóa file cũ, không đụng demo, không đọc .env.
 *
 * Log id đã tạo / đã ẩn: /var/backups/pttshop/import-approved-images-<database>.json
 * và file .rollback.sql cạnh đó.
 *
 * Trước khi chạy (staging):
 *   pg_dump --data-only \
 *     --table='"ProductImage"' --table='"Category"' --table='"Collection"' \
 *     --dbname=pttshop_staging \
 *     -f /var/backups/pttshop/pttshop_staging-before-ai-v1.dump
 *   DATABASE_URL='postgresql://…/pttshop_staging' \
 *   MEDIA_DIR=/var/www/pttshop-staging/data/media \
 *     npx tsx scripts/import-approved-images.ts \
 *     --zip /đường/dẫn/ai-v1.zip --database pttshop_staging --dry-run
 *   # bỏ --dry-run để ghi. Chạy lại lần 2 phải không tạo thêm.
 *
 * Production, chỉ sau câu "OK deploy", và chỉ theo thứ tự:
 *   1. pg_dump cùng các bảng trên, --dbname=pttshop_prod,
 *      -f /var/backups/pttshop/pttshop_prod-before-ai-v1.dump
 *   2. MEDIA_DIR=/var/www/pttshop/data/media và --database pttshop_prod --confirm-production
 *   3. Kiểm storefront hết ảnh Unsplash đang hiện, 12 URL /media/uploads trả 200
 *   4. Mới deploy code đã gỡ images.unsplash.com khỏi remotePatterns
 *
 * Quay lui, đúng id trong file JSON (không đụng dòng khác):
 *   DELETE FROM "ProductImage" WHERE id IN (created[].id);
 *   UPDATE "ProductImage" SET "isHidden" = false WHERE id IN (hidden[].id);
 *   UPDATE "ProductImage" SET "sortOrder" = previousSortOrder WHERE id = reordered[].id;
 *   UPDATE "Category" / "Collection" SET image = previous WHERE id = id trong log;
 *   Xóa đúng file created[].url trong uploads.
 */
import { createHash, randomUUID } from "crypto";
import { execFile } from "child_process";
import { constants } from "fs";
import { access, mkdir, readdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import { Prisma, PrismaClient } from "@prisma/client";
import { mediaRoot } from "../src/lib/catalog-import-commit";
import {
  AO_THUN_CATEGORY_SLUG,
  AO_THUN_COVER_SLUG,
  APPROVED_SLUGS,
  IMPORT_BACKUP_DIR,
  planApprovedPrimary,
  planUnsplashField,
  rollbackSql,
  webpDimensions,
  type ExistingProductImage,
  type ImagePlan,
  type ImportLog,
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

function quoteIdent(ident: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ident)) throw new Error("Tên cột không hợp lệ");
  return `"${ident}"`;
}

type Hit = { table: string; column: string; id: string; slug: string; key: string };

async function unsplashHits(prisma: PrismaClient): Promise<Hit[]> {
  const cols = await prisma.$queryRaw<Array<{ table_name: string; column_name: string }>>`
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND c.data_type IN ('text', 'character varying')
    ORDER BY c.table_name, c.column_name`;
  const hits: Hit[] = [];
  const known = new Set(cols.map((col) => `${col.table_name}.${col.column_name}`));
  for (const col of cols) {
    const table = quoteIdent(col.table_name);
    const column = quoteIdent(col.column_name);
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string | null; slug: string | null; key: string | null }>>(
      `SELECT ${known.has(`${col.table_name}.id`) ? `${quoteIdent("id")}::text` : "NULL"} AS id,
              ${known.has(`${col.table_name}.slug`) ? `${quoteIdent("slug")}::text` : "NULL"} AS slug,
              ${known.has(`${col.table_name}.key`) ? `${quoteIdent("key")}::text` : "NULL"} AS key
       FROM ${table} WHERE ${column} LIKE '%images.unsplash.com%' LIMIT 50`,
    );
    for (const row of rows) {
      hits.push({
        table: col.table_name,
        column: col.column_name,
        id: row.id ?? "",
        slug: row.slug ?? "",
        key: row.key ?? "",
      });
    }
  }
  return hits;
}

function isNotedOnly(hit: Hit): boolean {
  return hit.table === "HomepageVersion" || hit.column.startsWith("draft") || hit.column === "snapshotJson";
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
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, sortOrder: true, isHidden: true } },
    },
  });
  const demoColumn = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'isDemo'
  `;
  const demoSlugs = demoColumn.length
    ? await prisma.$queryRaw<Array<{ slug: string }>>`
        SELECT slug FROM "Product"
        WHERE "isDemo" = true AND slug IN (${Prisma.join([...APPROVED_SLUGS])})
      `
    : [];
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  for (const slug of APPROVED_SLUGS) {
    const product = bySlug.get(slug);
    if (!product) {
      console.error(`${slug}: không có trong database. Dừng, không ghi.`);
      await prisma.$disconnect();
      process.exit(1);
    }
    if (demoSlugs.some((row) => row.slug === slug)) {
      console.error(`${slug}: là demo. Dừng, không ghi.`);
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  const uploadDir = path.join(mediaRoot(), "uploads");
  const plans = new Map<
    string,
    { productId: string; name: string; digest: string; plan: ImagePlan; buf: Buffer; existingUrl: string | null }
  >();
  for (const slug of APPROVED_SLUGS) {
    const product = bySlug.get(slug)!;
    const buf = sources.get(slug)!;
    const digest = sha256(buf);
    const images: ExistingProductImage[] = [];
    let existingUrl: string | null = null;
    for (const image of product.images) {
      let imageSha: string | null = null;
      if (image.url.startsWith("/media/uploads/") && image.url.endsWith(".webp")) {
        try {
          imageSha = sha256(await readFile(path.join(mediaRoot(), image.url.replace(/^\/media\//, ""))));
        } catch {
          imageSha = null;
        }
      }
      if (imageSha === digest) existingUrl = image.url;
      images.push({ ...image, sha256: imageSha });
    }
    const plan = planApprovedPrimary({ images, approvedSha256: digest });
    const reused = await findUploadBySha(uploadDir, digest);
    plans.set(slug, { productId: product.id, name: product.name, digest, plan, buf, existingUrl: existingUrl ?? reused });
    const hidden = plan.updates.filter((update) => update.isHidden && !update.previous.isHidden);
    console.log(
      [
        dryRun ? "DRY" : "APPLY",
        slug,
        product.name,
        plan.needsCreate ? `ảnh chính ${reused ?? "(file mới)"}` : "giữ ảnh đã duyệt",
        `ẩn ${hidden.length}`,
        `đẩy thứ tự ${plan.updates.filter((update) => update.sortOrder !== update.previous.sortOrder).length}`,
      ].join("\t"),
    );
  }

  const [categories, collections, hits, stray] = await Promise.all([
    prisma.category.findMany({ select: { id: true, slug: true, name: true, image: true } }),
    prisma.collection.findMany({ select: { id: true, slug: true, name: true, image: true } }),
    unsplashHits(prisma),
    prisma.$queryRaw<Array<{ id: string; slug: string }>>`
      SELECT pi.id, p.slug
      FROM "ProductImage" pi
      JOIN "Product" p ON p.id = pi."productId"
      WHERE (
        pi.url LIKE '%images.unsplash.com%'
        OR COALESCE(pi."posterUrl", '') LIKE '%images.unsplash.com%'
      )
      AND p.slug NOT IN (${Prisma.join([...APPROVED_SLUGS])})
    `,
  ]);
  if (!categories.some((category) => category.slug === AO_THUN_CATEGORY_SLUG)) {
    console.error("Không có danh mục ao-thun. Dừng, không ghi.");
    await prisma.$disconnect();
    process.exit(1);
  }
  const categoryPlans = categories.flatMap((category) => {
    const replacement = category.slug === AO_THUN_CATEGORY_SLUG ? "__cover__" : null;
    const planned = planUnsplashField(category.image, replacement);
    if (!planned.change) return [];
    return [{ ...category, previous: category.image, next: planned.next }];
  });
  const collectionPlans = collections.flatMap((collection) => {
    const planned = planUnsplashField(collection.image, null);
    if (!planned.change) return [];
    return [{ ...collection, previous: collection.image, next: planned.next }];
  });
  for (const category of categoryPlans) {
    console.log(
      [
        dryRun ? "DRY" : "APPLY",
        "category",
        category.slug,
        category.name,
        category.next === "__cover__" ? "Unsplash → ảnh mới của Áo Thun Nam Basic" : "Unsplash → trống",
      ].join("\t"),
    );
  }
  for (const collection of collectionPlans) {
    console.log([dryRun ? "DRY" : "APPLY", "collection", collection.slug, collection.name, "Unsplash → trống"].join("\t"));
  }
  const blocking = hits.filter(
    (hit) =>
      !isNotedOnly(hit) &&
      !(hit.table === "ProductImage" && hit.column === "url") &&
      !(hit.table === "Category" && hit.column === "image") &&
      !(hit.table === "Collection" && hit.column === "image"),
  );
  const noted = hits.filter(isNotedOnly);
  for (const hit of noted) {
    console.log(`GHI_CHU\t${hit.table}.${hit.column}\tid=${hit.id}\tslug=${hit.slug}\tkey=${hit.key}\tkhông hiện trên storefront`);
  }
  if (stray.length || blocking.length) {
    for (const row of stray) console.error(`NGOAI_PHAM_VI\tProductImage\tid=${row.id}\tslug=${row.slug}`);
    for (const hit of blocking) console.error(`NGOAI_PHAM_VI\t${hit.table}.${hit.column}\tid=${hit.id}\tslug=${hit.slug}\tkey=${hit.key}`);
    console.error("Còn URL Unsplash ngoài 12 sản phẩm, Category.image và Collection.image. Dừng, không ghi.");
    await prisma.$disconnect();
    process.exit(1);
  }

  if (dryRun) {
    console.log("Dry-run. Không copy file, không ghi database.");
    await prisma.$disconnect();
    return;
  }

  try {
    await mkdir(IMPORT_BACKUP_DIR, { recursive: true });
    await access(IMPORT_BACKUP_DIR, constants.W_OK);
  } catch {
    console.error(`Không ghi được ${IMPORT_BACKUP_DIR}. Dừng, chưa sửa database.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const created: ImportLog["created"] = [];
  const hidden: ImportLog["hidden"] = [];
  const reordered: ImportLog["reordered"] = [];
  let coverUrl = plans.get(AO_THUN_COVER_SLUG)?.existingUrl ?? null;

  for (const slug of APPROVED_SLUGS) {
    const item = plans.get(slug)!;
    let url = item.existingUrl ?? (await findUploadBySha(uploadDir, item.digest));
    if (item.plan.needsCreate && !url) url = await storeWebp(uploadDir, item.buf);
    if (slug === AO_THUN_COVER_SLUG && url) coverUrl = url;
    const written = url;
    await prisma.$transaction(async (tx) => {
      for (const update of item.plan.updates) {
        await tx.productImage.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder, isHidden: update.isHidden },
        });
        if (update.isHidden && !update.previous.isHidden) hidden.push({ id: update.id, slug });
        if (update.sortOrder !== update.previous.sortOrder) {
          reordered.push({
            id: update.id,
            slug,
            previousSortOrder: update.previous.sortOrder,
            nextSortOrder: update.sortOrder,
          });
        }
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

  const categoryLog: ImportLog["categories"] = [];
  const collectionLog: ImportLog["collections"] = [];
  if (categoryPlans.some((category) => category.next === "__cover__") && !coverUrl) {
    console.error("Chưa có ảnh Áo Thun Nam Basic để gán cho danh mục ao-thun. Dừng phần danh mục.");
    await prisma.$disconnect();
    process.exit(1);
  }
  for (const category of categoryPlans) {
    const next = category.next === "__cover__" ? coverUrl : category.next;
    await prisma.category.update({ where: { id: category.id }, data: { image: next } });
    categoryLog.push({ id: category.id, slug: category.slug, previous: category.previous, next });
  }
  for (const collection of collectionPlans) {
    await prisma.collection.update({ where: { id: collection.id }, data: { image: null } });
    collectionLog.push({ id: collection.id, slug: collection.slug, previous: collection.previous, next: null });
  }

  const log: ImportLog = {
    database: dbName,
    created,
    hidden,
    reordered,
    categories: categoryLog,
    collections: collectionLog,
  };
  const changed = created.length + hidden.length + reordered.length + categoryLog.length + collectionLog.length;
  if (changed === 0) {
    console.log("Không có thay đổi mới. Không tạo thêm dòng, không ghi đè log.");
    await prisma.$disconnect();
    return;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const canonical = path.join(IMPORT_BACKUP_DIR, `import-approved-images-${dbName}.json`);
  const jsonPath = existsSync(canonical)
    ? path.join(IMPORT_BACKUP_DIR, `import-approved-images-${dbName}-${stamp}.json`)
    : canonical;
  const sqlPath = jsonPath.replace(/\.json$/, ".rollback.sql");
  await writeFile(jsonPath, JSON.stringify(log, null, 2));
  await writeFile(sqlPath, rollbackSql(log));
  console.log(
    `Đã tạo ${created.length} ảnh chính. Ẩn ${hidden.length} ảnh. Danh mục ${categoryLog.length}. Bộ sưu tập ${collectionLog.length}. Log ${jsonPath}`,
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgresql://***"));
  process.exit(1);
});
