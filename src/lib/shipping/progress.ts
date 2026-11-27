export type FreeshipProgress = {
  remaining: number;
  percent: number;
  reached: boolean;
};

/** Ngưỡng trống hoặc không dương thì không có thanh. Phần trăm không vượt 100. */
export function freeshipProgress(
  subtotal: number,
  threshold: number | null | undefined,
): FreeshipProgress | null {
  if (threshold == null || !Number.isFinite(threshold) || threshold <= 0) return null;
  if (!Number.isFinite(subtotal) || subtotal < 0) return null;
  const remaining = Math.max(0, threshold - subtotal);
  const percent = Math.min(100, Math.max(0, Math.round((subtotal / threshold) * 100)));
  return { remaining, percent, reached: remaining === 0 };
}
