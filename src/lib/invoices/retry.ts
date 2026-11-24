export function nextRetryAt(now: Date, retryCount: number, baseMinutes: number) {
  const minutes = baseMinutes * 2 ** Math.max(0, retryCount - 1);
  return new Date(now.getTime() + minutes * 60_000);
}
