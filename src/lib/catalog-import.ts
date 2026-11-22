import * as XLSX from "xlsx";
import { colorNameToHex } from "@/lib/color-names";
import { slugify } from "@/lib/slug";

export const IMPORT_COLUMNS = [
  "sku",
  "product_slug",
  "product_name",
  "category",
  "description",
  "size",
  "color",
  "price_vnd",
  "compare_at_price_vnd",
  "cost_vnd",
  "stock",
  "image_file",
  "status",
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number];

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

export type SaleStatus = "DRAFT" | "SELLING" | "HIDDEN" | "DISCONTINUED";

export type ImportProduct = {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  gender: "MALE" | "FEMALE" | "UNISEX";
  description: string | null;
  saleStatus: SaleStatus;
  variants: ImportVariant[];
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU_RE = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

export function templateCsv(): string {
  const header = IMPORT_COLUMNS.join(",");
  const note =
    "# Dòng bắt đầu bằng # bị bỏ qua. Mỗi dòng là một biến thể. Cùng product_slug = cùng sản phẩm. image_file là tên file trong zip hoặc thư mục ảnh, không phải link.";
  return `\uFEFF${header}\n${note}\n`;
}

export function parseSpreadsheet(input: { name: string; bytes: Uint8Array }): string[][] {
  const lower = input.name.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    return parseCsv(new TextDecoder("utf-8").decode(input.bytes));
  }
  if (lower.endsWith(".xlsx")) {
    const book = XLSX.read(input.bytes, { type: "array" });
    const sheetName =
      book.SheetNames.find((name) => name.trim().toLowerCase() === "bien the") || book.SheetNames[0];
    const sheet = sheetName ? book.Sheets[sheetName] : undefined;
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

function genderOf(category: string, name: string): "MALE" | "FEMALE" | "UNISEX" {
  const text = `${category} ${name}`;
  if (/(^|[^\p{L}])nữ([^\p{L}]|$)/iu.test(text)) return "FEMALE";
  if (/(^|[^\p{L}])nam([^\p{L}]|$)/iu.test(text)) return "MALE";
  return "UNISEX";
}

function statusOf(raw: string): SaleStatus | null {
  const v = raw.trim().toLowerCase();
  if (!v || v === "active" || v === "selling" || v === "dang ban" || v === "đang bán") return "SELLING";
  if (v === "draft" || v === "nhap" || v === "nháp") return "DRAFT";
  if (v === "hidden" || v === "an" || v === "ẩn" || v === "tam an" || v === "tạm ẩn") return "HIDDEN";
  if (v === "discontinued" || v === "ngung" || v === "ngừng bán") return "DISCONTINUED";
  return null;
}

function money(raw: string, allowEmpty: boolean): { ok: true; value: number | null } | { ok: false; message: string } {
  const v = raw.trim().replace(/\s/g, "").replace(/[.,](?=\d{3}(\D|$))/g, "");
  if (!v) {
    if (allowEmpty) return { ok: true, value: null };
    return { ok: false, message: "Thiếu số tiền" };
  }
  if (v.startsWith("-")) return { ok: false, message: "Không nhận giá âm" };
  if (!/^\d+$/.test(v)) return { ok: false, message: "Phải là số nguyên, đơn vị đồng" };
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n <= 0) return { ok: false, message: "Phải là số nguyên dương" };
  return { ok: true, value: n };
}

function stockOf(raw: string): { ok: true; value: number } | { ok: false; message: string } {
  const v = raw.trim();
  if (v.startsWith("-")) return { ok: false, message: "Không nhận tồn âm" };
  if (!/^\d+$/.test(v)) return { ok: false, message: "Tồn kho phải là số nguyên từ 0 trở lên" };
  const n = Number(v);
  if (!Number.isSafeInteger(n)) return { ok: false, message: "Tồn kho không hợp lệ" };
  return { ok: true, value: n };
}

function sizeOf(raw: string): string {
  const v = raw.trim();
  if (/^free\s*size$/i.test(v) || v.toUpperCase() === "FS") return "Free size";
  return v.toUpperCase();
}

export function validateCatalogSheet(
  grid: string[][],
  opts: { fileNames: Set<string> },
): { issues: ImportIssue[]; products: ImportProduct[] } {
  const issues: ImportIssue[] = [];
  if (grid.length === 0) {
    return { issues: [{ row: 1, field: "file", message: "File trống" }], products: [] };
  }
  const header = grid[0].map((cell) => cell.trim().toLowerCase());
  const index = new Map<string, number>();
  header.forEach((name, i) => {
    if (name) index.set(name, i);
  });
  for (const col of IMPORT_COLUMNS) {
    if (!index.has(col)) issues.push({ row: 1, field: col, message: `Thiếu cột ${col}` });
  }
  if (issues.length) return { issues, products: [] };

  const products = new Map<string, ImportProduct>();
  const skus = new Map<string, number>();
  const get = (cells: string[], col: ImportColumn) => {
    const at = index.get(col);
    return at === undefined ? "" : (cells[at] || "").trim();
  };

  grid.forEach((cells, idx) => {
    const row = idx + 1;
    if (row === 1) return;
    if (cells.every((cell) => !cell.trim()) || (cells[0] || "").trim().startsWith("#")) return;
    if (!get(cells, "product_slug") && !get(cells, "product_name") && !get(cells, "price_vnd")) return;

    const sku = get(cells, "sku").toUpperCase();
    const slug = get(cells, "product_slug").toLowerCase();
    const name = get(cells, "product_name");
    const categoryName = get(cells, "category");
    const description = get(cells, "description");
    const size = sizeOf(get(cells, "size"));
    const color = get(cells, "color");
    const imageFile = get(cells, "image_file").split(/[/\\]/).pop() || "";
    const saleStatus = statusOf(get(cells, "status"));
    const price = money(get(cells, "price_vnd"), false);
    const compareAt = money(get(cells, "compare_at_price_vnd"), true);
    const cost = money(get(cells, "cost_vnd"), true);
    const stock = stockOf(get(cells, "stock"));
    const colorHex = colorNameToHex(color);

    if (!SKU_RE.test(sku)) issues.push({ row, field: "sku", message: "Thiếu SKU hoặc SKU có ký tự không hợp lệ" });
    if (!SLUG_RE.test(slug)) issues.push({ row, field: "product_slug", message: "Slug chỉ gồm chữ thường, số và dấu -" });
    if (name.length < 2) issues.push({ row, field: "product_name", message: "Thiếu tên sản phẩm" });
    if (categoryName.length < 2) issues.push({ row, field: "category", message: "Thiếu danh mục" });
    if (!size || size.length > 12 || /[/,;]/.test(size)) {
      issues.push({ row, field: "size", message: "Mỗi size một dòng, tối đa 12 ký tự, không dùng / hoặc ," });
    }
    if (!color) issues.push({ row, field: "color", message: "Thiếu tên màu" });
    else if (!colorHex) issues.push({ row, field: "color", message: `Không nhận ra màu "${color}"` });
    if (!price.ok) issues.push({ row, field: "price_vnd", message: price.message });
    if (!compareAt.ok) issues.push({ row, field: "compare_at_price_vnd", message: compareAt.message });
    if (!cost.ok) issues.push({ row, field: "cost_vnd", message: cost.message });
    if (!stock.ok) issues.push({ row, field: "stock", message: stock.message });
    if (!saleStatus) issues.push({ row, field: "status", message: "Trạng thái: active, draft, hidden hoặc discontinued" });
    if (!imageFile || imageFile.includes("..")) {
      issues.push({ row, field: "image_file", message: "Thiếu tên file ảnh" });
    } else if (/^https?:/i.test(imageFile)) {
      issues.push({ row, field: "image_file", message: "Không nhận link ảnh. Hãy tải zip hoặc thư mục ảnh." });
    } else if (!opts.fileNames.has(imageFile)) {
      issues.push({ row, field: "image_file", message: `Thiếu file ảnh ${imageFile}` });
    }
    if (skus.has(sku)) issues.push({ row, field: "sku", message: `SKU trùng dòng ${skus.get(sku)}` });
    else if (sku) skus.set(sku, row);

    if (!slug || !price.ok || !stock.ok || !saleStatus || !colorHex || !size) return;

    const variant: ImportVariant = {
      row,
      color,
      colorHex,
      size,
      sku,
      price: price.value!,
      compareAt: compareAt.ok ? compareAt.value : null,
      costPrice: cost.ok ? cost.value : null,
      stock: stock.value,
      imageFile,
    };
    const prev = products.get(slug);
    if (!prev) {
      products.set(slug, {
        slug,
        name,
        categorySlug: slugify(categoryName),
        categoryName,
        gender: genderOf(categoryName, name),
        description: description || null,
        saleStatus,
        variants: [variant],
      });
      return;
    }
    if (prev.name !== name) issues.push({ row, field: "product_name", message: "Cùng slug nhưng tên khác nhau" });
    if (prev.categoryName !== categoryName) issues.push({ row, field: "category", message: "Cùng slug nhưng danh mục khác nhau" });
    if (prev.saleStatus !== saleStatus) issues.push({ row, field: "status", message: "Cùng slug nhưng trạng thái khác nhau" });
    const dup = prev.variants.some((item) => item.color.toLowerCase() === color.toLowerCase() && item.size === size);
    if (dup) issues.push({ row, field: "size", message: `Trùng màu + size: ${color} / ${size}` });
    prev.variants.push(variant);
  });

  return { issues, products: [...products.values()] };
}
