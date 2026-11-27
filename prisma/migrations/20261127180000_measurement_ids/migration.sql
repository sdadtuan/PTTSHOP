-- ID đo lường. Null = không tải script của kênh đó.
ALTER TABLE "SiteSettings" ADD COLUMN "ga4MeasurementId" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "metaPixelId" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "tiktokPixelId" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "clarityProjectId" TEXT;
