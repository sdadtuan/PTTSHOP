import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceAdmin } from "@/lib/rbac-access";
import { handleApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const bannerSchema = z.object({
  imageUrl: z.string().min(1),
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaHref: z.string().optional().nullable(),
  focalPoint: z.string().optional(),
  gridCols: z.number().int().min(1).max(6).optional(),
  gridRows: z.number().int().min(1).max(6).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
    const banners = await prisma.heroBanner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ banners });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const body = bannerSchema.parse(await req.json());
    const max = await prisma.heroBanner.aggregate({ _max: { sortOrder: true } });
    const banner = await prisma.heroBanner.create({
      data: {
        imageUrl: body.imageUrl,
        title: body.title ?? null,
        subtitle: body.subtitle ?? null,
        ctaLabel: body.ctaLabel ?? null,
        ctaHref: body.ctaHref ?? null,
        focalPoint: body.focalPoint ?? "50% 20%",
        gridCols: body.gridCols ?? 2,
        gridRows: body.gridRows ?? 3,
        sortOrder: body.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json({ banner }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    await enforceAdmin(req);
    const raw = await req.json();
    const id = z.string().min(1).parse(raw.id);
    const body = bannerSchema.partial().parse(raw);
    const banner = await prisma.heroBanner.update({
      where: { id },
      data: {
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.subtitle !== undefined ? { subtitle: body.subtitle } : {}),
        ...(body.ctaLabel !== undefined ? { ctaLabel: body.ctaLabel } : {}),
        ...(body.ctaHref !== undefined ? { ctaHref: body.ctaHref } : {}),
        ...(body.focalPoint !== undefined ? { focalPoint: body.focalPoint } : {}),
        ...(body.gridCols !== undefined ? { gridCols: body.gridCols } : {}),
        ...(body.gridRows !== undefined ? { gridRows: body.gridRows } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });
    return NextResponse.json({ banner });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    await enforceAdmin(req);
    const { searchParams } = new URL(req.url);
    const id = z.string().min(1).parse(searchParams.get("id"));
    await prisma.heroBanner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
