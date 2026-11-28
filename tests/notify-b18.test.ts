import { describe, expect, it } from "vitest";
import { maskEmail, maskPhone, reminderDecision, reminderLimits } from "@/lib/notify/policy";

const ready = {
  enabled: true,
  afterHours: 2,
  maxTimes: 2,
  ageHours: 3,
  sentCount: 0,
  marketingOptIn: true,
  ordered: false,
  inStock: true,
};

describe("nhắc giỏ và ZNS", () => {
  it("che số điện thoại và email", () => {
    expect(maskPhone("0900000001")).toBe("090****001");
    expect(maskEmail("khach@pttshop.vn")).toBe("k***@pttshop.vn");
    expect(maskPhone("0900000001")).not.toContain("0000000");
  });

  it("không nhắc khi tắt, chưa đồng ý, đã đặt, hết hàng hoặc quá số lần", () => {
    expect(reminderDecision({ ...ready, enabled: false })).toBe("skip_disabled");
    expect(reminderDecision({ ...ready, marketingOptIn: false })).toBe("skip_no_consent");
    expect(reminderDecision({ ...ready, ordered: true })).toBe("skip_ordered");
    expect(reminderDecision({ ...ready, inStock: false })).toBe("skip_stock");
    expect(reminderDecision({ ...ready, sentCount: 2 })).toBe("skip_cap");
    expect(reminderDecision(ready)).toBe("dry_run");
  });

  it("để trống số giờ hoặc số lần thì không chạy", () => {
    expect(reminderLimits("", null)).toEqual({ reminderAfterHours: null, reminderMaxTimes: null });
    expect(reminderLimits(0, 2).reminderAfterHours).toBeNull();
    expect(reminderLimits(2, 3)).toEqual({ reminderAfterHours: 2, reminderMaxTimes: 3 });
  });
});
