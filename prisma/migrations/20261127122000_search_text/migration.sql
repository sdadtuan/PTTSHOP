-- Tìm kiếm không dấu và gõ sai nhẹ. Không ghi dữ liệu sản phẩm.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "Product" ADD COLUMN "searchText" TEXT;

CREATE INDEX "Product_searchText_trgm" ON "Product" USING gin ("searchText" gin_trgm_ops);

-- Không lưu IP, user agent hay thông tin cá nhân.
-- Dọn tay khi cần, giữ 90 ngày:
-- DELETE FROM "SearchEvent" WHERE "createdAt" < now() - interval '90 days';
CREATE TABLE "SearchEvent" (
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "normalized" TEXT NOT NULL,
  "parsedJson" TEXT,
  "resultCount" INTEGER NOT NULL DEFAULT 0,
  "targetSlug" TEXT,
  "sessionKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SearchEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SearchEvent_session_kind_created_idx" ON "SearchEvent"("sessionKey", "kind", "createdAt");
CREATE INDEX "SearchEvent_createdAt_idx" ON "SearchEvent"("createdAt");
