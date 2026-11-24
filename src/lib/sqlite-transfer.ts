import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";

const LIVE_SQLITE = "/var/www/pttshop/data/prod.db";

type Model = (typeof Prisma.dmmf.datamodel.models)[number];
type Field = Model["fields"][number];

type SqliteStatement = {
  all(...args: unknown[]): unknown[];
  get(...args: unknown[]): unknown;
  run(...args: unknown[]): unknown;
};

export type SqliteHandle = {
  prepare(sql: string): SqliteStatement;
  close(): void;
};

type SqliteModule = {
  DatabaseSync: new (path: string, options?: { readOnly?: boolean }) => SqliteHandle;
};

type ForeignKey = { scalars: string[]; target: string; required: boolean };

export function models(): readonly Model[] {
  return Prisma.dmmf.datamodel.models;
}

export function openSqlite(file: string, readOnly: boolean): SqliteHandle {
  const getBuiltin = (process as unknown as { getBuiltinModule?: (name: string) => SqliteModule }).getBuiltinModule;
  const loaded = getBuiltin?.("node:sqlite");
  if (!loaded?.DatabaseSync) throw new Error("Node này không có node:sqlite");
  return new loaded.DatabaseSync(file, { readOnly });
}

export function jsonTextFields() {
  const found: { model: string; field: string }[] = [];
  for (const model of models()) {
    for (const field of scalarFields(model)) {
      if (field.type === "String" && field.name.endsWith("Json")) found.push({ model: model.name, field: field.name });
    }
  }
  return found;
}

export function assertSqliteSource(file: string) {
  const resolved = resolve(file);
  let real = resolved;
  try {
    real = realpathSync(resolved);
  } catch {
    real = resolved;
  }
  if (real === LIVE_SQLITE || resolved === LIVE_SQLITE) {
    throw new Error("Từ chối đọc prod.db đang chạy. Hãy trỏ SQLITE_SOURCE vào một bản sao.");
  }
  return real;
}

/** Số > 1e12 là mili-giây. Số > 1e9 là giây. Chuỗi không có múi giờ được hiểu là UTC. */
export function sqliteInstantToUtc(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error("DateTime không hợp lệ");
    return value;
  }
  if (typeof value === "bigint" || typeof value === "number" || (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim()))) {
    const n = typeof value === "bigint" ? Number(value) : typeof value === "number" ? value : Number(value.trim());
    if (!Number.isFinite(n)) throw new Error("DateTime không hợp lệ");
    const abs = Math.abs(n);
    const ms = abs > 1e12 ? n : abs > 1e9 ? n * 1000 : n;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) throw new Error("DateTime không hợp lệ");
    return date;
  }
  if (typeof value === "string") {
    const text = value.trim();
    const naive = text.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)$/);
    const parsed = Date.parse(naive ? `${naive[1]}T${naive[2]}Z` : text);
    if (Number.isNaN(parsed)) throw new Error("DateTime không hợp lệ");
    return new Date(parsed);
  }
  if (value instanceof Uint8Array) return sqliteInstantToUtc(Buffer.from(value).toString("utf8"));
  throw new Error("DateTime không hợp lệ");
}

export function sqliteBoolean(value: unknown, required: boolean): boolean | null {
  if (value == null) {
    if (required) throw new Error("Boolean bắt buộc bị null");
    return null;
  }
  if (value === true || value === 1 || value === BigInt(1) || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === BigInt(0) || value === "0" || value === "false") return false;
  throw new Error("Boolean không phải 0/1");
}

/** Giữ nguyên chuỗi. Không JSON.parse và không JSON.stringify. */
export function sqliteJsonText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (value instanceof Uint8Array) return Buffer.from(value).toString("utf8");
  throw new Error("Cột JSON phải là chuỗi");
}

export function sqliteInt(value: unknown, required: boolean): number | null {
  if (value == null) {
    if (required) throw new Error("Số nguyên bắt buộc bị null");
    return null;
  }
  const n = typeof value === "bigint" ? Number(value) : typeof value === "number" ? value : typeof value === "string" && /^-?\d+$/.test(value.trim()) ? Number(value.trim()) : Number.NaN;
  if (!Number.isSafeInteger(n)) throw new Error("Tiền hoặc số nguyên không nguyên");
  return n;
}

