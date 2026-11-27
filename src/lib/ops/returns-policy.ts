export const DEFAULT_DUAL_APPROVAL_THRESHOLD = 2_000_000;

export function shippingFeePayer(reason: string) {
  if (reason === "DEFECTIVE" || reason === "WRONG_ITEM") return "SHOP" as const;
  return "CUSTOMER" as const;
}

export function refundMethodForPayment(paymentMethod: string) {
  if (paymentMethod === "PAYOS") return "PAYOS_MANUAL";
  return "BANK_TRANSFER_MANUAL";
}

export function reviewReturnWindow(input: {
  deliveredAt: Date | null;
  now: Date;
  windowDays: number;
  exceptionReason?: string | null;
}) {
  if (!input.deliveredAt) {
    if (input.exceptionReason?.trim()) return { ok: true as const, exception: true };
    return { ok: false as const, error: "Đơn chưa giao. Cần lý do ngoại lệ nếu vẫn muốn mở đổi trả." };
  }
  const deadline = input.deliveredAt.getTime() + input.windowDays * 24 * 60 * 60 * 1000;
  if (input.now.getTime() > deadline) {
    if (input.exceptionReason?.trim()) return { ok: true as const, exception: true };
    return { ok: false as const, error: `Đã quá ${input.windowDays} ngày kể từ khi giao. Cần lý do ngoại lệ.` };
  }
  return { ok: true as const, exception: false };
}

export function excludedCategoryHit(categoryIds: Array<string | null | undefined>, excluded: string[]) {
  const blocked = new Set(excluded);
  return categoryIds.some((id) => id && blocked.has(id));
}

export function reviewRefundApproval(input: {
  amount: number;
  threshold: number;
  status: string;
  firstApproverId: string | null;
  actorId: string;
}) {
  if (input.status === "PENDING") {
    if (input.amount <= input.threshold) {
      return { ok: true as const, status: "APPROVED", firstApproverId: input.actorId, secondApproverId: null };
    }
    return {
      ok: true as const,
      status: "PENDING_SECOND_APPROVAL",
      firstApproverId: input.actorId,
      secondApproverId: null,
    };
  }
  if (input.status === "PENDING_SECOND_APPROVAL") {
    if (!input.firstApproverId || input.actorId === input.firstApproverId) {
      return { ok: false as const, status: 403 as const, error: "Người duyệt cấp 2 phải là tài khoản khác người duyệt cấp 1." };
    }
    return { ok: true as const, status: "APPROVED", firstApproverId: input.firstApproverId, secondApproverId: input.actorId };
  }
  return { ok: false as const, status: 400 as const, error: "Phiếu hoàn tiền không ở trạng thái chờ duyệt." };
}
