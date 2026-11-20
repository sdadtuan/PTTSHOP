import { describe, expect, it } from "vitest";
import { orderLineSummary } from "@/lib/admin-orders";

describe("admin order helpers", () => {
  it("summarizes line items", () => {
    expect(
      orderLineSummary([
        { name: "Áo A", quantity: 2 },
        { name: "Áo A", quantity: 1 },
        { name: "Quần B", quantity: 1 },
      ]).label,
    ).toBe("2 SP · 4 món");
  });
});