import { formatVnd } from "@/lib/format";

/** Câu khi chưa có phí dự phòng và đơn chưa đạt ngưỡng freeship. */
export const SHIPPING_PENDING_COPY = "Phí vận chuyển sẽ báo khi xác nhận đơn";
export const TOTAL_EXCLUDES_SHIPPING_COPY = "chưa gồm phí vận chuyển";

export type ShopProfile = {
  hotline: string | null;
  email: string | null;
  address: string | null;
  hours: string | null;
  zaloUrl: string | null;
  freeShipThreshold: number | null;
  fallbackFee: number | null;
  returnWindowDays: number | null;
  codEnabled: boolean;
  bankTransferEnabled: boolean;
  bankVisible: boolean;
  lowStockThreshold: number | null;
};

export type ShopFacts = {
  returnWindowDays: number | null;
  codEnabled: boolean;
  bankVisible: boolean;
  freeShipThreshold: number | null;
};

export function blankToNull(value: string | null | undefined) {
  const text = (value ?? "").trim();
  return text ? text : null;
}

export function optionalPositive(value: number | null | undefined) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

export function optionalNonNegative(value: number | null | undefined) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

/** Số Việt Nam: 0 và 9 chữ số, hoặc +84 và 9 chữ số. */
export function parseVnPhone(value: string) {
  const text = value.trim().replace(/[\s.-]/g, "");
  if (!text) return null;
  if (!/^(?:0\d{9}|\+84\d{9})$/.test(text)) return "invalid" as const;
  return text;
}

export function paymentMethodLine(codEnabled: boolean, bankVisible: boolean) {
  if (codEnabled && bankVisible) return "Thanh toán COD hoặc chuyển khoản";
  if (codEnabled) return "Thanh toán COD";
  if (bankVisible) return "Thanh toán chuyển khoản";
  return null;
}

export function returnWindowLine(days: number | null) {
  if (days == null) return null;
  return `Đổi hoặc trả trong ${days} ngày kể từ khi nhận nếu còn tem/tag`;
}

const RETURN_DAY_CLAIM = /(?:đổi|trả).*\d+\s*ngày|\d+\s*ngày.*(?:đổi|trả)/i;
const PAYMENT_CLAIM = /thanh toán/i;

/** Bỏ câu đổi trả/thanh toán bịa. Chỉ gắn lại khi cấu hình đang có số hoặc phương thức. */
export function presentShippingBullets(lines: string[], facts: ShopFacts) {
  const pay = paymentMethodLine(facts.codEnabled, facts.bankVisible);
  const ret = returnWindowLine(facts.returnWindowDays);
  const next: string[] = [];
  for (const line of lines) {
    if (RETURN_DAY_CLAIM.test(line) || /free shipping/i.test(line)) {
      if (ret && !next.includes(ret)) next.push(ret);
      continue;
    }
    if (PAYMENT_CLAIM.test(line)) {
      if (pay && !next.includes(pay)) next.push(pay);
      continue;
    }
    if (/free\s*ship/i.test(line)) continue;
    next.push(line);
  }
  if (ret && !next.includes(ret)) next.splice(Math.min(1, next.length), 0, ret);
  if (pay && !next.some((line) => PAYMENT_CLAIM.test(line))) next.push(pay);
  return next;
}

export function policyParagraphs(
  slug: string,
  paragraphs: string[],
  profile: Pick<ShopProfile, "returnWindowDays" | "freeShipThreshold">,
) {
  const body = paragraphs.filter((paragraph) => {
    if (slug !== "chinh-sach-doi-tra") return true;
    return !/(?:đổi|trả).*\d+\s*ngày|\d+\s*ngày.*(?:đổi|trả)/i.test(paragraph);
  });
  if (slug === "chinh-sach-doi-tra" && profile.returnWindowDays != null) {
    body.splice(
      Math.min(1, body.length),
      0,
      `Khách được yêu cầu đổi hoặc trả trong ${profile.returnWindowDays} ngày kể từ khi nhận.`,
    );
  }
  if (slug === "chinh-sach-giao-hang" && profile.freeShipThreshold != null) {
    body.push(`Ngưỡng miễn phí vận chuyển: ${formatVnd(profile.freeShipThreshold)}.`);
  }
  return body;
}

/** Hero/trust không được tự bịa freeship hay số ngày đổi trả. */
export function visibleTrustText(text: string) {
  const value = text.trim();
  if (!value) return "";
  if (/free\s*ship/i.test(value) || /^free shipping$/i.test(value)) return "";
  if (/trong\s+\d+\s*ngày/i.test(value)) return "";
  if (RETURN_DAY_CLAIM.test(value)) return "";
  return value;
}

export type ContactRow = { key: string; label: string; value: string; href?: string };

export function contactRows(
  profile: Pick<ShopProfile, "address" | "email" | "hotline" | "hours" | "zaloUrl">,
  labels: { address: string; email: string; phone: string; hours: string },
): ContactRow[] {
  const rows: ContactRow[] = [];
  if (profile.address) rows.push({ key: "address", label: labels.address, value: profile.address });
  if (profile.email) rows.push({ key: "email", label: labels.email, value: profile.email, href: `mailto:${profile.email}` });
  if (profile.hotline) {
    rows.push({ key: "phone", label: labels.phone, value: profile.hotline, href: `tel:${profile.hotline}` });
  }
  if (profile.hours) rows.push({ key: "hours", label: labels.hours, value: profile.hours });
  if (profile.zaloUrl) rows.push({ key: "zalo", label: "Zalo:", value: "Nhắn Zalo", href: profile.zaloUrl });
  return rows;
}

export function orderMoney(subtotal: number, shippingFee: number | null, discount: number) {
  const pending = shippingFee == null;
  return {
    shippingFee,
    total: Math.max(0, subtotal - discount + (pending ? 0 : shippingFee)),
    shippingText: pending ? SHIPPING_PENDING_COPY : shippingFee === 0 ? "Miễn phí" : null,
    totalNote: pending ? TOTAL_EXCLUDES_SHIPPING_COPY : null,
  };
}

export function purchaseBadges(profile: Pick<ShopProfile, "freeShipThreshold" | "returnWindowDays">) {
  const badges: string[] = [];
  if (profile.freeShipThreshold != null) badges.push(`Freeship từ ${formatVnd(profile.freeShipThreshold)}`);
  if (profile.returnWindowDays != null) badges.push(`Đổi trả ${profile.returnWindowDays} ngày`);
  badges.push("Thanh toán an toàn");
  return badges;
}

type FloatingItem = { href: string; label: string; preset: string };

/** Nút Zalo/điện thoại chỉ hiện khi hồ sơ cửa hàng có giá trị. */
export function visibleFloatingItems<T extends FloatingItem>(items: T[], profile: Pick<ShopProfile, "zaloUrl" | "hotline">): T[] {
  const next = items.flatMap((item) => {
    if (item.preset === "zalo") {
      if (!profile.zaloUrl) return [];
      return [{ ...item, href: profile.zaloUrl }];
    }
    if (item.preset === "phone") {
      if (!profile.hotline) return [];
      return [{ ...item, href: `tel:${profile.hotline}` }];
    }
    return [item];
  });
  if (profile.zaloUrl && !next.some((item) => item.preset === "zalo")) {
    next.push({ href: profile.zaloUrl, label: "Zalo", preset: "zalo" } as T);
  }
  if (profile.hotline && !next.some((item) => item.preset === "phone")) {
    next.push({ href: `tel:${profile.hotline}`, label: "Gọi", preset: "phone" } as T);
  }
  return next;
}
