/** Giá combo tính trên server. Không nhận giá client gửi lên. */

export type BundlePriceInput = {
  priceMode: string;
  priceVnd: number | null;
  percentOff: number | null;
  retailSum: number;
  units?: number;
};

export type BundleLine = {
  variantId: string;
  productId: string;
  unitPrice: number;
  quantity: number;
  bundleId: string | null;
};

export type BundleRecord = {
  id: string;
  title: string;
  isPublished: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  priceMode: string;
  priceVnd: number | null;
  percentOff: number | null;
  productIds: string[];
};

export function merchandiseAfterBundle(subtotal: number, bundleDiscount: number) {
  return Math.max(0, subtotal - Math.max(0, bundleDiscount));
}

export function bundleWindowOpen(startsAt: Date | null, endsAt: Date | null, now: Date) {
  if (startsAt && now.getTime() < startsAt.getTime()) return false;
  if (endsAt && now.getTime() > endsAt.getTime()) return false;
  return true;
}

export function priceBundle(input: BundlePriceInput):
  | { ok: true; price: number; discount: number }
  | { ok: false; error: string } {
  const units = input.units ?? 1;
  if (!Number.isInteger(input.retailSum) || input.retailSum <= 0) {
    return { ok: false, error: "Tổng giá lẻ không hợp lệ." };
  }
  if (!Number.isInteger(units) || units <= 0) {
    return { ok: false, error: "Số lượng combo không hợp lệ." };
  }
  if (input.priceMode === "FIXED") {
    const unit = input.priceVnd;
    if (unit == null || !Number.isInteger(unit) || unit <= 0) {
      return { ok: false, error: "Giá combo phải lớn hơn 0." };
    }
    const price = unit * units;
    if (price >= input.retailSum) return { ok: false, error: "Giá combo phải nhỏ hơn tổng giá lẻ." };
    return { ok: true, price, discount: input.retailSum - price };
  }
  if (input.priceMode === "PERCENT") {
    const percent = input.percentOff;
    if (percent == null || !Number.isInteger(percent) || percent <= 0 || percent >= 100) {
      return { ok: false, error: "Phần trăm giảm phải từ 1 đến 99." };
    }
    const discount = Math.round((input.retailSum * percent) / 100);
    const price = input.retailSum - discount;
    if (!Number.isInteger(price) || price <= 0 || price >= input.retailSum) {
      return { ok: false, error: "Giá combo sau làm tròn không hợp lệ." };
    }
    return { ok: true, price, discount };
  }
  return { ok: false, error: "Kiểu giá combo không hợp lệ." };
}

export function allocateDiscount(retails: number[], discount: number) {
  if (discount <= 0 || retails.length === 0) return retails.map(() => 0);
  const sum = retails.reduce((total, value) => total + value, 0);
  if (sum <= 0) return retails.map(() => 0);
  const shares = retails.map((retail) => Math.floor((discount * retail) / sum));
  const used = shares.reduce((total, value) => total + value, 0);
  shares[shares.length - 1] += discount - used;
  return shares;
}

export function settleBundles(input: {
  lines: BundleLine[];
  bundles: BundleRecord[];
  now: Date;
  couponRequested: boolean;
  stackCoupon: boolean;
  outOfStockMode: "HIDE" | "RETAIL";
  unavailableProductIds: string[];
}): { discount: number; shares: Record<string, number>; error: string | null } {
  const shares: Record<string, number> = {};
  let discount = 0;
  const groups = new Map<string, BundleLine[]>();
  for (const line of input.lines) {
    if (!line.bundleId) continue;
    const group = groups.get(line.bundleId) || [];
    group.push(line);
    groups.set(line.bundleId, group);
  }

  for (const [id, group] of groups) {
    const bundle = input.bundles.find((row) => row.id === id);
    if (!bundle || !bundle.isPublished || !bundleWindowOpen(bundle.startsAt, bundle.endsAt, input.now)) {
      continue;
    }
    const expected = new Set(bundle.productIds);
    const got = new Set(group.map((line) => line.productId));
    if (group.length !== got.size) {
      return { discount: 0, shares: {}, error: "Combo có món trùng." };
    }
    for (const productId of got) {
      if (!expected.has(productId)) {
        return { discount: 0, shares: {}, error: "Combo không gồm món này." };
      }
    }
    const missing = [...expected].filter((productId) => !got.has(productId));
    if (missing.length > 0) {
      if (input.outOfStockMode !== "RETAIL") {
        return { discount: 0, shares: {}, error: "Combo đang ẩn vì một món hết hàng." };
      }
      const unavailable = new Set(input.unavailableProductIds);
      if (!missing.every((productId) => unavailable.has(productId))) {
        return { discount: 0, shares: {}, error: "Combo thiếu món." };
      }
      continue;
    }
    const quantity = group[0]?.quantity ?? 0;
    if (group.some((line) => line.quantity !== quantity)) {
      return { discount: 0, shares: {}, error: "Mỗi món trong combo phải cùng số lượng." };
    }
    if (group.some((line) => !Number.isInteger(line.unitPrice) || line.unitPrice <= 0)) {
      return { discount: 0, shares: {}, error: "Giá lẻ không hợp lệ." };
    }
    const retailSum = group.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const priced = priceBundle({
      priceMode: bundle.priceMode,
      priceVnd: bundle.priceVnd,
      percentOff: bundle.percentOff,
      retailSum,
      units: quantity,
    });
    if (!priced.ok) return { discount: 0, shares: {}, error: priced.error };
    const parts = allocateDiscount(group.map((line) => line.unitPrice * line.quantity), priced.discount);
    group.forEach((line, index) => {
      shares[line.variantId] = parts[index] ?? 0;
    });
    discount += priced.discount;
  }

  if (discount > 0 && input.couponRequested && !input.stackCoupon) {
    return { discount: 0, shares: {}, error: "Mã giảm không cộng với giá combo." };
  }
  return { discount, shares, error: null };
}
