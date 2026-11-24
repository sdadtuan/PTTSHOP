export type SecretView = { name: string; label: string };

const KEYS = [
  ["payOS", "PAYOS_CLIENT_ID"],
  ["payOS", "PAYOS_API_KEY"],
  ["payOS", "PAYOS_CHECKSUM_KEY"],
  ["GHN", "GHN_TOKEN"],
  ["GHN", "GHN_SHOP_ID"],
  ["GHN", "GHN_WEBHOOK_TOKEN"],
  ["GHTK", "GHTK_TOKEN"],
  ["Viettel S-Invoice", "EINVOICE_VIETTEL_USERNAME"],
  ["Viettel S-Invoice", "EINVOICE_VIETTEL_PASSWORD"],
  ["Viettel S-Invoice", "EINVOICE_VIETTEL_SUPPLIER_TAX_CODE"],
  ["MISA meInvoice", "EINVOICE_MISA_APP_ID"],
  ["MISA meInvoice", "EINVOICE_MISA_TAX_CODE"],
  ["MISA meInvoice", "EINVOICE_MISA_TOKEN"],
  ["CRM rs.pttads.vn", "CRM_RS_BASE_URL"],
  ["CRM rs.pttads.vn", "CRM_RS_API_KEY"],
  ["Email SMTP", "EMAIL_SMTP_HOST"],
  ["Email Resend", "RESEND_API_KEY"],
] as const;

export function maskSecret(value: string | undefined): SecretView {
  const trimmed = value?.trim() || "";
  if (!trimmed) return { name: "missing", label: "Chưa cấu hình" };
  if (trimmed.length < 8) return { name: "short", label: "Đã cấu hình (quá ngắn)" };
  return { name: "set", label: `••••${trimmed.slice(-4)}` };
}

export function integrationStatus(env: Record<string, string | undefined>) {
  return KEYS.map(([group, key]) => {
    const view = maskSecret(env[key]);
    return { group, key, status: view.label };
  });
}
