-- Lookbook. Nháp mặc định. Không tạo look mẫu.
CREATE TABLE "Look" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Look_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Look_slug_key" ON "Look"("slug");

CREATE TABLE "LookItem" (
  "id" TEXT NOT NULL,
  "lookId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "LookItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LookItem_lookId_idx" ON "LookItem"("lookId");
ALTER TABLE "LookItem" ADD CONSTRAINT "LookItem_lookId_fkey" FOREIGN KEY ("lookId") REFERENCES "Look"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LookItem" ADD CONSTRAINT "LookItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
