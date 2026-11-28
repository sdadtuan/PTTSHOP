-- Outbox đơn sang CRM. Đồng bộ tắt đến khi có contract. Không gọi mạng.
ALTER TABLE "CrmSyncJob" ADD COLUMN "shopOrderId" TEXT;

CREATE UNIQUE INDEX "CrmSyncJob_shopOrderId_kind_key" ON "CrmSyncJob"("shopOrderId", "kind");

CREATE INDEX "CrmSyncJob_shopOrderId_idx" ON "CrmSyncJob"("shopOrderId");
