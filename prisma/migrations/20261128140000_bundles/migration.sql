-- Combo. Không seed gói. Nháp không bán. Cột giỏ và đơn chỉ thêm, không sửa dữ liệu cũ.
CREATE TABLE "BundleSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "outOfStockMode" TEXT NOT NULL DEFAULT 'HIDE',
  "stackCoupon" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "BundleSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Bundle" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "priceMode" TEXT NOT NULL,
  "priceVnd" INTEGER,
  "percentOff" INTEGER,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Bundle_slug_key" ON "Bundle"("slug");

CREATE TABLE "BundleItem" (
  "id" TEXT NOT NULL,
  "bundleId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BundleItem_bundleId_productId_key" ON "BundleItem"("bundleId", "productId");
CREATE INDEX "BundleItem_productId_idx" ON "BundleItem"("productId");
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem" ADD COLUMN "bundleId" TEXT;
CREATE INDEX "CartItem_bundleId_idx" ON "CartItem"("bundleId");
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order" ADD COLUMN "bundleDiscount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "bundleId" TEXT;
