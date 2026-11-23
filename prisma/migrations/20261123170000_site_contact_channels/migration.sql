-- Thêm kênh liên hệ. Không cập nhật dòng đang có, không đổi mã đơn.
ALTER TABLE "SiteSettings" ADD COLUMN "hotline" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "messengerUrl" TEXT;
