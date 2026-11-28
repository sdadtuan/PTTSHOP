ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'VIETQR';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'MOMO';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'ZALOPAY';

ALTER TABLE "PaymentSettings" ADD COLUMN "vietqrEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PaymentSettings" ADD COLUMN "vietqrMerchantId" TEXT;
ALTER TABLE "PaymentSettings" ADD COLUMN "momoEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PaymentSettings" ADD COLUMN "momoPartnerCode" TEXT;
ALTER TABLE "PaymentSettings" ADD COLUMN "zalopayEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PaymentSettings" ADD COLUMN "zalopayAppId" TEXT;

CREATE TABLE "PaymentTransaction" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerTxnId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PaymentTransaction_provider_providerTxnId_key" ON "PaymentTransaction"("provider", "providerTxnId");
CREATE INDEX "PaymentTransaction_orderId_idx" ON "PaymentTransaction"("orderId");
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
