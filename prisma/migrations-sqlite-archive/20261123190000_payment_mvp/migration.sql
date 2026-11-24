-- Thêm thanh toán. Không cập nhật đơn đang có, không đổi mã đơn.
ALTER TABLE "Order" ADD COLUMN "paymentConfirmedAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "paymentConfirmedById" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentDueAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "provinceCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "provinceName" TEXT;
ALTER TABLE "Order" ADD COLUMN "wardCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "wardName" TEXT;
ALTER TABLE "Order" ADD COLUMN "invoiceCompanyName" TEXT;
ALTER TABLE "Order" ADD COLUMN "invoiceTaxCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "invoiceAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN "invoiceEmail" TEXT;
ALTER TABLE "Order" ADD COLUMN "payosOrderCode" INTEGER;
ALTER TABLE "Order" ADD COLUMN "payosQr" TEXT;

CREATE UNIQUE INDEX "Order_payosOrderCode_key" ON "Order"("payosOrderCode");

CREATE TABLE "PaymentSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "codEnabled" BOOLEAN,
    "codMaxAmount" INTEGER,
    "holdHours" INTEGER,
    "codConfirmHours" INTEGER,
    "bankBin" TEXT,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankAccountName" TEXT,
    "bankBranch" TEXT
);

CREATE TABLE "PaymentAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "action" TEXT,
    "actorId" TEXT,
    "amount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentAuditLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT,
    "orderNumber" TEXT,
    "amount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");
