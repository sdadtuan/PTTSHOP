export type DemoRemovalRow = {
  slug: string;
  skus: string[];
  orderNotes: string[];
  orderIds: string[];
  orderHasForeignItem: boolean;
};

export type DemoRemovalPlan = {
  action: "delete" | "blocked" | "skip";
  reason?: string;
};

export function planDemoRemoval(row: DemoRemovalRow): DemoRemovalPlan {
  const slugDemo = row.slug.startsWith("demo-");
  const anyDemoSku = row.skus.some((sku) => sku.startsWith("DEMO-"));
  const allDemoSku = row.skus.length > 0 && row.skus.every((sku) => sku.startsWith("DEMO-"));
  if (!slugDemo && !anyDemoSku) return { action: "skip" };
  if (!slugDemo || !allDemoSku) {
    return {
      action: "blocked",
      reason: "Chỉ gỡ khi slug bắt đầu bằng demo- và mọi SKU bắt đầu bằng DEMO-",
    };
  }
  if (row.orderHasForeignItem) {
    return { action: "blocked", reason: "Có đơn TEST lẫn sản phẩm không thuộc bộ DEMO" };
  }
  const foreign = row.orderNotes.find((note) => !note.startsWith("TEST"));
  if (foreign !== undefined) {
    return { action: "blocked", reason: "Có đơn không ghi chú bắt đầu bằng TEST" };
  }
  return { action: "delete" };
}
