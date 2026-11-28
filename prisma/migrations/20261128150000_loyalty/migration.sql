-- Điểm, hạng, giới thiệu. Tắt mặc định. Không ghi tỷ lệ.
CREATE TABLE "LoyaltySettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "pointsPerAmount" INTEGER,
  "amountVnd" INTEGER,
  "earnOn" TEXT,
  "expireDays" INTEGER,
  "redeemCapPerOrder" INTEGER,
  "redeemVndPerPoint" INTEGER,
  "referralPointsEach" INTEGER,
  CONSTRAINT "LoyaltySettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoyaltyAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "referralCode" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LoyaltyAccount_userId_key" ON "LoyaltyAccount"("userId");
CREATE UNIQUE INDEX "LoyaltyAccount_referralCode_key" ON "LoyaltyAccount"("referralCode");
ALTER TABLE "LoyaltyAccount" ADD CONSTRAINT "LoyaltyAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LoyaltyLedger" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "orderId" TEXT,
  "delta" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoyaltyLedger_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LoyaltyLedger_idempotencyKey_key" ON "LoyaltyLedger"("idempotencyKey");
CREATE INDEX "LoyaltyLedger_accountId_idx" ON "LoyaltyLedger"("accountId");
CREATE INDEX "LoyaltyLedger_orderId_idx" ON "LoyaltyLedger"("orderId");
ALTER TABLE "LoyaltyLedger" ADD CONSTRAINT "LoyaltyLedger_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LoyaltyAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LoyaltyTier" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "minPoints" INTEGER NOT NULL,
  "benefit" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "LoyaltyTier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Referral" (
  "id" TEXT NOT NULL,
  "referrerUserId" TEXT NOT NULL,
  "referredUserId" TEXT NOT NULL,
  "orderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");
CREATE UNIQUE INDEX "Referral_orderId_key" ON "Referral"("orderId");

ALTER TABLE "Order" ADD COLUMN "loyaltyDiscount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "referralCode" TEXT;
