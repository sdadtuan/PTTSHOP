import { crc16CcittFalse } from "@/lib/payments/crc16";

function tlv(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

/** NAPAS 247 / VietQR. Nội dung chuyển khoản là mã đơn. */
export function buildVietQrPayload(input: {
  bankBin: string;
  bankAccountNumber: string;
  bankAccountName: string;
  amount: number;
  orderNumber: string;
}) {
  const account = input.bankAccountNumber.replace(/\D/g, "");
  const beneficiary = tlv("00", input.bankBin) + tlv("01", account);
  const merchant = tlv("00", "A000000727") + tlv("01", beneficiary) + tlv("02", "QRIBFTTA");
  const name = input.bankAccountName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, 25);
  const body = [
    tlv("00", "01"),
    tlv("01", "12"),
    tlv("38", merchant),
    tlv("53", "704"),
    tlv("54", String(input.amount)),
    tlv("58", "VN"),
    name ? tlv("59", name) : "",
    tlv("62", tlv("08", input.orderNumber)),
    "6304",
  ].join("");
  return body + crc16CcittFalse(body);
}

export type VietQrFields = {
  bin: string;
  account: string;
  amount: string;
  content: string;
};

/** Đọc các trường EMV đã ghi trong payload. Dùng để đối chiếu QR. */
export function readVietQrFields(payload: string): VietQrFields {
  const tags = readTlv(payload);
  const merchant = tags.get("38") || "";
  const nested = readTlv(readTlv(merchant).get("01") || "");
  const extra = readTlv(tags.get("62") || "");
  return {
    bin: nested.get("00") || "",
    account: nested.get("01") || "",
    amount: tags.get("54") || "",
    content: extra.get("08") || "",
  };
}

function readTlv(value: string) {
  const map = new Map<string, string>();
  let i = 0;
  while (i + 4 <= value.length) {
    const id = value.slice(i, i + 2);
    const len = Number(value.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(id) || !Number.isFinite(len)) break;
    map.set(id, value.slice(i + 4, i + 4 + len));
    i += 4 + len;
  }
  return map;
}
