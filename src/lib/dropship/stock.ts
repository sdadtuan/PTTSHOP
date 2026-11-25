const FRESH_MS = 24 * 60 * 60 * 1000;

export function ownAvailable(stock: number, safetyStock: number) {
  return Math.max(0, stock - safetyStock);
}

export function supplierAvailable(input: {
  supplierStock: number;
  safetyStock: number;
  stockUpdatedAt: Date | null;
  now: Date;
  hasFloor: boolean;
}) {
  if (!input.hasFloor || !input.stockUpdatedAt) return 0;
  if (input.now.getTime() - input.stockUpdatedAt.getTime() > FRESH_MS) return 0;
  return Math.max(0, input.supplierStock - input.safetyStock);
}

export type StockSource = {
  supplierId: string;
  priority: number;
  supplierStock: number;
  safetyStock: number;
  stockUpdatedAt: Date | null;
  isActive: boolean;
  costPrice: number;
};

/** NCC active, ưu tiên số nhỏ hơn, còn tồn sau tồn an toàn và cập nhật trong 24 giờ. */
export function pickSupplier(sources: StockSource[], hasFloor: boolean, now: Date) {
  const ranked = sources
    .filter((row) => row.isActive)
    .slice()
    .sort((a, b) => a.priority - b.priority || a.supplierId.localeCompare(b.supplierId));
  for (const row of ranked) {
    const available = supplierAvailable({ ...row, hasFloor, now });
    if (available > 0) return { ...row, available };
  }
  return null;
}

export function sellableQuantity(input: {
  stock: number;
  safetyStock: number;
  isPurchasable: boolean;
  hasFloor: boolean;
  sources: StockSource[];
  now: Date;
}) {
  if (!input.isPurchasable) return { own: 0, supplier: 0, total: 0, supplierId: null as string | null };
  const own = ownAvailable(input.stock, input.safetyStock);
  const chosen = pickSupplier(input.sources, input.hasFloor, input.now);
  const supplier = chosen?.available ?? 0;
  return { own, supplier, total: own + supplier, supplierId: chosen?.supplierId ?? null };
}

export function allocateQuantity(input: {
  quantity: number;
  stock: number;
  safetyStock: number;
  isPurchasable: boolean;
  hasFloor: boolean;
  sources: StockSource[];
  now: Date;
}) {
  const sellable = sellableQuantity(input);
  if (input.quantity > sellable.total) {
    return { ok: false as const, error: "Không đủ tồn khả dụng" };
  }
  const warehouseQty = Math.min(input.quantity, sellable.own);
  const supplierQty = input.quantity - warehouseQty;
  return {
    ok: true as const,
    warehouseQty,
    supplierQty,
    supplierId: supplierQty > 0 ? sellable.supplierId : null,
  };
}
