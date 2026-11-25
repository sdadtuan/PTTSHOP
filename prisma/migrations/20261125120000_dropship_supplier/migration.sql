-- Dropship: chỉ thêm cột và bảng. Không sửa dữ liệu cũ.

ALTER TABLE "ProductVariant" ADD COLUMN "safetyStock" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "ProductVariant" ADD COLUMN "isPurchasable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "OrderItem" ADD COLUMN "supplierQty" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "supplierId" TEXT;
ALTER TABLE "Shipment" ADD COLUMN "fulfillmentSource" TEXT;

CREATE TABLE "FloorSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "manualFloor" INTEGER,
    "marginBps" INTEGER NOT NULL DEFAULT 1500,
    "returnBps" INTEGER NOT NULL DEFAULT 500,
    "adsBps" INTEGER NOT NULL DEFAULT 0,
    "feeBps" INTEGER NOT NULL DEFAULT 0,
    "vatBps" INTEGER NOT NULL DEFAULT 0,
    "shippingCost" INTEGER NOT NULL DEFAULT 0,
    "paymentCost" INTEGER NOT NULL DEFAULT 0,
    "fixedCost" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FloorSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxCode" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "connectionType" TEXT NOT NULL,
    "sheetUrl" TEXT,
    "slaHours" INTEGER NOT NULL DEFAULT 48,
    "warnHours" INTEGER NOT NULL DEFAULT 24,
    "syncEveryHours" INTEGER NOT NULL DEFAULT 24,
    "lastSyncAt" TIMESTAMP(3),
    "contractRef" TEXT,
    "contractExpiresAt" TIMESTAMP(3),
    "imageLicense" TEXT NOT NULL DEFAULT 'NONE',
    "imageLicenseNote" TEXT,
    "imageLicenseExpiresAt" TIMESTAMP(3),
    "paysReturnFee" BOOLEAN,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

CREATE TABLE "SupplierSku" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "supplierSku" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "costPrice" INTEGER NOT NULL,
    "supplierStock" INTEGER NOT NULL,
    "safetyStock" INTEGER NOT NULL DEFAULT 2,
    "stockUpdatedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "SupplierSku_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupplierSku_supplierId_supplierSku_key" ON "SupplierSku"("supplierId", "supplierSku");
CREATE UNIQUE INDEX "SupplierSku_supplierId_variantId_key" ON "SupplierSku"("supplierId", "variantId");

CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT,
    "source" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "rowsRead" INTEGER NOT NULL DEFAULT 0,
    "rowsChanged" INTEGER NOT NULL DEFAULT 0,
    "rowsErrored" INTEGER NOT NULL DEFAULT 0,
    "errorDetail" TEXT,
    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "supplierId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "trackingCode" TEXT,
    "slaDueAt" TIMESTAMP(3),
    "warnAt" TIMESTAMP(3),
    "warnedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "fileName" TEXT,
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupplierOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupplierOrder_poNumber_key" ON "SupplierOrder"("poNumber");
CREATE UNIQUE INDEX "SupplierOrder_shipmentId_key" ON "SupplierOrder"("shipmentId");

CREATE TABLE "SupplierDebit" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierOrderId" TEXT,
    "returnRequestId" TEXT,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupplierDebit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SupplierSku" ADD CONSTRAINT "SupplierSku_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierSku" ADD CONSTRAINT "SupplierSku_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupplierOrder" ADD CONSTRAINT "SupplierOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierOrder" ADD CONSTRAINT "SupplierOrder_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupplierOrder" ADD CONSTRAINT "SupplierOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierDebit" ADD CONSTRAINT "SupplierDebit_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierDebit" ADD CONSTRAINT "SupplierDebit_supplierOrderId_fkey" FOREIGN KEY ("supplierOrderId") REFERENCES "SupplierOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupplierDebit" ADD CONSTRAINT "SupplierDebit_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
