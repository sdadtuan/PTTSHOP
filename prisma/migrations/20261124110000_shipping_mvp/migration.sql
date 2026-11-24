-- Thêm vận chuyển. Không cập nhật đơn đang có.
CREATE TABLE "ShippingSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "freeShipThreshold" INTEGER,
    "fallbackFee" INTEGER,
    "intraProvinceFee" INTEGER,
    "interProvinceFee" INTEGER,
    "parcelWeightGrams" INTEGER,
    "warehouseProvinceCode" TEXT,
    "warehouseWardCode" TEXT,
    "warehouseAddress" TEXT,
    "senderName" TEXT,
    "senderPhone" TEXT,
    "defaultProvider" TEXT
);

CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "shipmentNumber" TEXT,
    "idempotencyKey" TEXT,
    "provider" TEXT,
    "trackingCode" TEXT,
    "status" TEXT,
    "shippingFee" INTEGER,
    "codAmount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");
CREATE UNIQUE INDEX "Shipment_idempotencyKey_key" ON "Shipment"("idempotencyKey");

CREATE TABLE "ShipmentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentId" TEXT,
    "orderItemId" TEXT,
    "quantity" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ShippingWebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT,
    "provider" TEXT,
    "shipmentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "ShippingWebhookEvent_eventId_key" ON "ShippingWebhookEvent"("eventId");

CREATE TABLE "CodReconcileSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CodReconcileLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT,
    "trackingCode" TEXT,
    "orderNumber" TEXT,
    "expectedAmount" INTEGER,
    "actualAmount" INTEGER,
    "result" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CodReconcileLine_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CodReconcileSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
