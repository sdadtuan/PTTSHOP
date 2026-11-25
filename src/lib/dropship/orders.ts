export function poFile(input: {
  poNumber: string;
  supplierName: string;
  lines: Array<{ supplierSku: string; name: string; color: string; size: string; quantity: number }>;
}) {
  const header = "phiếu,nhà cung cấp,mã NCC,tên,màu,size,số lượng";
  const body = input.lines.map((line) =>
    [input.poNumber, input.supplierName, line.supplierSku, line.name, line.color, line.size, String(line.quantity)].join(","),
  );
  return {
    fileName: `${input.poNumber}.csv`,
    csv: [header, ...body].join("\n"),
    emailSubject: `Đặt hàng ${input.poNumber}`,
    emailBody: `Kính gửi ${input.supplierName}, PTT Shop gửi phiếu ${input.poNumber}. Vui lòng phản hồi mã vận đơn.`,
  };
}

export function slaMarks(sentAt: Date, warnHours: number, slaHours: number) {
  return {
    warnAt: new Date(sentAt.getTime() + warnHours * 60 * 60 * 1000),
    slaDueAt: new Date(sentAt.getTime() + slaHours * 60 * 60 * 1000),
  };
}

export function slaScan(input: {
  status: string;
  trackingCode: string | null;
  warnAt: Date | null;
  warnedAt: Date | null;
  slaDueAt: Date | null;
  now: Date;
}) {
  if (input.status !== "SENT" && input.status !== "ACKNOWLEDGED") {
    return { warn: false, breach: false, status: input.status };
  }
  const breach = Boolean(input.slaDueAt && input.now.getTime() > input.slaDueAt.getTime() && !input.trackingCode);
  const warn = Boolean(
    !breach &&
    !input.trackingCode &&
    !input.warnedAt &&
    input.warnAt &&
    input.now.getTime() > input.warnAt.getTime(),
  );
  return { warn, breach, status: breach ? "SLA_BREACH" : input.status };
}

export function trackingLabel(trackingCode: string | null, fulfillmentSource: string | null) {
  if (trackingCode) return trackingCode;
  if (fulfillmentSource === "SUPPLIER") return "Đang đặt hàng";
  return "Chưa có";
}
