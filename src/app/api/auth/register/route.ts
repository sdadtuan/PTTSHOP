import bcrypt from "bcryptjs";
import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { clientIp, recordConsents } from "@/lib/consent";
import { emailSchema, passwordSchema } from "@/lib/validation";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: passwordSchema,
  phone: z.string().trim().max(20).optional(),
  consents: z
    .array(
      z.object({
        purpose: z.enum(["delivery", "invoice", "marketing"]),
        granted: z.boolean(),
      }),
    )
    .default([]),
});

export async function POST(req: Request) {
  try {
    const rl = rateLimit(clientKey(req, "register"), 10, 60_000);
    if (!rl.ok) {
      return jsonError("Quá nhiều yêu cầu, thử lại sau", 429);
    }

    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError("Email đã được sử dụng", 409);
    }

    const password = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email,
        password,
        phone: body.phone || null,
        role: "CUSTOMER",
      },
      select: { id: true, email: true, name: true, role: true },
    });

    await recordConsents({
      subject: email,
      userId: user.id,
      ip: clientIp(req),
      grants: body.consents,
    });

    return jsonOk({ user }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
