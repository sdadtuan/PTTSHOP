-- Gợi ý. Quan hệ tay và ngưỡng "bán chạy" để trống. Không ghi tỷ lệ.
CREATE TABLE "ProductRelation" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "relatedId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProductRelation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductRelation_productId_relatedId_key" ON "ProductRelation"("productId", "relatedId");
CREATE INDEX "ProductRelation_productId_idx" ON "ProductRelation"("productId");
ALTER TABLE "ProductRelation" ADD CONSTRAINT "ProductRelation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductRelation" ADD CONSTRAINT "ProductRelation_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "RecommendationSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "bestsellerMinOrders" INTEGER,
  CONSTRAINT "RecommendationSettings_pkey" PRIMARY KEY ("id")
);