export function sqliteFloat(value: unknown, required: boolean): number | null {
  if (value == null) {
    if (required) throw new Error("Số thực bắt buộc bị null");
    return null;
  }
  const n = typeof value === "number" ? value : typeof value === "bigint" ? Number(value) : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  if (!Number.isFinite(n)) throw new Error("Số thực không hợp lệ");
  return n;
}

export function columnHash(rows: { id: string; value: string | null }[]) {
  const hash = createHash("sha256");
  const sorted = [...rows].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const row of sorted) {
    hash.update(row.id);
    hash.update("\0");
    if (row.value == null) hash.update("null");
    else {
      const bytes = Buffer.from(row.value, "utf8");
      hash.update("s:");
      hash.update(bytes);
    }
    hash.update("\n");
  }
  return hash.digest("hex");
}

function scalarFields(model: Model) {
  return model.fields.filter((field) => field.kind === "scalar" || field.kind === "enum");
}

function primaryFields(model: Model) {
  if (model.primaryKey?.fields.length) return [...model.primaryKey.fields];
  const ids = model.fields.filter((field) => field.isId).map((field) => field.name);
  if (!ids.length) throw new Error(`${model.name} không có khoá chính`);
  return ids;
}

function idKey(model: Model, data: Record<string, unknown>) {
  return primaryFields(model).map((field) => String(data[field])).join("|");
}

function whereUnique(model: Model, data: Record<string, unknown>) {
  const fields = primaryFields(model);
  if (fields.length === 1) return { [fields[0]]: data[fields[0]] };
  return { [fields.join("_")]: Object.fromEntries(fields.map((field) => [field, data[field]])) };
}

function foreignKeys(model: Model): ForeignKey[] {
  const found: ForeignKey[] = [];
  for (const field of model.fields) {
    if (field.kind !== "object" || !field.relationFromFields?.length) continue;
    const scalars = [...field.relationFromFields];
    const required = scalars.every((name) => model.fields.find((item) => item.name === name)?.isRequired);
    found.push({ scalars, target: field.type, required });
  }
  return found;
}

function textOf(value: unknown) {
  if (typeof value === "string") return value;
  if (value instanceof Uint8Array) return Buffer.from(value).toString("utf8");
  return null;
}

function convertValue(field: Field, value: unknown) {
  if (field.type === "DateTime") return sqliteInstantToUtc(value);
  if (field.type === "Boolean") return sqliteBoolean(value, field.isRequired);
  if (field.type === "Int") return sqliteInt(value, field.isRequired);
  if (field.type === "Float") return sqliteFloat(value, field.isRequired);
  if (field.type === "String" && field.name.endsWith("Json")) return sqliteJsonText(value);
  if (field.type === "String" || field.kind === "enum") {
    if (value == null) {
      if (field.isRequired) throw new Error(`${field.name} bắt buộc bị null`);
      return null;
    }
    const text = textOf(value);
    if (text == null) throw new Error(`${field.name} không phải chuỗi`);
    return text;
  }
  throw new Error(`Chưa hỗ trợ kiểu ${field.type}`);
}

export function convertRow(model: Model, row: Record<string, unknown>, columns: Set<string>) {
  const data: Record<string, unknown> = {};
  for (const field of scalarFields(model)) {
    if (!columns.has(field.name)) {
      if (field.isRequired && !field.hasDefaultValue) throw new Error(`${model.name}.${field.name} thiếu trong SQLite`);
      continue;
    }
    const value = row[field.name];
    if (value == null && field.isRequired && !field.hasDefaultValue) throw new Error(`${model.name}.${field.name} bị null`);
    if (value == null && !field.isRequired) {
      data[field.name] = null;
      continue;
    }
    if (value == null && field.hasDefaultValue) continue;
    data[field.name] = convertValue(field, value);
  }
  return data;
}

function quoteIdent(name: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error("Tên bảng không an toàn");
  return `"${name}"`;
}

function tableColumns(db: SqliteHandle, table: string) {
  const rows = db.prepare(`PRAGMA table_info(${quoteIdent(table)})`).all() as { name: string }[];
  return new Set(rows.map((row) => row.name));
}

function readRows(db: SqliteHandle, table: string) {
  return db.prepare(`SELECT * FROM ${quoteIdent(table)}`).all() as Record<string, unknown>[];
}

