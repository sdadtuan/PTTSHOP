import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { checkoutMethodError, paymentOptions, quoteFromServerPrices } from "@/lib/payments/policy";
import { normalizeShippingConfig, shippingFeeForCheckout } from "@/lib/shipping/policy";
import { parseShopProfileInput } from "@/lib/shop/input";
import { parseStorefrontUi } from "@/lib/storefront/ui-copy-validate";
import {
  SHIPPING_PENDING_COPY,
  TOTAL_EXCLUDES_SHIPPING_COPY,
  contactRows,
  orderMoney,
  paymentMethodLine,
  policyParagraphs,
  presentShippingBullets,
  purchaseBadges,
  visibleFloatingItems,
  visibleTrustText,
} from "@/lib/shop/profile";

const labels = { address: "Showroom:", email: "Email:", phone: "Điện thoại:", hours: "Giờ làm việc:" };
const emptyProfile = {
  hotline: null,
  email: null,
  address: null,
  hours: null,
  zaloUrl: null,
  freeShipThreshold: null,
  fallbackFee: null,
  returnWindowDays: null,
  codEnabled: true,
  bankTransferEnabled: false,
  bankVisible: false,
  lowStockThreshold: null,
};

const bank = {
  codEnabled: true,
  codMaxAmount: 5_000_000,
  holdHours: 24,
  codConfirmHours: 48,
  bankTransferEnabled: true,
  bankBin: "970422",
  bankName: "MB",
  bankAccountNumber: "0000000000",
  bankAccountName: "CONG TY TEST",
  bankBranch: "",
};

function walk(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      found.push(...walk(full));
    } else found.push(full);
  }
  return found;
}

