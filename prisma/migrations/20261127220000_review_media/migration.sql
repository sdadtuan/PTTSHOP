ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_userId_productId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Review_orderId_productId_key" ON "Review"("orderId", "productId");

CREATE TABLE IF NOT EXISTS "ReviewMedia" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "mime" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewMedia_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ReviewMedia_reviewId_idx" ON "ReviewMedia"("reviewId");
ALTER TABLE "ReviewMedia" DROP CONSTRAINT IF EXISTS "ReviewMedia_reviewId_fkey";
ALTER TABLE "ReviewMedia" ADD CONSTRAINT "ReviewMedia_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
