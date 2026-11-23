type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  logText?: string;
  attachments?: { filename: string; content: Buffer; cid: string }[];
};

/**
 * Generic SMTP mailer. When SMTP_HOST is unset, logs to console (dev-safe).
 */
export async function sendMail(input: SendMailInput): Promise<{ sent: boolean }> {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.EMAIL_FROM || "PTT Shop <noreply@pttshop.vn>";

  if (!host) {
    console.info("[mail:dev]", {
      from,
      to: input.to,
      subject: input.subject,
      text: input.logText || input.text,
    });
    return { sent: false };
  }

  const nodemailer = await import("nodemailer");
  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? `<pre>${escapeHtml(input.text)}</pre>`,
    attachments: input.attachments,
  });

  return { sent: true };
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendOrderConfirmationEmail(order: {
  orderNumber: string;
  customerEmail?: string | null;
  customerName: string;
  total: number;
  status: string;
  transferText?: string;
  transferLogText?: string;
  qrPng?: Buffer;
}) {
  if (!order.customerEmail) return;
  const intro = `Xin chào ${order.customerName},\n\nĐơn hàng ${order.orderNumber} đã được tạo.\nTổng: ${order.total.toLocaleString("vi-VN")}đ\nTrạng thái: ${order.status}`;
  const closing = "\n\nCảm ơn bạn đã mua sắm tại PTT Shop.";
  const text = `${intro}${order.transferText ? `\n\n${order.transferText}` : ""}${closing}`;
  const logText = `${intro}${order.transferLogText ? `\n\n${order.transferLogText}` : ""}${closing}`;
  const html = order.qrPng
    ? `<pre>${escapeHtml(text)}</pre><p><img src="cid:vietqr" alt="Mã QR chuyển khoản ${escapeHtml(order.orderNumber)}"/></p>`
    : undefined;
  await sendMail({
    to: order.customerEmail,
    subject: `Xác nhận đơn ${order.orderNumber} — PTT Shop`,
    text,
    html,
    logText,
    attachments: order.qrPng
      ? [{ filename: `qr-${order.orderNumber}.png`, content: order.qrPng, cid: "vietqr" }]
      : undefined,
  });
}

export async function sendOrderStatusEmail(order: {
  orderNumber: string;
  customerEmail?: string | null;
  customerName: string;
  status: string;
}) {
  if (!order.customerEmail) return;
  await sendMail({
    to: order.customerEmail,
    subject: `Cập nhật đơn ${order.orderNumber} — PTT Shop`,
    text: `Xin chào ${order.customerName},\n\nĐơn hàng ${order.orderNumber} đã chuyển sang trạng thái: ${order.status}.\n\nPTT Shop`,
  });
}
