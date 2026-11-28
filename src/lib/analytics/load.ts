import { prisma } from "@/lib/prisma";
import { configuredMeasurementIds, type MeasurementIds } from "@/lib/analytics/ids";

export async function getMeasurementIds(): Promise<MeasurementIds> {
  const site = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: {
      ga4MeasurementId: true,
      metaPixelId: true,
      tiktokPixelId: true,
      clarityProjectId: true,
    },
  });
  return configuredMeasurementIds({
    ga4: site?.ga4MeasurementId || process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
    meta: site?.metaPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID,
    tiktok: site?.tiktokPixelId || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
    clarity: site?.clarityProjectId || process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
  });
}