function tableNames(db: SqliteHandle) {
  const rows = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
  return rows.map((row) => row.name).filter((name) => name !== "_prisma_migrations");
}

function loadExclude(file: string | undefined) {
  const excluded = new Map<string, Set<string>>();
  if (!file?.trim()) return excluded;
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    throw new Error("EXCLUDE_LIST không tồn tại");
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const splitAt = line.includes(",") ? line.indexOf(",") : line.indexOf(":");
    if (splitAt <= 0) throw new Error("Dòng EXCLUDE_LIST không hợp lệ");
    const table = line.slice(0, splitAt).trim();
    const id = line.slice(splitAt + 1).trim();
    if (!table || !id) throw new Error("Dòng EXCLUDE_LIST không hợp lệ");
    const set = excluded.get(table) ?? new Set<string>();
    set.add(id);
    excluded.set(table, set);
  }
  return excluded;
}

function delegate(prisma: PrismaClient, model: string) {
  const name = model.charAt(0).toLowerCase() + model.slice(1);
  const value = (prisma as unknown as Record<string, { upsert: (args: unknown) => Promise<unknown>; update: (args: unknown) => Promise<unknown>; findMany: (args?: unknown) => Promise<Record<string, unknown>[]> }>)[name];
  if (!value) throw new Error(`Không có model ${model}`);
  return value;
}

function postgresUrl() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
    throw new Error("DATABASE_URL phải là PostgreSQL");
  }
  return url;
}

function remember(inserted: Set<string>, model: Model, data: Record<string, unknown>) {
  inserted.add(`${model.name}\0${idKey(model, data)}`);
}

function present(inserted: Set<string>, model: string, id: unknown) {
  return inserted.has(`${model}\0${String(id)}`);
}

export async function resetSequences(prisma: PrismaClient) {
  const before = await prisma.$queryRaw<{ sequencename: string }[]>`SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'`;
  if (before.length === 0) {
    console.log("Không có sequence");
    return;
  }
  await prisma.$executeRawUnsafe(`
    DO $$
    DECLARE
      r record;
      seq text;
      max_id bigint;
    BEGIN
      FOR r IN
        SELECT n.nspname AS schema_name, c.relname AS table_name, a.attname AS column_name
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
        WHERE c.relkind = 'r' AND n.nspname = 'public'
      LOOP
        seq := pg_get_serial_sequence(format('%I.%I', r.schema_name, r.table_name), r.column_name);
        IF seq IS NOT NULL THEN
          EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I.%I', r.column_name, r.schema_name, r.table_name) INTO max_id;
          PERFORM setval(seq, GREATEST(max_id, 1), max_id > 0);
        END IF;
      END LOOP;
    END $$;
  `);
  console.log(`Đặt lại ${before.length} sequence`);
}

export async function runImport() {
  const source = process.env.SQLITE_SOURCE;
  if (!source) throw new Error("Thiếu SQLITE_SOURCE");
  const sqlitePath = assertSqliteSource(source);
  postgresUrl();
  const excluded = loadExclude(process.env.EXCLUDE_LIST);
  const db = openSqlite(sqlitePath, true);
  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  try {
    const presentTables = new Set(tableNames(db));
    const pending: { model: Model; data: Record<string, unknown> }[] = [];
    for (const model of models()) {
      if (!presentTables.has(model.name)) {
        console.log(`${model.name}: 0`);
        continue;
      }
      const columns = tableColumns(db, model.name);
      const skip = excluded.get(model.name) ?? new Set<string>();
      let count = 0;
      for (const row of readRows(db, model.name)) {
        const data = convertRow(model, row, columns);
        if (skip.has(idKey(model, data))) continue;
        pending.push({ model, data });
        count += 1;
      }
      console.log(`${model.name}: ${count}`);
    }
    const inserted = new Set<string>();
    let guard = pending.length + 1;
    let rest = pending;
    while (rest.length && guard--) {
      const next: typeof rest = [];
      let moved = false;
      for (const item of rest) {
        const keys = foreignKeys(item.model);
        const blocked = keys.some((fk) => fk.required && fk.scalars.some((name) => item.data[name] == null || !present(inserted, fk.target, item.data[name])));
        if (blocked) {
          next.push(item);
          continue;
        }
        const create = { ...item.data };
        for (const fk of keys) {
          if (fk.required) continue;
          for (const name of fk.scalars) {
            const value = create[name];
            if (value != null && !present(inserted, fk.target, value)) create[name] = null;
          }
        }
        const update = { ...create };
        for (const field of primaryFields(item.model)) delete update[field];
        await delegate(prisma, item.model.name).upsert({ where: whereUnique(item.model, create), create, update });
        remember(inserted, item.model, item.data);
        moved = true;
      }
      if (!moved) break;
      rest = next;
    }
    if (rest.length) {
      const names = [...new Set(rest.map((item) => item.model.name))].join(", ");
      throw new Error(`Không nhập được ${rest.length} dòng vì khoá ngoại: ${names}`);
    }
    for (const item of pending) {
      const data: Record<string, unknown> = {};
      for (const fk of foreignKeys(item.model)) {
        if (fk.required) continue;
        for (const name of fk.scalars) {
          const value = item.data[name];
          if (value != null && present(inserted, fk.target, value)) data[name] = value;
        }
      }
      if (Object.keys(data).length) {
        if ("updatedAt" in item.data) data.updatedAt = item.data.updatedAt;
        await delegate(prisma, item.model.name).update({ where: whereUnique(item.model, item.data), data });
      }
    }
    await resetSequences(prisma);
    console.log("Nhập xong");
    return 0;
  } finally {
    db.close();
    await prisma.$disconnect();
  }
}

