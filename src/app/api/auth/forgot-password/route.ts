import { randomBytes } from "crypto";
import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { emailSchema } from "@/lib/validation";

const schema = z.object({
  email: emailSchema,
});

export async function POST(req: Request) {
  try {
    const rl = rateLimit(clientKey(req, "forgot"), 5, 60_000);
    if (!rl.ok) {
      return jsonOk({
        ok: true,
        message: "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
      });
    }

    const { email } = schema.parse(await req.json());
    const normalized = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalized } });

    // Always return the same message (no email enumeration).
    const response = {
      ok: true,
      message: "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
    };

    if (!user) return jsonOk(response);

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${normalized}` },
    });
    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${normalized}`,
        token,
        expires,
      },
    });

    const base = process.env.AUTH_URL || "http://localhost:3000";
    const link = `${base}/dat-lai-mat-khau?token=${token}&email=${encodeURIComponent(normalized)}`;

    await sendMail({
      to: normalized,
      subject: "Đặt lại mật khẩu VIZFAS",
      text: `Xin chào,\n\nNhấn liên kết sau để đặt lại mật khẩu (hết hạn sau 1 giờ):\n${link}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`,
    });

    return jsonOk(response);
  } catch (err) {
    return handleApiError(err);
  }
}
