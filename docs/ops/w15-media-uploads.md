# W15 · Ảnh admin `/media/uploads`

## Vì sao production lúc 14:45 vẫn trả `/uploads/…`

`git -c safe.directory=/var/www/pttshop -C /var/www/pttshop rev-parse HEAD` = `929343c4ca3e50032809150d02b4dfac0d897d39`.

Cây nguồn và bản build trên đĩa đã có code mới: chunk `.next/server/chunks` chứa `media/uploads`. `src/app/icon.png` và `src/app/apple-icon.png` có trên đĩa từ 07:38 UTC.

Tiến trình đang phục vụ thì không phải bản đó:

- `pttshop.service` `MainPID` 651549, con `next-server` (v16.4.6) PID 651568, khởi động **06:39:33 UTC** (13:39 giờ Việt Nam).
- File route build `.next/server/app/api/upload/route.js` có mtime **07:40:26 UTC** (14:40 giờ Việt Nam), sau lúc tiến trình khởi động.
- `next start` nạp build lúc khởi động. Build lại mà không restart thì request vẫn do tiến trình cũ xử lý, nên ô Logo vẫn nhận `/uploads/1795419890588-5ca142de.png`.

Nginx: file `/etc/nginx/sites-available/pttshop.vn` đã có `location /media/uploads/` (mtime 07:16 UTC, bản sao `/var/backups/pttshop/pttshop.vn-20261123-071604`). Master Nginx khởi động **21 Nov 06:20 UTC**, chưa reload. Vì vậy `/media/uploads/1795419890588-5ca142de.png` cũng 404: file đó không nằm trong `data/media/uploads/`, và location mới chưa được nạp.

`/icon.png` và `/apple-icon.png` trên production trả 404. `/favicon.ico` trả 200 (favicon cũ đã có trong tiến trình đang chạy).

## Đường upload admin

Một hàm ghi: `storeAdminUpload` trong `src/lib/admin-upload.ts`. Route `POST /api/upload` chỉ gọi hàm đó.

Mọi nút tải ảnh/video trong admin gọi `uploadAdminFile` (`src/lib/admin-upload-client.ts`), cùng hằng `ADMIN_UPLOAD_PATH = "/api/upload"`:

- `/admin/giao-dien` — ô Logo (`cms-logo-upload`) và các ô ảnh CMS
- `/admin/banners`
- `/admin/products` và trình sửa sản phẩm

Ảnh: kiểm tra byte như catalog, ghi `data/media/uploads/`, URL `/media/uploads/<tên>`. Video MP4/WebM vẫn ghi `public/uploads/` vì location Nginx chỉ phục vụ ảnh.

Nhập catalog CSV/Excel vẫn ghi `data/media/catalog/` (`/media/catalog/…`), không đi qua hàm này.

## Icon

`metadata.icons` trỏ `/icon.png` (512) và `/apple-icon.png` (180). Hai file cũng nằm trong `public/` để path đó có file tĩnh trong bản build. `src/app/favicon.ico`, `src/app/icon.png`, `src/app/apple-icon.png` giữ nguyên.

## File mồ côi — không xóa

- `/var/www/pttshop/public/uploads/1795417743892-a896b7a0.png`
- `/var/www/pttshop/public/uploads/1795419890588-5ca142de.png`
- `/var/www/pttshop/public/uploads/.gitkeep` (giữ thư mục, không phải ảnh tải lên)

## Khi deploy

Cần cả hai, sau câu **OK deploy**:

1. `nginx -t` đã đạt. Reload Nginx chỉ khi anh duyệt, để `/media/uploads/` được phục vụ từ `/var/www/pttshop/data/media/uploads/`.
2. Chạy `DEPLOY_BRANCH=feat/san-pham-kho-gia ./deploy/update.sh` từ `/var/www/pttshop`. Script build lại và restart `pttshop.service`. Không dùng `/root/pttshop-update.sh`. Không `db push`. Nhánh này không thêm migration.

Sau đó tải logo lại ở admin. URL mới phải bắt đầu bằng `/media/uploads/`.
