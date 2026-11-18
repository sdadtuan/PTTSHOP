import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { handleApiError, ApiError } from "@/lib/api";
import {
  discardDraft,
  getAdminCmsState,
  publishHomepage,
  restoreHomepageVersion,
  restorePreviousVersion,
  saveDraft,
} from "@/lib/cms/homepage";
import { sectionKeySchema } from "@/lib/cms/validate";

export const dynamic = "force-dynamic";

/** Admin only: full CMS state (draft + published + version list). */
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await getAdminCmsState());
  } catch (err) {
    return handleApiError(err);
  }
}

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save_draft"),
    // Validated (and sanitised) inside saveDraft with siteSettingsSchema.
    settings: z.unknown().optional(),
    sections: z
      .array(
        z.object({
          key: sectionKeySchema,
          draftEnabled: z.boolean().optional(),
          sortOrder: z.number().int().min(0).max(100).optional(),
          draftContent: z.unknown().optional(),
        }),
      )
      .max(20)
      .optional(),
  }),
  z.object({ action: z.literal("publish") }),
  z.object({ action: z.literal("restore"), versionId: z.string().min(1).max(64) }),
  z.object({ action: z.literal("restore_previous") }),
  z.object({ action: z.literal("discard_draft") }),
]);

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const raw = await req.json().catch(() => {
      throw new ApiError("Body JSON không hợp lệ", 400);
    });
    const body = bodySchema.parse(raw);

    switch (body.action) {
      case "save_draft":
        return NextResponse.json({
          ok: true,
          ...(await saveDraft({ settings: body.settings, sections: body.sections })),
        });
      case "publish":
        return NextResponse.json({ ok: true, ...(await publishHomepage(session.user.id)) });
      case "discard_draft":
        return NextResponse.json({ ok: true, ...(await discardDraft()) });
      case "restore":
      case "restore_previous":
        try {
          const state =
            body.action === "restore"
              ? await restoreHomepageVersion(body.versionId, session.user.id)
              : await restorePreviousVersion(session.user.id);
          return NextResponse.json({ ok: true, ...state });
        } catch (e) {
          throw new ApiError(e instanceof Error ? e.message : "Khôi phục thất bại", 400);
        }
    }
  } catch (err) {
    return handleApiError(err);
  }
}