type Compared = { ok: boolean; lines: string[] };

function pushCheck(report: Compared, ok: boolean, line: string) {
  report.lines.push(line);
  if (!ok) report.ok = false;
}

export async function runVerify(): Promise<Compared> {
  const source = process.env.SQLITE_SOURCE;
  if (!source) throw new Error("Thiếu SQLITE_SOURCE");
  const sqlitePath = assertSqliteSource(source);
  postgresUrl();
  const db = openSqlite(sqlitePath, true);
  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  const report: Compared = { ok: true, lines: [] };
  try {
    const presentTables = new Set(tableNames(db));
    const known = new Set(models().map((model) => model.name));
    for (const name of presentTables) {
      if (!known.has(name)) pushCheck(report, false, `Bảng SQLite không có trong schema: ${name}`);
    }
    const samples: string[] = [];
    let sampleSeen = 0;
    for (const model of models()) {
      const columns = presentTables.has(model.name) ? tableColumns(db, model.name) : new Set<string>();
      const sqliteRows = presentTables.has(model.name) ? readRows(db, model.name).map((row) => convertRow(model, row, columns)) : [];
      const postgresRows = await delegate(prisma, model.name).findMany();
      pushCheck(report, sqliteRows.length === postgresRows.length, `Số dòng ${model.name} sqlite=${sqliteRows.length} postgres=${postgresRows.length}`);
      const postgresById = new Map(postgresRows.map((row) => [idKey(model, row), row]));
      for (const field of scalarFields(model)) {
        if (!columns.has(field.name)) continue;
        if (field.type === "DateTime") {
          for (const row of sqliteRows) {
            const other = postgresById.get(idKey(model, row));
            const left = row[field.name] instanceof Date ? (row[field.name] as Date).getTime() : null;
            const rightValue = other?.[field.name];
            const right = rightValue instanceof Date ? rightValue.getTime() : null;
            const same = left === right;
            if ((field.name === "createdAt" || field.name === "updatedAt") && sampleSeen < 20) {
              sampleSeen += 1;
              const shown = left == null ? "null" : new Date(left).toISOString();
              samples.push(`Mẫu thời gian ${sampleSeen}/20 ${model.name} ${idKey(model, row)} ${field.name}=${shown}`);
            }
            if (!same) pushCheck(report, false, `Lệch DateTime ${model.name}.${field.name} id=${idKey(model, row)}`);
          }
        }
        if (field.type === "Boolean") {
          const sqliteTrue = sqliteRows.filter((row) => row[field.name] === true).length;
          const postgresTrue = postgresRows.filter((row) => row[field.name] === true).length;
          const sqliteFalse = sqliteRows.filter((row) => row[field.name] === false).length;
          const postgresFalse = postgresRows.filter((row) => row[field.name] === false).length;
          pushCheck(report, sqliteTrue === postgresTrue && sqliteFalse === postgresFalse, `Boolean ${model.name}.${field.name} true sqlite=${sqliteTrue} postgres=${postgresTrue}`);
        }
        if (field.type === "String" && field.name.endsWith("Json")) {
          const sqliteHash = columnHash(sqliteRows.map((row) => ({ id: idKey(model, row), value: (row[field.name] as string | null) ?? null })));
          const postgresHash = columnHash(postgresRows.map((row) => ({ id: idKey(model, row), value: typeof row[field.name] === "string" || row[field.name] == null ? (row[field.name] as string | null) : null })));
          pushCheck(report, sqliteHash === postgresHash, `Hash ${model.name}.${field.name} ${sqliteHash === postgresHash ? "khớp" : "lệch"}`);
        }
      }
    }
    for (const line of samples) report.lines.push(line);
    const orders = await compareSum(db, prisma, "Order", "total");
    pushCheck(report, orders.same, `Tổng tiền đơn sqlite=${orders.sqlite} postgres=${orders.postgres}`);
    const stock = await compareSum(db, prisma, "ProductVariant", "stock");
    pushCheck(report, stock.same, `Tổng tồn sqlite=${stock.sqlite} postgres=${stock.postgres}`);
    for (const sku of ["DEMO-AT-TRANG-M", "DEMO-SN-NAM-DEN-41"]) {
      const pair = await compareSku(db, prisma, sku);
      pushCheck(report, pair.same, `Tồn kho ${sku} sqlite=${pair.sqlite} postgres=${pair.postgres}`);
    }
    const rating = await compareAverage(db, prisma);
    pushCheck(report, rating.same, `Trung bình rating sqlite=${rating.sqlite} postgres=${rating.postgres}`);
    report.lines.push(report.ok ? "Đối chiếu khớp" : "Đối chiếu lệch");
    return report;
  } finally {
    db.close();
    await prisma.$disconnect();
  }
}

