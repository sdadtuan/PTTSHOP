import { describe, expect, it } from "vitest";
import {
  displayBrandName,
  publicCopy,
  publicNavLabel,
  publicWatermark,
  visibleEmail,
  visibleHref,
  visiblePhone,
} from "@/lib/public-brand";

describe("public brand", () => {
  it("shows PTT Shop when the stored name is empty or VIZFAS", () => {
    expect(displayBrandName("")).toBe("PTT Shop");
    expect(displayBrandName("VIZFAS")).toBe("PTT Shop");
    expect(displayBrandName("PTT Shop")).toBe("PTT Shop");
  });

  it("hides placeholder phone, email and messenger", () => {
    expect(visiblePhone("0321 456 789")).toBe("");
    expect(visiblePhone("0901234567")).toBe("");
    expect(visiblePhone("")).toBe("");
    expect(visibleEmail("hello@vizfas.vn")).toBe("");
    expect(visibleEmail("")).toBe("");
    expect(visibleHref("https://m.me/vizfas")).toBe("");
    expect(visibleHref("tel:0321456789")).toBe("");
    expect(visibleHref("https://facebook.com")).toBe("");
    expect(visibleHref("")).toBe("");
  });

  it("hides the old watermark and fixes the nav label and missing space", () => {
    expect(publicWatermark("WEARLY")).toBe("");
    expect(publicWatermark("PTT")).toBe("PTT");
    expect(publicNavLabel("Đánh giá")).toBe("Đánh Giá");
    expect(publicCopy("Nam · Nữmỗi ngày")).toBe("Nam · Nữ mỗi ngày");
    expect(publicCopy("Về VIZFAS")).toBe("Về PTT Shop");
  });

  it("keeps a real phone and messenger link", () => {
    expect(visiblePhone("02873001234")).toBe("02873001234");
    expect(visibleHref("https://m.me/pttshop")).toBe("https://m.me/pttshop");
  });
});
