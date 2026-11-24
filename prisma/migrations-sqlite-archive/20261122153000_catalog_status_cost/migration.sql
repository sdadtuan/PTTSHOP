-- AlterTable
ALTER TABLE "Product" ADD COLUMN "saleStatus" TEXT NOT NULL DEFAULT 'SELLING';

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN "costPrice" INTEGER;
