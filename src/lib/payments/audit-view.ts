const ACTION_LABELS: Record<string, string> = {
  CONFIRMED_PAID: "Xác nhận đã nhận tiền",
};

export const PAYMENT_AUDIT_EMPTY = "Chưa có lịch sử xác nhận thanh toán.";

export function formatPaymentAuditTime(value: Date | string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function paymentAuditEntries(
  rows: { createdAt: Date | string; action: string | null; actorId: string | null; amount: number | null }[],
  actors: { id: string; name: string | null; email: string }[],
) {
  const byId = new Map(actors.map((actor) => [actor.id, actor]));
  return rows.map((row) => {
    const actor = row.actorId ? byId.get(row.actorId) : undefined;
    const who = [actor?.name, actor?.email].filter(Boolean).join(" · ");
    return {
      at: formatPaymentAuditTime(row.createdAt),
      actor: who || "Không rõ người thực hiện",
      action: ACTION_LABELS[row.action || ""] || row.action || "Cập nhật",
      amount: row.amount,
    };
  });
}
