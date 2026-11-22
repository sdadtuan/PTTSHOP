import * as XLSX from "xlsx";

export const IMPORT_COLUMNS = [
  "slug",
  "name",
  "category_slug",
  "category_name",
  "gender",
  "description",
  "material",
  "color",
  "color_hex",
  "size",
  "sku",
  "price",
  "compare_at",
  "cost_price",
  "stock",
  "image_file",
  "sale_status",
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number];
export type ImportMode = "demo" | "catalog";

export type ImportIssue = {
  row: number;
  field: string;
  message: string;
};

export type ImportVariant = {
  row: number;
  color: string;
  colorHex: string;
  size: string;
  sku: string;
  price: number;
  compareAt: number | null;
  costPrice: number | null;
  stock: number;
  imageFile: string;
};

export type ImportProduct = {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  gender: "MALE" | "FEMALE" | "UNISEX";
  description: string | null;
  material: string | null;
  saleStatus: "DRAFT" | "SELLING" | "HIDDEN" | "DISCONTINUED";
  variants: ImportVariant[];
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEMO_SLUG_RE = /^demo-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU_RE = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
const DEMO_SKU_RE = /^DEMO-[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function templateCsv(): string {
  const header = IMPORT_COLUMNS.join(",");
  const note =
    "# Dòng bắt đầu bằng # bị bỏ qua. Mỗi dòng là một biến thể. Cùng slug = cùng sản phẩm. Ảnh là tên file tải kèm, không phải link.";
  return `\uFEFF${header}\n${note}\n`;
}

export function parseSpreadsheet(input: { name: string; bytes: Uint8Array }): string[][] {
  const lower = input.name.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    return parseCsv(new TextDecoder("utf-8").decode(input.bytes));
  }
  if (lower.endsWith(".xlsx")) {
    const book = XLSX.read(input.bytes, { type: "array" });
    const sheet = book.Sheets[book.SheetNames[0]];
    if (!sheet) return [];
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });
    return rows.map((row) => row.map((cell) => String(cell ?? "").trim()));
  }
  throw new Error("Chỉ nhận file .csv hoặc .xlsx");
}

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows;
}

function genderOf(raw: string): "MALE" | "FEMALE" | "UNISEX" | null {
  const v = raw.trim().toLowerCase();
  if (!v || v === "unisex" || v === "chung") return "UNISEX";
  if (v === "male" || v === "nam" || v === "m") return "MALE";
  if (v === "female" || v === "nu" || v === "nữ" || v === "f") return "FEMALE";
  return null;
}

function money(raw: string): number | null {
  const v = raw.trim().replace(/\s/g, "");
  if (!/^\d+$/.test(v)) return null;
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}

function stockOf(raw: string): number | null {
  const v = raw.trim();
  if (!/^\d+$/.test(v)) return null;
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n < 0) return null;
  return n;
}

