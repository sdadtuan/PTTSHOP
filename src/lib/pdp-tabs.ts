import { sanitizePlainText } from "@/lib/cms/validate";

/** Built-in PDP tab copy. Null DB fields render these strings exactly. */

export const DEFAULT_ORIGIN = "Việt Nam";
export const DEFAULT_THICKNESS = "Trung bình";

export const DEFAULT_SHIPPING_BULLETS = [
  "Giao hàng toàn quốc 2–5 ngày làm việc",
  "Hoàn tiền theo chính sách cửa hàng khi lỗi sản xuất",
];

export const DEFAULT_SIZE_NOTE = "Form oversize — nếu thích mặc vừa, chọn nhỏ hơn 1 size.";

export type SizeChart = {
  columns: string[];
  rows: string[][];
  note: string;
};

export const DEFAULT_SIZE_CHART: SizeChart = {
  columns: ["Size", "Ngực (cm)", "Dài áo", "Vai"],
  rows: [
    ["S", "98–102", "68", "44"],
    ["M", "102–106", "70", "46"],
    ["L", "106–110", "72", "48"],
    ["XL", "110–114", "74", "50"],
    ["XXL", "114–118", "76", "52"],
  ],
  note: DEFAULT_SIZE_NOTE,
};

const MAX_BULLETS = 30;
const MAX_BULLET = 400;
const MAX_COLS = 8;
const MAX_ROWS = 40;
const MAX_HEADER = 40;
const MAX_CELL = 60;
const MAX_NOTE = 300;
const MAX_ORIGIN = 80;

export function defaultDetailBullets(fit: string | null | undefined): string[] {
  return [
    `Form ${fit || "rộng"}, thoải mái vận động`,
    "Chất nỉ mềm, dày dặn, giữ form tốt",
    "Phong cách unisex, dễ phối mỗi ngày",
  ];
}

export function defaultMaterialBullets(material: string | null | undefined): string[] {
  return [
    `Chất liệu: ${material || "Cotton / nỉ cao cấp"}`,
    "Mềm, dày vừa, ít xù sau giặt",
    "Thấm hút tốt, mặc cả ngày vẫn thoải mái",
    "Bo tay và gấu áo co giãn nhẹ",
  ];
}

export function cloneSizeChart(chart: SizeChart = DEFAULT_SIZE_CHART): SizeChart {
  return {
    columns: [...chart.columns],
    rows: chart.rows.map((row) => [...row]),
    note: chart.note,
  };
}

export function moveListItem<T>(list: T[], index: number, delta: number): T[] {
  const j = index + delta;
  if (index < 0 || j < 0 || j >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(index, 1);
  next.splice(j, 0, item as T);
  return next;
}

export function sanitizeBullet(input: string): string {
  return sanitizePlainText(input, MAX_BULLET).trim();
}

export function normalizeBulletsForSave(list: string[]): string[] {
  return list.map(sanitizeBullet).filter(Boolean).slice(0, MAX_BULLETS);
}

export function normalizeSizeChartForSave(chart: SizeChart): SizeChart {
  const columns = chart.columns.slice(0, MAX_COLS).map((col, i) => {
    const name = sanitizePlainText(col, MAX_HEADER).trim();
    return name || `Cột ${i + 1}`;
  });
  const safeCols = columns.length ? columns : ["Size"];
  const source = chart.rows.slice(0, MAX_ROWS);
  const rows = (source.length ? source : [safeCols.map(() => "")]).map((row) =>
    safeCols.map((_, i) => sanitizePlainText(row?.[i] ?? "", MAX_CELL).trim()),
  );
  return {
    columns: safeCols,
    rows,
    note: sanitizePlainText(chart.note ?? "", MAX_NOTE).trim(),
  };
}

/** Parsed custom bullets, or null when the field is empty/invalid (use generated copy). */
export function parseBulletList(raw: string | null | undefined): string[] | null {
  if (raw == null || !String(raw).trim()) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    const strings = data.filter((item): item is string => typeof item === "string");
    if (data.length > 0 && strings.length === 0) return null;
    return strings.map(sanitizeBullet).filter(Boolean).slice(0, MAX_BULLETS);
  } catch {
    return null;
  }
}

export function parseSizeChart(raw: string | null | undefined): SizeChart | null {
  if (raw == null || !String(raw).trim()) return null;
  try {
    const data = JSON.parse(raw) as { columns?: unknown; rows?: unknown; note?: unknown } | null;
    if (!data || typeof data !== "object" || !Array.isArray(data.columns) || !Array.isArray(data.rows)) {
      return null;
    }
    const columns = data.columns.filter((col): col is string => typeof col === "string");
    const rows = data.rows
      .filter((row): row is unknown[] => Array.isArray(row))
      .map((row) => row.map((cell) => (typeof cell === "string" ? cell : "")));
    const chart = normalizeSizeChartForSave({
      columns,
      rows,
      note: typeof data.note === "string" ? data.note : "",
    });
    if (!chart.columns.length || !chart.rows.length) return null;
    return chart;
  } catch {
    return null;
  }
}

export function addSizeColumn(chart: SizeChart): SizeChart {
  if (chart.columns.length >= MAX_COLS) return chart;
  return {
    ...chart,
    columns: [...chart.columns, "Cột mới"],
    rows: chart.rows.map((row) => [...row, ""]),
  };
}