describe("shop profile display", () => {
  it("hides contact, freeship and return claims when nothing is configured", () => {
    expect(contactRows(emptyProfile, labels)).toEqual([]);
    expect(purchaseBadges(emptyProfile)).toEqual(["Thanh toán an toàn"]);
    expect(visibleTrustText("Free ship > 500k")).toBe("");
    expect(visibleTrustText("Trong 7 Ngày")).toBe("");
    expect(visibleFloatingItems([{ href: "https://zalo.me/1", label: "Zalo", preset: "zalo" }], emptyProfile)).toEqual([]);
    const bullets = presentShippingBullets(
      [
        "Giao hàng toàn quốc 2–5 ngày làm việc",
        "Miễn phí đổi size trong 30 ngày nếu còn tem/tag",
        "Hoàn tiền theo chính sách cửa hàng khi lỗi sản xuất",
        "Thanh toán COD hoặc chuyển khoản an toàn",
      ],
      emptyProfile,
    );
    expect(bullets.join("\n")).not.toMatch(/7 ngày|30 ngày/);
    expect(bullets).toContain("Thanh toán COD");
    expect(bullets.join(" ")).not.toMatch(/chuyển khoản/);
    const policy = policyParagraphs(
      "chinh-sach-doi-tra",
      ["Bản nháp.", "Khách được yêu cầu đổi hoặc trả trong 7 ngày kể từ khi nhận.", "Hàng cần còn tem."],
      emptyProfile,
    );
    expect(policy.join(" ")).not.toMatch(/7 ngày|30 ngày/);
  });

  it("shows configured contact, threshold and return days", () => {
    const profile = {
      ...emptyProfile,
      hotline: "0900000001",
      email: "test@example.com",
      address: "Địa chỉ test",
      hours: "8:00–17:00 test",
      zaloUrl: "https://zalo.me/test",
      freeShipThreshold: 200000,
      returnWindowDays: 14,
      bankVisible: true,
    };
    expect(contactRows(profile, labels).map((row) => row.key)).toEqual(["address", "email", "phone", "hours", "zalo"]);
    expect(purchaseBadges(profile).join(" ")).toContain("14 ngày");
    expect(purchaseBadges(profile).join(" ")).toContain("200.000");
    const bullets = presentShippingBullets(["Giao hàng toàn quốc 2–5 ngày làm việc"], profile);
    expect(bullets.join(" ")).toContain("14 ngày");
    expect(bullets).toContain("Thanh toán COD hoặc chuyển khoản");
    const policy = policyParagraphs("chinh-sach-doi-tra", ["Bản nháp.", "Hàng cần còn tem."], profile);
    expect(policy.join(" ")).toContain("14 ngày");
    expect(policy.join(" ")).not.toMatch(/7 ngày|30 ngày/);
  });

  it("leaves the shipping fee unset instead of adding zero, unless the order reaches the threshold", () => {
    const empty = normalizeShippingConfig(null);
    expect(empty.freeShipThreshold).toBeNull();
    expect(empty.fallbackFee).toBeNull();
    const pending = shippingFeeForCheckout({
      subtotal: 100000,
      config: empty,
      sameProvince: null,
      carrierFee: null,
      carrierAvailable: false,
    });
    expect(pending).toEqual({ fee: null, source: "PENDING" });
    const money = orderMoney(100000, null, 0);
    expect(money.total).toBe(100000);
    expect(money.shippingText).toBe(SHIPPING_PENDING_COPY);
    expect(money.totalNote).toBe(TOTAL_EXCLUDES_SHIPPING_COPY);
    expect(quoteFromServerPrices([{ price: 100000, quantity: 1 }], null, 0).total).toBe(100000);

    const free = shippingFeeForCheckout({
      subtotal: 200000,
      config: normalizeShippingConfig({ freeShipThreshold: 200000 }),
      sameProvince: null,
      carrierFee: null,
      carrierAvailable: false,
    });
    expect(free).toEqual({ fee: 0, source: "FREE" });
    expect(orderMoney(200000, 0, 0).shippingText).toBe("Miễn phí");
    expect(orderMoney(200000, 0, 0).totalNote).toBeNull();
  });

  it("names only the payment methods that are on", () => {
    expect(paymentMethodLine(true, false)).toBe("Thanh toán COD");
    expect(paymentMethodLine(false, true)).toBe("Thanh toán chuyển khoản");
    expect(paymentMethodLine(false, false)).toBeNull();
    const hidden = paymentOptions({ ...bank, bankTransferEnabled: false }, false);
    expect(hidden.bankVisible).toBe(false);
    expect(JSON.stringify(hidden)).not.toContain("bankAccountNumber");
    expect(JSON.stringify(hidden)).not.toContain(bank.bankAccountNumber);
    expect(checkoutMethodError("BANK_TRANSFER", 1000, { ...bank, bankTransferEnabled: false }, false)).toMatch(/cấu hình/);
    expect(checkoutMethodError("BANK_TRANSFER", 1000, { ...bank, bankAccountNumber: "" }, false)).toMatch(/cấu hình/);
    expect(checkoutMethodError("COD", 1000, { ...bank, bankTransferEnabled: false }, false)).toBeNull();
    expect(paymentOptions(bank, false).bankVisible).toBe(true);
  });

  it("rejects a short phone, a bad email and a negative amount", () => {
    const base = {
      hotline: "",
      email: "",
      address: "",
      hours: "",
      zaloUrl: "",
      freeShipThreshold: null,
      fallbackFee: null,
      returnWindowDays: null,
      codEnabled: true,
      bankTransferEnabled: false,
      bankBin: "",
      bankName: "",
      bankAccountNumber: "",
      keepBankAccount: false,
      bankAccountName: "",
      bankBranch: "",
    };
    expect(parseShopProfileInput({ ...base, hotline: "12345" }).ok).toBe(false);
    expect(parseShopProfileInput({ ...base, email: "không-phải-email" }).ok).toBe(false);
    expect(parseShopProfileInput({ ...base, freeShipThreshold: -1 }).ok).toBe(false);
    const ok = parseShopProfileInput({ ...base, hotline: "0900000001", email: "a@b.co" });
    expect(ok.ok).toBe(true);
  });

  it("drops contact copy saved before the shop profile, even if the JSON still has it", () => {
    const parsed = parseStorefrontUi({
      contact: {
        showroomAddress: "123 Nguyễn Huệ, Quận 1, TP.HCM",
        phone: "0901 234 567",
        hours: "9:00 – 21:00 (T2–CN)",
        email: "demo@example.com",
        formHeading: "Gửi tin nhắn (demo — không gửi email thật)",
      },
    });
    expect(parsed.contact.showroomAddress).toBe("");
    expect(parsed.contact.phone).toBe("");
    expect(parsed.contact.hours).toBe("");
    expect(parsed.contact.email).toBe("");
    expect(parsed.contact.formHeading).toBe("Gửi tin nhắn");
  });

  it("does not keep invented shop defaults in src", () => {
    const hits: string[] = [];
    const needles = ["0901234567", "123 Nguyễn Huệ", "500_000"];
    for (const file of walk(path.join(process.cwd(), "src"))) {
      if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file)) continue;
      const text = readFileSync(file, "utf8");
      for (const needle of needles) {
        if (text.includes(needle)) hits.push(`${path.relative(process.cwd(), file)}: ${needle}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
