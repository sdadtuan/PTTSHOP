# Kế hoạch gỡ dữ liệu mẫu

Đọc lúc 22/11/2026 từ `prod.db`. Chưa xóa, chưa ẩn, chưa khóa thêm bản ghi nào. Mốc seed: 21/11/2026 11:51 giờ Việt Nam (04:51 UTC).

## Đề xuất

| Bảng | Id | Tên / tiêu đề | Lý do | Cách xử lý đề xuất |
|---|---|---|---|---|
| User | cmwpxkjeu0000h28s71d3bk0s | admin@pttshop.vn | Tài khoản demo seed, đã hạ CUSTOMER và khóa mật khẩu. Email trên prod.db chưa UPDATE trong W13b | Giữ khóa, không xóa |
| User | cmwpxkjio0001h28s0u23vf8j | khach@pttshop.vn | Tài khoản demo seed, đã hạ CUSTOMER và khóa mật khẩu. Email trên prod.db chưa UPDATE trong W13b | Giữ khóa, không xóa |
| Product | cmwpxkjl0000bh28sv33h87mo | Áo Thun Oversize | Seed 11:51 21/11/2026, ảnh Unsplash | Ẩn |
| Product | cmwpxkjoj001ch28sb0dz5cwc | Áo Thun Nam Basic | Seed 11:51 21/11/2026, ảnh Unsplash | Ẩn |
| Product | cmwpxkjqi0024h28s5sqt4pg0 | Áo Thun Nữ Basic | Seed 11:51 21/11/2026, ảnh Unsplash | Ẩn |
| Product | cmwpxkjtc002wh28s5sa607py | Áo Hoodie Essential Form Rộng | Seed 11:51 21/11/2026, ảnh Unsplash | Ẩn |
| Product | cmwpxkjzr004eh28s1tzd500u | Áo Khoác Bomber | Seed 11:51 21/11/2026, ảnh Unsplash | Ẩn |
| Product | cmwpxkk1e004uh28s29cd4aow | Áo Khoác Varsity | Seed 11:51 21/11/2026, ảnh Unsplash | Ẩn |
| Product | cmwpxkk2i0059h28svmvh5gzo | Quần Cargo Năng Động | Seed 11:51 21/11/2026, ảnh Unsplash | Ẩn |
| Product | cmwpxkk5y0061h28sbrvngtvp | Quần Kaki Năng Động | Seed 11:51 21/11/2026, ảnh Unsplash | Ẩn |
| Product | cmwpxkka9006sh28sj60nhdqe | Nón Baseball Classic | Seed 11:51 21/11/2026, ảnh Unsplash | Ẩn |
| Product | cmwpxkkbm0071h28s0bn7jkvi | Túi Đeo Chéo Mini | Seed 11:51 21/11/2026, ảnh Unsplash | Ẩn |
| Product | cmwpxkkcv0078h28ssli06igt | Áo Thun Raglan | Seed 11:51 21/11/2026, ảnh Unsplash | Ẩn |
| Product | cmwpxkkfs007rh28s858shnmy | Áo Polo Essential | Seed 11:51 21/11/2026, ảnh Unsplash | Ẩn |
| Category | cmwpxkjiy0002h28sx4qo9trh | Áo thun | Seed cùng mốc | Ẩn sau khi sản phẩm đã ẩn |
| Category | cmwpxkjja0003h28sh1ces1fl | Áo khoác | Seed cùng mốc | Ẩn sau khi sản phẩm đã ẩn |
| Category | cmwpxkjjr0004h28sriqsb8vf | Quần | Seed cùng mốc | Ẩn sau khi sản phẩm đã ẩn |
| Category | cmwpxkjjw0005h28sq7rsvpl8 | Phụ kiện | Seed cùng mốc | Ẩn sau khi sản phẩm đã ẩn |
| Category | cmwpxkjk10006h28sy38jb4yo | Hoodie | Seed cùng mốc | Ẩn sau khi sản phẩm đã ẩn |
| Collection | cmwpxkjk60007h28syg84sor7 | Essentials Collection | Seed cùng mốc | Ẩn |
| Coupon | cmwpxkjku0009h28szfs24bak | PTTSHOP10 | Mã giảm giá mẫu. Mã đang lưu trên prod.db chưa UPDATE trong W13b | Đã tắt `isActive` ngày 22/11/2026, không xóa |
| ProductImage | 19 dòng | Ảnh Unsplash | Toàn bộ ảnh sản phẩm đang trỏ `images.unsplash.com` | Ẩn theo sản phẩm, không xóa riêng |
| SiteSettings | default | PTT | Tên thương hiệu trong mã nguồn. Giá trị brandName trên production đổi trong cài đặt, không bằng migration | Đổi nội dung, không xóa dòng |
| StorefrontPage | 15 trang | Đánh giá, tin tức, về PTT, hỗ trợ, chính sách | Nội dung mẫu | Viết lại, không xóa |

Quyết định 22/11/2026: hai user demo giữ khóa, không xóa. Mã giảm giá mẫu đã tắt. 12 sản phẩm, 5 danh mục và 1 bộ sưu tập chưa đụng, sẽ ẩn khi nhập sản phẩm thật ở prompt 03. W13b không UPDATE các dòng này trên production.

## Giữ lại

- User `admin@pttshop.vn`, vai trò ADMIN, tạo 22/11/2026 11:55 giờ Việt Nam.
- Đơn hàng: 0. Đánh giá: 0. Bản tin: 0. Banner: 0.
- Không thấy bản ghi nào chứa «Kiểm tra deploy». Nếu xuất hiện sau, giữ lại, không đưa vào danh sách gỡ.

## Chân trang, chưa triển khai

Chân trang hiện lấy tên, địa chỉ, email và điện thoại từ `SiteSettings`. Bản thảo, chưa ghi vào database và chưa deploy:

- Tên doanh nghiệp: CÔNG TY TNHH GIẢI PHÁP QUẢNG CÁO PTT
- MST: 0319378318
- Dòng bản quyền: © năm hiện tại, CÔNG TY TNHH GIẢI PHÁP QUẢNG CÁO PTT
- Địa chỉ, email, điện thoại, giờ làm việc: [cần chốt]. Prompt 02 chưa có trong thư mục tài liệu đã giao.

## Cách chạy khi đã duyệt

Chỉ sau khi anh duyệt từng nhóm, có bản sao lưu mới, và nói rõ được chạy. Lệnh hiện tại từ chối `--apply`.

```bash
SAMPLE_DB_PATH=/var/www/pttshop/data/prod.db node scripts/plan-remove-sample-data.mjs --dry-run
```
