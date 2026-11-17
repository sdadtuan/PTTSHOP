import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

const addressSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(8).max(20),
  line1: z.string().min(3).max(200),
  ward: z.string().max(100).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  city: z.string().min(2).max(100),
  isDefault: z.boolean().optional(),
});

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return jsonError("Unauthorized", 401);
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Unauthorized", 401);
  const body = await req.json().catch(() => null);
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400);

  const data = parsed.data;
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId: user.id,
      fullName: data.fullName,
      phone: data.phone,
      line1: data.line1,
      ward: data.ward || null,
      district: data.district || null,
      city: data.city,
      isDefault: data.isDefault ?? false,
    },
  });
  return NextResponse.json({ address });
}

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Unauthorized", 401);
  const body = await req.json().catch(() => null);
  const parsed = addressSchema.extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400);

  const existing = await prisma.address.findFirst({
    where: { id: parsed.data.id, userId: user.id },
  });
  if (!existing) return jsonError("Không tìm thấy", 404);

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({
    where: { id: existing.id },
    data: {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      line1: parsed.data.line1,
      ward: parsed.data.ward || null,
      district: parsed.data.district || null,
      city: parsed.data.city,
      isDefault: parsed.data.isDefault ?? existing.isDefault,
    },
  });
  return NextResponse.json({ address });
}

export async function DELETE(req: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Unauthorized", 401);
  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return jsonError("Thiếu id", 400);
  const existing = await prisma.address.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return jsonError("Không tìm thấy", 404);
  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
