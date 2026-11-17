import bcrypt from "bcryptjs";
import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { emailSchema, passwordSchema } from "@/lib/validation";

const schema = z.object({
  email: emailSchema,
  token: z.string().min(20),
  password: passwordSchema,
});

export async function POST(req: Request) {
  try {
    const rl = rateLimit(clientKey(req, "reset"), 10, 60_000);
    if (!rl.ok) {
      return jsonError("Quá nhiều yêu cầu, thử lại sau", 429);
    }

    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();
    const identifier = `reset:${email}`;

    const record = await prisma.verificationToken.findUnique({
      where: { token: body.token },
    });

    if (
      !record ||
      record.identifier !== identifier ||
      record.expires < new Date()
    ) {
      return jsonError("Token không hợp lệ hoặc đã hết hạn", 400);
    }

    const password = await bcrypt.hash(body.password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { password },
      }),
      prisma.verificationToken.delete({ where: { token: body.token } }),
    ]);

    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
