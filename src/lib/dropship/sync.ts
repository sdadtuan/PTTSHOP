import type { FloorParams } from "@/lib/dropship/floor";
import { effectiveFloor, priceBelowFloor } from "@/lib/dropship/floor";

export type SyncRow = {
  line: number;
  supplierSku: string;
  name: string;
  color: string;
  size: string;
  costPrice: number;
  stock: number;
  updatedOn: string;
};

export type SyncIssue = { line: number; code: string; message: string };

export type VariantMatch = {
  id: string;
  sku: string;
  name: string;
  color: string;
  size: string;
  price: number;
  isPurchasable: boolean;
};

const HEADER = ["mã ncc", "tên", "màu", "size", "giá vốn", "tồn", "ngày cập nhật"];

function norm(value: string) {
  return value.normalize("NFC").trim().toLocaleLowerCase("vi");
}

export function parseSupplierCsv(text: string): { rows: SyncRow[]; issues: SyncIssue[] } {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { rows: [], issues: [{ line: 1, code: "EMPTY", message: "File không có dữ liệu" }] };
  const header = lines[0].split(",").map((cell) => norm(cell));
  if (header.join("|") !== HEADER.join("|")) {
    return { rows: [], issues: [{ line: 1, code: "HEADER", message: "Sai dòng tiêu đề" }] };
  }
  const parsed: SyncRow[] = [];
  const issues: SyncIssue[] = [];
  for (let index = 1; index < lines.length; index += 1) {
    const line = index + 1;
    const cells = lines[index].split(",");
    if (cells.length !== 7) {
      issues.push({ line, code: "COLUMNS", message: "Dòng không đủ cột" });
      continue;
    }
    const [supplierSku, name, color, size, costRaw, stockRaw, updatedOn] = cells.map((cell) => cell.trim());
    if (!supplierSku || !name || !color || !size) {
      issues.push({ line, code: "REQUIRED", message: "Thiếu mã, tên, màu hoặc size" });
      continue;
    }
    if (!/^\d+$/.test(costRaw) || !/^\d+$/.test(stockRaw)) {
      issues.push({ line, code: "NUMBER", message: "Giá vốn hoặc tồn không phải số nguyên" });
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(updatedOn) || Number.isNaN(Date.parse(`${updatedOn}T00:00:00Z`))) {
      issues.push({ line, code: "DATE", message: "Ngày cập nhật phải là YYYY-MM-DD" });
      continue;
    }
    parsed.push({
      line,
      supplierSku,
      name,
      color,
      size,
      costPrice: Number(costRaw),
      stock: Number(stockRaw),
      updatedOn,
    });
  }
  const counts = new Map<string, number>();
  for (const row of parsed) counts.set(norm(row.supplierSku), (counts.get(norm(row.supplierSku)) || 0) + 1);
  const rows = parsed.filter((row) => {
    if ((counts.get(norm(row.supplierSku)) || 0) > 1) {
      issues.push({ line: row.line, code: "DUPLICATE", message: "Trùng mã NCC trong file" });
      return false;
    }
    return true;
  });
  return { rows, issues };
}

export function matchVariant(row: Pick<SyncRow, "name" | "color" | "size">, variants: VariantMatch[]) {
  return variants.find((variant) =>
    norm(variant.name) === norm(row.name) &&
    norm(variant.color) === norm(row.color) &&
    norm(variant.size) === norm(row.size),
  ) ?? null;
}

export function decideCostUpdate(input: {
  price: number;
  isPurchasable: boolean;
  nextCost: number;
  params: FloorParams;
}) {
  const floor = effectiveFloor(input.nextCost, input.params);
  const hide = priceBelowFloor(input.price, floor);
  return {
    floor,
    hide,
    isPurchasable: hide ? false : input.isPurchasable,
    price: input.price,
  };
}
