-- Additive: allow hiding a product image/video from the storefront without deleting it.
ALTER TABLE "ProductImage" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
