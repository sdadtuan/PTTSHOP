import { describe, expect, it } from "vitest";
import { buyNowLabel, experimentBucket, stickyVisible, variantFor, type ExperimentDef } from "@/lib/experiments/assign";

const buy: ExperimentDef = {
  key: "buy_now_copy",
  enabled: false,
  variants: ["control", "mua_ngay_hom_nay"],
  trafficPercent: 100,
};

describe("experiment assignment", () => {
  it("tắt experiment thì mọi khách về control", () => {
    expect(variantFor(buy, "visitor-a")).toBe("control");
    expect(variantFor({ ...buy, enabled: true, trafficPercent: 0 }, "visitor-a")).toBe("control");
  });

  it("cùng khách giữ một bucket", () => {
    expect(experimentBucket("visitor-a", "buy_now_copy")).toBe(experimentBucket("visitor-a", "buy_now_copy"));
    const on = { ...buy, enabled: true, trafficPercent: 100 };
    expect(variantFor(on, "visitor-a")).toBe("mua_ngay_hom_nay");
    expect(variantFor(on, "visitor-a")).toBe(variantFor(on, "visitor-a"));
  });

  it("copy và thanh dính mẫu", () => {
    expect(buyNowLabel("control")).toBe("Mua ngay");
    expect(buyNowLabel("mua_ngay_hom_nay")).toBe("Mua ngay hôm nay");
    expect(stickyVisible("off", true)).toBe(false);
    expect(stickyVisible("control", true)).toBe(true);
    expect(stickyVisible("control", false)).toBe(false);
  });
});
