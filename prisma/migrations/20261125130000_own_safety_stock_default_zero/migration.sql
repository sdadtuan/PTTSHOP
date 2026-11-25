-- Kho riêng: mặc định tồn an toàn về 0. Cột đã thêm với default 2 nên dòng hiện có đang là 2.
-- Chỉ sửa cột safetyStock do migration trước ghi, không đụng tồn, giá hay đơn.

ALTER TABLE "ProductVariant" ALTER COLUMN "safetyStock" SET DEFAULT 0;

UPDATE "ProductVariant" SET "safetyStock" = 0 WHERE "safetyStock" = 2;
