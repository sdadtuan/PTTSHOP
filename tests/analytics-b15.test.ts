import { describe, expect, it } from "vitest";
import { publicEventParams, scriptsForConsent, searchEventTerm } from "@/lib/analytics/ids";

const ids = { ga4: "G-TEST1234", meta: "1234567890123", tiktok: "ABCDEFGH", clarity: "clarity1" };

describe("measurement consent", () => {
  it("không tải script khi chỉ cookie cần thiết hoặc chưa có ID", () => {
    expect(scriptsForConsent("essential", ids)).toEqual([]);
    expect(scriptsForConsent("all", { ga4: null, meta: null, tiktok: null, clarity: null })).toEqual([]);
  });

  it("tải đủ kênh đã cấu hình sau khi đồng ý tất cả", () => {
    const urls = scriptsForConsent("all", ids);
    expect(urls).toEqual([
      "https://www.googletagmanager.com/gtag/js?id=G-TEST1234",
      "https://connect.facebook.net/en_US/fbevents.js",
      "https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=ABCDEFGH",
      "https://www.clarity.ms/tag/clarity1",
    ]);
  });

  it("bỏ điện thoại, email và địa chỉ", () => {
    expect(publicEventParams({ value: 10, email: "a@b.c", phone: "0900000000", address: "Q1" })).toEqual({ value: 10 });
  });

  it("không gửi từ khóa tìm là email hoặc số điện thoại", () => {
    expect(searchEventTerm("áo thun")).toBe("áo thun");
    expect(searchEventTerm("a@b.c")).toBeNull();
    expect(searchEventTerm("0900000000")).toBeNull();
  });
});