export function removeSizeColumn(chart: SizeChart, index: number): SizeChart {
  if (chart.columns.length <= 1 || index < 0 || index >= chart.columns.length) return chart;
  return {
    ...chart,
    columns: chart.columns.filter((_, i) => i !== index),
    rows: chart.rows.map((row) => row.filter((_, i) => i !== index)),
  };
}

export function moveSizeColumn(chart: SizeChart, index: number, delta: number): SizeChart {
  const columns = moveListItem(chart.columns, index, delta);
  if (columns === chart.columns) return chart;
  return {
    ...chart,
    columns,
    rows: chart.rows.map((row) => moveListItem(row, index, delta)),
  };
}

export function addSizeRow(chart: SizeChart): SizeChart {
  if (chart.rows.length >= MAX_ROWS) return chart;
  return { ...chart, rows: [...chart.rows, chart.columns.map(() => "")] };
}

export function removeSizeRow(chart: SizeChart, index: number): SizeChart {
  if (chart.rows.length <= 1 || index < 0 || index >= chart.rows.length) return chart;
  return { ...chart, rows: chart.rows.filter((_, i) => i !== index) };
}

export type PdpTabSource = {
  fit?: string | null;
  material?: string | null;
  origin?: string | null;
  thickness?: string | null;
  detailBulletsJson?: string | null;
  materialBulletsJson?: string | null;
  sizeChartJson?: string | null;
  shippingOverrideJson?: string | null;
};

export type PdpTabDraft = {
  origin: string;
  thickness: string;
  detailBullets: string[];
  detailTouched: boolean;
  materialBullets: string[];
  materialTouched: boolean;
  sizeChart: SizeChart;
  sizeTouched: boolean;
  shippingBullets: string[];
  shippingTouched: boolean;
};

export function draftFromProduct(product: PdpTabSource, siteShipping: string[]): PdpTabDraft {
  const detail = parseBulletList(product.detailBulletsJson);
  const material = parseBulletList(product.materialBulletsJson);
  const size = parseSizeChart(product.sizeChartJson);
  const ship = parseBulletList(product.shippingOverrideJson);
  const site = siteShipping.length ? siteShipping : [...DEFAULT_SHIPPING_BULLETS];
  return {
    origin: product.origin || DEFAULT_ORIGIN,
    thickness: product.thickness || DEFAULT_THICKNESS,
    detailBullets: detail ?? defaultDetailBullets(product.fit),
    detailTouched: detail !== null,
    materialBullets: material ?? defaultMaterialBullets(product.material),
    materialTouched: material !== null,
    sizeChart: size ?? cloneSizeChart(),
    sizeTouched: size !== null,
    shippingBullets: ship ?? [...site],
    shippingTouched: ship !== null,
  };
}

export type PdpTabPayload = {
  origin: string | null;
  thickness: string | null;
  detailBullets: string[] | null;
  materialBullets: string[] | null;
  sizeChart: SizeChart | null;
  shippingBullets: string[] | null;
};

/** Null lists mean "keep generating the built-in copy". */
export function tabPayload(draft: PdpTabDraft): PdpTabPayload {
  return {
    origin: sanitizePlainText(draft.origin, MAX_ORIGIN).trim() || null,
    thickness: sanitizePlainText(draft.thickness, MAX_ORIGIN).trim() || null,
    detailBullets: draft.detailTouched ? normalizeBulletsForSave(draft.detailBullets) : null,
    materialBullets: draft.materialTouched ? normalizeBulletsForSave(draft.materialBullets) : null,
    sizeChart: draft.sizeTouched ? normalizeSizeChartForSave(draft.sizeChart) : null,
    shippingBullets: draft.shippingTouched ? normalizeBulletsForSave(draft.shippingBullets) : null,
  };
}

export type ResolvedPdpTabs = {
  detailCustom: boolean;
  detailBullets: string[];
  origin: string;
  thickness: string;
  materialCustom: boolean;
  materialBullets: string[];
  sizeCustom: boolean;
  sizeChart: SizeChart;
  /** True when a product override or a site policy replaces the built-in shipping lines. */
  shippingCustom: boolean;
  shippingBullets: string[];
};

export function resolvePdpTabs(product: PdpTabSource, shippingPolicyJson?: string | null): ResolvedPdpTabs {
  const detail = parseBulletList(product.detailBulletsJson);
  const material = parseBulletList(product.materialBulletsJson);
  const size = parseSizeChart(product.sizeChartJson);
  const override = parseBulletList(product.shippingOverrideJson);
  const site = parseBulletList(shippingPolicyJson);
  const shipping = override ?? site;
  return {
    detailCustom: detail !== null,
    detailBullets: detail ?? defaultDetailBullets(product.fit),
    origin: product.origin || DEFAULT_ORIGIN,
    thickness: product.thickness || DEFAULT_THICKNESS,
    materialCustom: material !== null,
    materialBullets: material ?? defaultMaterialBullets(product.material),
    sizeCustom: size !== null,
    sizeChart: size ?? cloneSizeChart(),
    shippingCustom: shipping !== null,
    shippingBullets: shipping ?? [...DEFAULT_SHIPPING_BULLETS],
  };
}

export function bulletsToJson(list: string[] | null | undefined): string | null {
  if (!list) return null;
  const clean = normalizeBulletsForSave(list);
  return JSON.stringify(clean);
}

export function sizeChartToJson(chart: SizeChart | null | undefined): string | null {
  if (!chart) return null;
  return JSON.stringify(normalizeSizeChartForSave(chart));
}