export function validateCatalogSheet(
  grid: string[][],
  opts: { mode: ImportMode; fileNames: Set<string> },
): { issues: ImportIssue[]; products: ImportProduct[] } {
  const issues: ImportIssue[] = [];
  if (grid.length === 0) {
    return { issues: [{ row: 1, field: "file", message: "File trống" }], products: [] };
  }
  const header = grid[0].map((h) => h.trim().toLowerCase());
  const index = new Map<string, number>();
  header.forEach((name, i) => {
    if (name) index.set(name, i);
  });
  for (const col of ["slug", "name", "category_slug", "color", "color_hex", "size", "sku", "price", "stock", "image_file"]) {
    if (!index.has(col)) {
      issues.push({ row: 1, field: col, message: `Thiếu cột ${col}` });
    }
  }
  if (issues.length) return { issues, products: [] };

  const products = new Map<string, ImportProduct>();
  const skus = new Map<string, number>();

  grid.forEach((cells, idx) => {
    const row = idx + 1;
    if (row === 1) return;
    const first = (cells[0] || "").trim();
    if (cells.every((c) => !c.trim()) || first.startsWith("#")) return;

    const get = (col: ImportColumn) => {
      const at = index.get(col);
      return at === undefined ? "" : (cells[at] || "").trim();
    };

    const slug = get("slug").toLowerCase();
    const name = get("name");
    const categorySlug = get("category_slug").toLowerCase();
    const categoryName = get("category_name");
    const gender = genderOf(get("gender"));
    const color = get("color");
    const colorHex = get("color_hex").toUpperCase();
    const size = get("size").toUpperCase();
    const sku = get("sku").toUpperCase();
    const price = money(get("price"));
    const compareRaw = get("compare_at");
    const costRaw = get("cost_price");
    const stock = stockOf(get("stock"));
    const imageFile = get("image_file");
    const statusRaw = get("sale_status").toUpperCase();
    const saleStatus = (statusRaw || "SELLING") as ImportProduct["saleStatus"];

    if (opts.mode === "demo") {
      if (!DEMO_SLUG_RE.test(slug)) {
        issues.push({ row, field: "slug", message: "Chế độ DEMO chỉ nhận slug bắt đầu bằng demo-" });
      }
      if (!DEMO_SKU_RE.test(sku)) {
        issues.push({ row, field: "sku", message: "Chế độ DEMO chỉ nhận SKU bắt đầu bằng DEMO-" });
      }
    } else {
      if (!SLUG_RE.test(slug)) issues.push({ row, field: "slug", message: "Slug chỉ gồm chữ thường, số và dấu -" });
      if (!SKU_RE.test(sku)) issues.push({ row, field: "sku", message: "SKU chỉ gồm chữ, số và dấu -" });
    }
    if (name.length < 2) issues.push({ row, field: "name", message: "Thiếu tên sản phẩm" });
    if (!SLUG_RE.test(categorySlug)) issues.push({ row, field: "category_slug", message: "Thiếu slug danh mục" });
    if (!gender) issues.push({ row, field: "gender", message: "Giới tính: nam, nữ hoặc unisex" });
    if (!color) issues.push({ row, field: "color", message: "Thiếu tên màu" });
    if (!HEX_RE.test(colorHex)) issues.push({ row, field: "color_hex", message: "Mã màu phải dạng #RRGGBB" });
    if (!size || /[/,;]/.test(size)) issues.push({ row, field: "size", message: "Mỗi size một dòng, không dùng / hoặc ," });
    if (price === null) issues.push({ row, field: "price", message: "Giá bán phải là số nguyên dương, đơn vị đồng" });
    let compareAt: number | null = null;
    if (compareRaw) {
      compareAt = money(compareRaw);
      if (compareAt === null) issues.push({ row, field: "compare_at", message: "Giá gốc phải là số nguyên dương hoặc để trống" });
    }
    let costPrice: number | null = null;
    if (costRaw) {
      costPrice = money(costRaw);
      if (costPrice === null) issues.push({ row, field: "cost_price", message: "Giá vốn phải là số nguyên dương hoặc để trống" });
    }
    if (stock === null) issues.push({ row, field: "stock", message: "Tồn kho phải là số nguyên từ 0 trở lên" });
    if (!["DRAFT", "SELLING", "HIDDEN", "DISCONTINUED"].includes(saleStatus)) {
      issues.push({ row, field: "sale_status", message: "Trạng thái: DRAFT, SELLING, HIDDEN hoặc DISCONTINUED" });
    }
    if (/^https?:/i.test(imageFile)) {
      issues.push({ row, field: "image_file", message: "Không nhận link ảnh. Hãy tải file ảnh kèm theo." });
    } else if (!imageFile || /[/\\]/.test(imageFile) || imageFile.includes("..")) {
      issues.push({ row, field: "image_file", message: "Ảnh phải là tên file tải kèm, không có đường dẫn" });
    } else if (!opts.fileNames.has(imageFile)) {
      issues.push({ row, field: "image_file", message: `Chưa thấy file ảnh ${imageFile}` });
    }

    if (skus.has(sku)) {
      issues.push({ row, field: "sku", message: `SKU trùng dòng ${skus.get(sku)}` });
    } else if (sku) {
      skus.set(sku, row);
    }

    const prev = products.get(slug);
    if (prev) {
      if (prev.name !== name) issues.push({ row, field: "name", message: "Cùng slug nhưng tên khác nhau" });
      if (prev.categorySlug !== categorySlug) issues.push({ row, field: "category_slug", message: "Cùng slug nhưng danh mục khác nhau" });
      if (gender && prev.gender !== gender) issues.push({ row, field: "gender", message: "Cùng slug nhưng giới tính khác nhau" });
      if (prev.saleStatus !== saleStatus) issues.push({ row, field: "sale_status", message: "Cùng slug nhưng trạng thái khác nhau" });
      const dup = prev.variants.some((v) => v.color.toLowerCase() === color.toLowerCase() && v.size === size);
      if (dup) issues.push({ row, field: "size", message: `Trùng màu + size: ${color} / ${size}` });
      const hex = prev.variants.find((v) => v.color.toLowerCase() === color.toLowerCase());
      if (hex && hex.colorHex !== colorHex) issues.push({ row, field: "color_hex", message: `Màu ${color} có hai mã khác nhau` });
    }

    if (
      !slug ||
      price === null ||
      stock === null ||
      !gender ||
      !HEX_RE.test(colorHex) ||
      !color ||
      !size
    ) {
      return;
    }

    const variant: ImportVariant = {
      row,
      color,
      colorHex,
      size,
      sku,
      price,
      compareAt,
      costPrice,
      stock,
      imageFile,
    };
    if (!prev) {
      products.set(slug, {
        slug,
        name,
        categorySlug,
        categoryName,
        gender,
        description: get("description") || null,
        material: get("material") || null,
        saleStatus,
        variants: [variant],
      });
    } else {
      prev.variants.push(variant);
    }
  });

  return { issues, products: [...products.values()] };
}
