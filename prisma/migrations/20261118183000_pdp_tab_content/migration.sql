-- Additive nullable columns for PDP tab copy. Existing rows stay NULL and keep today's generated text.
ALTER TABLE "Product" ADD COLUMN "detailBulletsJson" TEXT;
ALTER TABLE "Product" ADD COLUMN "materialBulletsJson" TEXT;
ALTER TABLE "Product" ADD COLUMN "sizeChartJson" TEXT;
ALTER TABLE "Product" ADD COLUMN "shippingOverrideJson" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "shippingPolicyJson" TEXT;
