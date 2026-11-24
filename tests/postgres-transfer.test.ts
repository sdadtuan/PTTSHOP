import { execSync, spawnSync } from "child_process";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import {
  assertSqliteSource,
  columnHash,
  jsonTextFields,
  openSqlite,
  runImport,
  runVerify,
  sqliteBoolean,
  sqliteInstantToUtc,
  sqliteJsonText,
} from "../src/lib/sqlite-transfer";
import { testPgUrl } from "./pg";

const ms = Date.UTC(2026, 10, 24, 9, 30, 0, 123);
const secret = "hash-should-not-print";
const jsonExact = "[\"Áo\",\"  \"]";
const jsonRaw = "{not json";
const url = testPgUrl("pttshop_xfer");
const dir = mkdtempSync(join(tmpdir(), "pttshop-xfer-"));
const sqliteFile = join(dir, "copy.db");
const emptyExclude = join(dir, "exclude.txt");

function sql(db: ReturnType<typeof openSqlite>, statement: string, params: unknown[] = []) {
  db.prepare(statement).run(...params);
}

describe("sqlite value conversion", () => {
  it("converts epoch milliseconds and ISO strings to the same UTC instant", () => {
    const fromMs = sqliteInstantToUtc(ms);
    const fromIso = sqliteInstantToUtc("2026-11-24T09:30:00.123Z");
    const fromNaive = sqliteInstantToUtc("2026-11-24 09:30:00.123");
    expect(fromMs?.toISOString()).toBe("2026-11-24T09:30:00.123Z");
    expect(fromIso?.getTime()).toBe(ms);
    expect(fromNaive?.getTime()).toBe(ms);
  });

  it("maps SQLite 0 and 1 to false and true", () => {
    expect(sqliteBoolean(0, true)).toBe(false);
    expect(sqliteBoolean(1, true)).toBe(true);
    expect(sqliteBoolean("0", true)).toBe(false);
    expect(sqliteBoolean("1", true)).toBe(true);
  });

  it("copies JSON text without parsing and hashes null separately from an empty string", () => {
    expect(sqliteJsonText(jsonRaw)).toBe(jsonRaw);
    expect(jsonTextFields()).toHaveLength(19);
    expect(columnHash([{ id: "a", value: null }])).not.toBe(columnHash([{ id: "a", value: "" }]));
  });

  it("refuses the live production database path", () => {
    expect(() => assertSqliteSource("/var/www/pttshop/data/prod.db")).toThrow(/prod\.db/);
  });
});

