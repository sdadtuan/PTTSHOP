import { describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));

import { GET as codHistory } from "@/app/api/admin/cod-reconcile/route";
import { summarizeCodSession } from "@/lib/shipping/reconcile";
import { replayShippingQuotes, shouldQuoteShipping } from "@/lib/shipping/quote-client";

describe("shipping quote race", () => {
  it("does not let a late subtotal=0 response replace free shipping", () => {
    expect(shouldQuoteShipping({ loading: true, itemCount: 1 })).toBe(false);
    expect(shouldQuoteShipping({ loading: false, itemCount: 0 })).toBe(false);
    expect(shouldQuoteShipping({ loading: false, itemCount: 1 })).toBe(true);
    const fee = replayShippingQuotes([
      { requestedSubtotal: 0, currentSubtotal: 0, responseFee: 30_000 },
      { requestedSubtotal: 549_000, currentSubtotal: 549_000, responseFee: 0 },
      { requestedSubtotal: 0, currentSubtotal: 549_000, responseFee: 30_000 },
    ]);
    expect(fee).toBe(0);
  });
});

describe("cod reconcile history", () => {
  it("counts matches and mismatches", () => {
    expect(summarizeCodSession([{ result: "MATCH" }, { result: "MISMATCH" }, { result: "UNMATCHED" }])).toEqual({
      lineCount: 3,
      matchCount: 1,
      mismatchCount: 1,
    });
  });

  it("returns 401 before login", async () => {
    authMock.mockResolvedValue(null);
    const res = await codHistory();
    expect(res.status).toBe(401);
  });
});
