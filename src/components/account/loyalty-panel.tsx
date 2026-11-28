import { loyaltyView } from "@/lib/loyalty-sync";

const REASON: Record<string, string> = {
  EARN: "Cộng từ đơn",
  REVERSE: "Trừ khi hủy hoặc hoàn",
  REDEEM: "Đổi điểm",
  REFERRAL: "Giới thiệu",
  EXPIRE: "Hết hạn",
};

export async function LoyaltyPanel({ userId }: { userId: string }) {
  const view = await loyaltyView(userId);
  if (!view) return null;
  return (
    <section className="mt-10 border border-neutral-100 bg-white p-5" data-testid="loyalty-panel">
      <h2 className="text-lg font-semibold">Điểm</h2>
      {view.hasRule ? (
        <p className="mt-2 text-2xl font-bold">{view.balance}</p>
      ) : (
        <p className="mt-2 text-sm text-neutral-600">Chưa có quy tắc điểm.</p>
      )}
      <p className="mt-2 text-sm text-neutral-600">
        {view.tier ? `${view.tier.name}${view.tier.benefit ? ` · ${view.tier.benefit}` : ""}` : "Chưa có hạng."}
      </p>
      <p className="mt-2 text-sm">Mã giới thiệu: {view.referralCode}</p>
      <ul className="mt-4 space-y-1 text-sm">
        {view.entries.length === 0 ? <li>Chưa có phát sinh.</li> : view.entries.map((entry) => (
          <li key={entry.id}>{REASON[entry.reason] || entry.reason}: {entry.delta > 0 ? "+" : ""}{entry.delta}</li>
        ))}
      </ul>
    </section>
  );
}
