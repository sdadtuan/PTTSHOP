-- Nháp bước 10. Nằm ngoài prisma/migrations. Không chạy bằng migrate deploy.
-- Chỉ thêm bảng và cột. Không UPDATE, không DELETE.

CREATE TABLE "SlugRedirect" (
    "id" TEXT NOT NULL,
    "fromSlug" TEXT NOT NULL,
    "toSlug" TEXT NOT NULL,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SlugRedirect_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SlugRedirect_fromSlug_key" ON "SlugRedirect"("fromSlug");

CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "orderNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AnalyticsEvent_eventId_key" ON "AnalyticsEvent"("eventId");
CREATE UNIQUE INDEX "AnalyticsEvent_orderNumber_eventName_key" ON "AnalyticsEvent"("orderNumber", "eventName");

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

-- Đợt 3, chỉ khi có hợp đồng. Chưa chạy cùng đợt 1.
-- ALTER TYPE "PaymentMethod" ADD VALUE 'VNPAY';

CREATE TABLE "ZnsOutbox" (
    "id" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SKIPPED_DISABLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ZnsOutbox_pkey" PRIMARY KEY ("id")
);