async function compareSum(db: SqliteHandle, prisma: PrismaClient, modelName: string, field: string) {
  const sqlite = sumColumn(db, modelName, field);
  const rows = await delegate(prisma, modelName).findMany();
  let postgres = BigInt(0);
  for (const row of rows) {
    const value = row[field];
    if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new Error(`${modelName}.${field} không phải số nguyên`);
    postgres += BigInt(value);
  }
  return { sqlite: sqlite.toString(), postgres: postgres.toString(), same: sqlite === postgres };
}

function sumColumn(db: SqliteHandle, table: string, field: string) {
  if (!tableNames(db).includes(table) || !tableColumns(db, table).has(field)) return BigInt(0);
  const rows = readRows(db, table);
  let total = BigInt(0);
  for (const row of rows) {
    const value = sqliteInt(row[field], true);
    total += BigInt(value ?? 0);
  }
  return total;
}

async function compareSku(db: SqliteHandle, prisma: PrismaClient, sku: string) {
  const sqlite = skuStock(db, sku);
  const rows = await delegate(prisma, "ProductVariant").findMany();
  const match = rows.find((row) => row.sku === sku);
  const postgres = match ? String(match.stock) : "không có";
  return { sqlite, postgres, same: sqlite === postgres };
}

function skuStock(db: SqliteHandle, sku: string) {
  if (!tableNames(db).includes("ProductVariant")) return "không có";
  const rows = readRows(db, "ProductVariant");
  const match = rows.find((row) => row.sku === sku);
  return match ? String(sqliteInt(match.stock, true)) : "không có";
}

async function compareAverage(db: SqliteHandle, prisma: PrismaClient) {
  const sqliteValues = ratings(db);
  const rows = await delegate(prisma, "Product").findMany();
  const postgresValues = rows.map((row) => Number(row.rating));
  const sqlite = average(sqliteValues);
  const postgres = average(postgresValues);
  const same = sqlite == null && postgres == null ? true : sqlite != null && postgres != null && Math.abs(sqlite - postgres) <= 1e-6;
  return { sqlite: sqlite == null ? "không có" : String(sqlite), postgres: postgres == null ? "không có" : String(postgres), same };
}

function ratings(db: SqliteHandle) {
  if (!tableNames(db).includes("Product") || !tableColumns(db, "Product").has("rating")) return [];
  return readRows(db, "Product").map((row) => sqliteFloat(row.rating, true) ?? 0);
}

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function runVerifyCli() {
  const report = await runVerify();
  for (const line of report.lines) console.log(line);
  return report.ok ? 0 : 1;
}
