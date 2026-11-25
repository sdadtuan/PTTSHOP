-- Nháp đợt 2. Nằm ngoài prisma/migrations. Không chạy bằng migrate deploy.
-- SlugRedirect và AnalyticsEvent đã nằm trong prisma/migrations/20261125170000_growth_seo_measure.
-- Chỉ thêm bảng và cột. Không UPDATE, không DELETE.

CREATE TABLE "Combo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Combo_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Combo_slug_key" ON "Combo"("slug");

CREATE TABLE "ComboItem" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "ComboItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ComboItem_comboId_variantId_key" ON "ComboItem"("comboId", "variantId");

CREATE TABLE "Lookbook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lookbook_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Lookbook_slug_key" ON "Lookbook"("slug");

CREATE TABLE "LookbookItem" (
    "id" TEXT NOT NULL,
    "lookbookId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LookbookItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order" ADD COLUMN "carrierCost" INTEGER;
ALTER TABLE "Order" ADD COLUMN "paymentFee" INTEGER;
