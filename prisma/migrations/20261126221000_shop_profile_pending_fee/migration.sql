-- Thêm kênh Zalo và cờ bật chuyển khoản. Không ghi dữ liệu.
ALTER TABLE "SiteSettings" ADD COLUMN "zaloUrl" TEXT;
ALTER TABLE "PaymentSettings" ADD COLUMN "bankTransferEnabled" BOOLEAN;

-- Phí ship null = chưa báo phí. Đơn cũ giữ số đã lưu. Không UPDATE.
ALTER TABLE "Order" ALTER COLUMN "shippingFee" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "shippingFee" DROP NOT NULL;
