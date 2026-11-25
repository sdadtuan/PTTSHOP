-- Tăng trưởng đợt 1: chỉ thêm bảng. Không sửa dòng đánh giá hay sản phẩm đang có.

CREATE TABLE "SlugRedirect" (
    "id" TEXT NOT NULL,
    "fromSlug" TEXT NOT NULL,
    "toSlug" TEXT NOT NULL,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SlugRedirect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SlugRedirect_fromSlug_key" ON "SlugRedirect"("fromSlug");
CREATE INDEX "SlugRedirect_toSlug_idx" ON "SlugRedirect"("toSlug");

CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnalyticsEvent_orderNumber_channel_eventName_key" ON "AnalyticsEvent"("orderNumber", "channel", "eventName");
CREATE INDEX "AnalyticsEvent_eventId_idx" ON "AnalyticsEvent"("eventId");
