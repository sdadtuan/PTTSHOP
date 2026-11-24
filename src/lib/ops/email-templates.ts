export const DEFAULT_EMAIL_TEMPLATES = [
  { key: "ORDER_CONFIRMED", audience: "CUSTOMER", subject: "Xác nhận đơn {{orderNumber}}", body: "Xin chào {{name}}, đơn {{orderNumber}} đã được ghi nhận. Tổng {{total}}." },
  { key: "SHIPMENT_UPDATE", audience: "CUSTOMER", subject: "Cập nhật giao hàng {{orderNumber}}", body: "Đơn {{orderNumber}} đang ở trạng thái {{status}}." },
  { key: "REFUND_CONFIRMED", audience: "CUSTOMER", subject: "Xác nhận hoàn tiền {{orderNumber}}", body: "Đơn {{orderNumber}} được hoàn {{amount}}. Mã tham chiếu {{reference}}." },
  { key: "INTERNAL_NEW_ORDER", audience: "INTERNAL", subject: "Đơn mới {{orderNumber}}", body: "Có đơn mới {{orderNumber}} của {{name}}." },
  { key: "INTERNAL_SLA", audience: "INTERNAL", subject: "Đơn quá SLA {{orderNumber}}", body: "Đơn {{orderNumber}} đã quá thời gian xử lý." },
  { key: "INTERNAL_INVOICE_FAILED", audience: "INTERNAL", subject: "Hoá đơn lỗi {{orderNumber}}", body: "Hoá đơn của đơn {{orderNumber}} lỗi: {{error}}." },
  { key: "INTERNAL_BELOW_FLOOR", audience: "INTERNAL", subject: "Biến thể dưới giá sàn", body: "SKU {{sku}} có giá {{price}}, thấp hơn giá sàn {{floorPrice}}." },
] as const;

export function renderTemplate(template: string, vars: Record<string, string | number | null | undefined>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function isBelowFloor(price: number, floorPrice: number | null | undefined) {
  return floorPrice != null && price < floorPrice;
}
