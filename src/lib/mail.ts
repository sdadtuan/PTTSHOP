type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Generic SMTP mailer. When SMTP_HOST is unset, logs to console (dev-safe).
 */
export async function sendMail(input: SendMailInput): Promise<{ sent: boolean }> {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.EMAIL_FROM || "VIZFAS <noreply@vizfas.vn>";

  if (!host) {
    console.info("[mail:dev]", {
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
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
    html: input.html ?? `<pre>${input.text}</pre>`,
  });

  return { sent: true };
}

export async function sendOrderConfirmationEmail(order: {
  orderNumber: string;
  customerEmail?: string | null;
  customerName: string;
  total: number;
  status: string;
}) {
  if (!order.customerEmail) return;
  await sendMail({
    to: order.customerEmail,
    subject: `Xác nhận đơn ${order.orderNumber} — VIZFAS`,
    text: `Xin chào ${order.customerName},\n\nĐơn hàng ${order.orderNumber} đã được tạo.\nTổng: ${order.total.toLocaleString("vi-VN")}đ\nTrạng thái: ${order.status}\n\nCảm ơn bạn đã mua sắm tại VIZFAS.`,
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
    subject: `Cập nhật đơn ${order.orderNumber} — VIZFAS`,
    text: `Xin chào ${order.customerName},\n\nĐơn hàng ${order.orderNumber} đã chuyển sang trạng thái: ${order.status}.\n\nVIZFAS`,
  });
}
