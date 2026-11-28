CREATE TABLE "MessageSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "znsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "cartReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  "reminderAfterHours" INTEGER,
  "reminderMaxTimes" INTEGER,
  CONSTRAINT "MessageSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "MessageSettings" ("id") VALUES ('default') ON CONFLICT ("id") DO NOTHING;

CREATE TABLE "NotificationLog" (
  "id" TEXT NOT NULL,
  "orderId" TEXT,
  "cartId" TEXT,
  "channel" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "phoneMask" TEXT,
  "emailMask" TEXT,
  "detail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NotificationLog_orderId_idx" ON "NotificationLog"("orderId");
CREATE INDEX "NotificationLog_cartId_idx" ON "NotificationLog"("cartId");
