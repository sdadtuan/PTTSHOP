"use client";

import { useState } from "react";
import { formatVnd } from "@/lib/format";

type Open = { hidden: false; redeem: boolean; redeemCapPerOrder: number | null; redeemVndPerPoint: number | null };

export function LoyaltyFields() {
  const [state, setState] = useState<Open | { hidden: true } | null>(null);

  function watch(node: HTMLDivElement | null) {
    if (!node || state) return;
    void fetch("/api/loyalty")
      .then((res) => res.json())
      .then((data: Open | { hidden: true }) => setState(data.hidden ? { hidden: true } : data))
      .catch(() => setState({ hidden: true }));
  }

  if (state?.hidden) return null;
  if (!state) return <div ref={watch} />;
  return (
    <div className="mt-4 space-y-3 text-sm">
      <label className="block">
        Mã giới thiệu
        <input name="referralCode" className="mt-1 w-full rounded border px-2 py-1" />
      </label>
      {state.redeem && state.redeemCapPerOrder && state.redeemVndPerPoint ? (
        <label className="block">
          Dùng điểm, tối đa {state.redeemCapPerOrder}, mỗi điểm {formatVnd(state.redeemVndPerPoint)}
          <input name="loyaltyPoints" inputMode="numeric" className="mt-1 w-full rounded border px-2 py-1" />
        </label>
      ) : null}
    </div>
  );
}
