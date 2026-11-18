import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { getPublishedHomepage } from "@/lib/cms/homepage";

/** Public published homepage CMS payload (no draft). */
export async function GET() {
  try {
    const data = await getPublishedHomepage();
    return NextResponse.json({
      settings: data.settings,
      sections: data.sections,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
