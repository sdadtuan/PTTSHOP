-- Thêm hoá đơn điện tử. Không cập nhật đơn đang có.
CREATE TABLE "InvoiceSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "provider" TEXT,
    "autoIssueEnabled" BOOLEAN,
    "issueTrigger" TEXT,
    "templateCode" TEXT,
    "invoiceSeries" TEXT,
    "vatRate" INTEGER,
    "sellerName" TEXT,
    "sellerTaxCode" TEXT,
    "sellerAddress" TEXT,
    "maxRetries" INTEGER,
    "retryBaseMinutes" INTEGER
);

CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentInvoiceId" TEXT,
    "originalOrderKey" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "buyerKind" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerTaxCode" TEXT,
    "buyerAddress" TEXT,
    "buyerEmail" TEXT,
    "linesJson" TEXT NOT NULL,
    "vatRate" INTEGER NOT NULL,
    "subtotalAmount" INTEGER NOT NULL,
    "vatAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "provider" TEXT,
    "providerInvoiceId" TEXT,
    "invoiceNumber" TEXT,
    "templateCode" TEXT,
    "invoiceSeries" TEXT,
    "lookupCode" TEXT,
    "lookupUrl" TEXT,
    "issuedAt" DATETIME,
    "adjustmentReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" DATETIME,
    "lastError" TEXT,
    "needsAccountantAttention" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_parentInvoiceId_fkey" FOREIGN KEY ("parentInvoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Invoice_originalOrderKey_key" ON "Invoice"("originalOrderKey");
CREATE UNIQUE INDEX "Invoice_idempotencyKey_key" ON "Invoice"("idempotencyKey");

CREATE TABLE "InvoiceAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "actorId" TEXT,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceAuditLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
