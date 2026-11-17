-- AlterTable: additive ProductImage video fields (safe; no reset)
ALTER TABLE "ProductImage" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'image';
ALTER TABLE "ProductImage" ADD COLUMN "posterUrl" TEXT;
