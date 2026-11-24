/** Chỉ thử lại khi SQLite báo bận. Lỗi Postgres (trùng khoá, ràng buộc) ném ngay, không chờ. */
export function isSqliteBusy(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const code =
    typeof err === "object" && err && "code" in err ? String((err as { code?: string }).code) : "";
  return code === "P2034" || code === "SQLITE_BUSY" || /SQLITE_BUSY|database is locked/i.test(message);
}

export async function withSqliteRetry<T>(fn: () => Promise<T>, attempts = 5) {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isSqliteBusy(err) || i === attempts - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 25 * (i + 1)));
    }
  }
  throw last;
}
