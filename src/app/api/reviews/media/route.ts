import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth-guards";
import { ensurePublicMediaLink, mediaRoot } from "@/lib/catalog-import-commit";
import { prisma } from "@/lib/prisma";
import { reviewMediaDecision } from "@/lib/reviews/media";
import { detectMimeFromBuffer } from "@/lib/upload-validate";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const form = await req.formData();
    const reviewId = String(form.get("reviewId") ?? "");
    const file = form.get("file");
    if (!reviewId || !(file instanceof File)) return jsonError("Thiếu file đánh giá", 400);

    const review = await prisma.review.findFirst({
      where: { id: reviewId, userId: session.user.id },
      select: { id: true },
    });
    if (!review) return jsonError("Không tìm thấy đánh giá", 404);

    const buf = Buffer.from(await file.arrayBuffer());
    const decision = reviewMediaDecision(buf.length, detectMimeFromBuffer(buf));
    if (!decision.ok) return jsonError(decision.error, 400);

    await ensurePublicMediaLink();
    const dir = path.join(mediaRoot(), "reviews");
    await mkdir(dir, { recursive: true });
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${decision.ext}`;
    await writeFile(path.join(dir, name), buf);
    const media = await prisma.reviewMedia.create({
      data: { reviewId, url: `/media/reviews/${name}`, mime: decision.mime, kind: decision.kind },
    });
    return jsonOk({ media }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