describe("sqlite import and verify", () => {
  const previous = process.env.DATABASE_URL;

  afterAll(() => {
    process.env.DATABASE_URL = previous;
  });

  it("imports a backup, matches every check, and fails when one boolean changes", async () => {
    process.env.DATABASE_URL = url;
    process.env.SQLITE_SOURCE = sqliteFile;
    process.env.EXCLUDE_LIST = emptyExclude;
    execSync("printf '' > " + JSON.stringify(emptyExclude));
    const reset = new PrismaClient({ datasourceUrl: url });
    await reset.$executeRawUnsafe("DROP SCHEMA IF EXISTS public CASCADE");
    await reset.$executeRawUnsafe("CREATE SCHEMA public");
    await reset.$disconnect();
    execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" });

    const db = openSqlite(sqliteFile, false);
    sql(db, `CREATE TABLE "User" (id TEXT, email TEXT, password TEXT, role TEXT, emailVerified TEXT, createdAt INTEGER, updatedAt TEXT)`);
    sql(db, `INSERT INTO "User" VALUES (?, ?, ?, ?, ?, ?, ?)`, ["u1", "admin@test.local", secret, "ADMIN", "2026-11-24 09:30:00.123", ms, "2026-11-24T09:30:00.123Z"]);
    sql(db, `CREATE TABLE "Category" (id TEXT, name TEXT, slug TEXT, parentId TEXT, createdAt INTEGER)`);
    sql(db, `INSERT INTO "Category" VALUES (?, ?, ?, ?, ?)`, ["c-child", "Con", "con", "c-parent", ms]);
    sql(db, `INSERT INTO "Category" VALUES (?, ?, ?, ?, ?)`, ["c-parent", "Cha", "cha", null, ms]);
    sql(db, `CREATE TABLE "Collection" (id TEXT, name TEXT, slug TEXT, createdAt INTEGER)`);
    sql(db, `INSERT INTO "Collection" VALUES (?, ?, ?, ?)`, ["col1", "Moi", "moi", ms]);
    sql(db, `CREATE TABLE "Product" (id TEXT, name TEXT, slug TEXT, gender TEXT, categoryId TEXT, rating REAL, isNew INTEGER, isFeatured INTEGER, detailBulletsJson TEXT, createdAt INTEGER, updatedAt TEXT)`);
    sql(db, `INSERT INTO "Product" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ["p1", "Ao demo", "demo-giu-lai", "UNISEX", "c-child", 4.5, 1, 0, jsonExact, ms, "2026-11-24T09:30:00.123Z"]);
    sql(db, `INSERT INTO "Product" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ["p2", "Ao that", "ao-that", "UNISEX", null, 3.25, 0, 1, jsonRaw, ms, "2026-11-24T09:30:00.123Z"]);
    sql(db, `CREATE TABLE "ProductVariant" (id TEXT, sku TEXT, color TEXT, size TEXT, price INTEGER, stock INTEGER, productId TEXT)`);
    sql(db, `INSERT INTO "ProductVariant" VALUES (?, ?, ?, ?, ?, ?, ?)`, ["v1", "DEMO-AT-TRANG-M", "Trang", "M", 249000, 17, "p1"]);
    sql(db, `INSERT INTO "ProductVariant" VALUES (?, ?, ?, ?, ?, ?, ?)`, ["v2", "DEMO-SN-NAM-DEN-41", "Den", "41", 300000, 15, "p2"]);
    sql(db, `CREATE TABLE "ProductCollection" (productId TEXT, collectionId TEXT)`);
    sql(db, `INSERT INTO "ProductCollection" VALUES (?, ?)`, ["p1", "col1"]);
    sql(db, `CREATE TABLE "Order" (id TEXT, orderNumber TEXT, status TEXT, paymentMethod TEXT, paymentStatus TEXT, customerName TEXT, customerPhone TEXT, address TEXT, subtotal INTEGER, total INTEGER, createdAt TEXT, updatedAt INTEGER)`);
    sql(db, `INSERT INTO "Order" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ["o1", "PTT1", "PENDING", "COD", "UNPAID", "A", "0900000000", "Q1", 100000, 100000, "2026-11-24 09:30:00.123", ms]);
    sql(db, `INSERT INTO "Order" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ["o2", "PTT2", "PENDING", "BANK_TRANSFER", "PENDING", "B", "0900000001", "Q2", 50000, 50000, "2026-11-24 09:30:00.123", ms]);
    db.close();

    const logs: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));
    try {
      expect(await runImport()).toBe(0);
      expect(await runImport()).toBe(0);
    } finally {
      console.log = original;
    }
    expect(logs.join("\n")).not.toContain(secret);
    expect(logs.join("\n")).toContain("Không có sequence");

    const check = new PrismaClient({ datasourceUrl: url });
    const demo = await check.product.findUniqueOrThrow({ where: { slug: "demo-giu-lai" } });
    const raw = await check.product.findUniqueOrThrow({ where: { slug: "ao-that" } });
    const child = await check.category.findUniqueOrThrow({ where: { id: "c-child" } });
    const user = await check.user.findUniqueOrThrow({ where: { id: "u1" } });
    expect(demo.detailBulletsJson).toBe(jsonExact);
    expect(raw.detailBulletsJson).toBe(jsonRaw);
    expect(demo.isNew).toBe(true);
    expect(demo.isFeatured).toBe(false);
    expect(child.parentId).toBe("c-parent");
    expect(user.createdAt.toISOString()).toBe("2026-11-24T09:30:00.123Z");
    expect(user.password).toBe(secret);
    expect(await check.productCollection.count()).toBe(1);
    expect(await check.user.count()).toBe(1);
    await check.$disconnect();

    console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));
    let report: Awaited<ReturnType<typeof runVerify>>;
    try {
      report = await runVerify();
    } finally {
      console.log = original;
    }
    expect(report.ok, report.lines.filter((line) => line.includes("Lệch") || line.includes("lệch") || line.includes("không có trong schema")).join("\n")).toBe(true);
    expect(report.lines.some((line) => line.startsWith("Mẫu thời gian") && line.includes("2026-11-24T09:30:00.123Z"))).toBe(true);
    expect(report.lines).toContain("Tổng tiền đơn sqlite=150000 postgres=150000");
    expect(report.lines).toContain("Tổng tồn sqlite=32 postgres=32");
    expect(report.lines).toContain("Tồn kho DEMO-AT-TRANG-M sqlite=17 postgres=17");
    expect(report.lines).toContain("Tồn kho DEMO-SN-NAM-DEN-41 sqlite=15 postgres=15");
    expect(report.lines.some((line) => line.startsWith("Trung bình rating") && line.includes("3.875"))).toBe(true);
    expect(report.lines).toContain("Hash Product.detailBulletsJson khớp");
    expect(report.lines.join("\n")).not.toContain(secret);

    const broken = new PrismaClient({ datasourceUrl: url });
    await broken.product.update({ where: { id: "p1" }, data: { isNew: false } });
    await broken.$disconnect();
    const failed = await runVerify();
    expect(failed.ok).toBe(false);
    expect(failed.lines.some((line) => line.includes("Boolean Product.isNew"))).toBe(true);

    const missing = spawnSync("npx", ["tsx", "scripts/import-from-sqlite.ts"], {
      env: { ...process.env, DATABASE_URL: url, SQLITE_SOURCE: sqliteFile, EXCLUDE_LIST: join(dir, "missing-exclude.txt") },
      encoding: "utf8",
    });
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain("EXCLUDE_LIST");
    expect(missing.stderr).not.toContain(secret);
  }, 120_000);
});
