export type StockPull = { ok: true; csv: string } | { ok: false; error: string };

export async function pullGoogleSheet(url: string, fetchImpl: typeof fetch = fetch): Promise<StockPull> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "URL sheet không hợp lệ" };
  }
  if (parsed.protocol !== "https:") return { ok: false, error: "Sheet phải là HTTPS" };
  const response = await fetchImpl(parsed.toString());
  if (!response.ok) return { ok: false, error: "Không đọc được Google Sheet" };
  return { ok: true, csv: await response.text() };
}

/** CJ Dropshipping chưa được nối. Không mở mạng và không đọc khoá. */
export function pullCjDropshipping(): StockPull {
  return { ok: false, error: "CJ Dropshipping chưa được nối. Không gọi API." };
}
