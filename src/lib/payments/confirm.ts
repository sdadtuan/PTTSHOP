export function reviewPaymentConfirm(input: {
  role: string | null;
  paymentStatus: string;
  orderTotal: number;
  requestedAmount?: number | null;
}) {
  if (!input.role) return { ok: false as const, status: 401, error: "Bạn cần đăng nhập" };
  if (input.role !== "ADMIN") return { ok: false as const, status: 403, error: "Chỉ admin xác nhận thanh toán." };
  if (input.paymentStatus === "PAID") {
    return { ok: false as const, status: 409, error: "Đơn đã được xác nhận thanh toán." };
  }
  if (input.requestedAmount != null && input.requestedAmount !== input.orderTotal) {
    return { ok: false as const, status: 400, error: "Không được sửa số tiền khi xác nhận." };
  }
  return { ok: true as const, amount: input.orderTotal };
}
