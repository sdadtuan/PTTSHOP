# Bộ sản phẩm DEMO — PTT Shop (pttshop.vn)

Đây là **hàng DEMO để kiểm thử hệ thống**: nhập file CSV/Excel, tồn kho, hết hàng, tồn thấp, giá bán / giá gốc / giá nhập, và hiển thị ảnh theo màu. **Không phải hàng bán thật**, không dùng để mở bán chính thức.

Ngày tạo: 22/11/2026 (giờ Việt Nam, UTC+7).

## Cách nhận biết và gỡ bỏ

Mọi bản ghi trong bộ này đều gắn tiền tố cố định. Khi test xong, lọc rồi xóa theo một trong các dấu hiệu sau:

| Vị trí | Tiền tố | Ví dụ |
|---|---|---|
| Tên sản phẩm | `[DEMO] ` | `[DEMO] Áo Thun Nam Cotton Basic` |
| SKU | `DEMO-` | `DEMO-AT-NAVY-XL` |
| Đường dẫn (slug) | `demo-` | `demo-ao-thun-nam-cotton-basic` |
| Tên file ảnh | `demo-` | `demo-ao-thun-nam-navy.jpg` |

Ảnh còn có huy hiệu đỏ **DEMO** góc trên bên trái. Xóa hết biến thể (và sản phẩm cha) có các tiền tố trên, đồng thời gỡ các file trong `images/`.

## Thành phần thư mục

```
demo-products/
├── README.md                 ← file này
├── demo-products.xlsx        ← 3 sheet: Bien the, San pham, Luu y
├── demo-products.csv         ← UTF-8 có BOM, cùng cột với sheet Bien the
├── images/                   ← 34 ảnh JPG, mỗi màu một ảnh
│   └── SOURCES.md            ← nguồn và giấy phép từng ảnh
└── (bản nén: demo-products.zip)
```

## Số lượng

| Danh mục | Số sản phẩm | Số biến thể (size × màu) |
|---|---:|---:|
| Nam | 4 | 36 |
| Nữ | 4 | 36 |
| Giày | 4 | 40 |
| Phụ kiện | 3 | 8 |
| **Tổng** | **15** | **120** |

- Nam (4): áo thun, sơ mi, quần jean, áo khoác bomber.
- Nữ (4): đầm, áo kiểu, quần ống rộng, chân váy chữ A.
- Giày (4): sneaker nam, sneaker nữ, sandal nữ, giày tây nam.
- Phụ kiện (3): túi đeo chéo mini, thắt lưng nam, mũ bucket.

Size quần áo: S / M / L / XL. Giày nam: 39–43. Giày nữ: 35–39. Phụ kiện: Free size.

## Danh sách sản phẩm

- **[DEMO] Áo Thun Nam Cotton Basic** (`demo-ao-thun-nam-cotton-basic`) — Nam; màu: Trắng, Đen, Navy; size: S, M, L, XL; 12 biến thể; giá 249.000 đ (gốc 299.000 đ); hết hàng: DEMO-AT-NAVY-XL.
- **[DEMO] Áo Sơ Mi Nam Oxford** (`demo-ao-so-mi-nam-oxford`) — Nam; màu: Trắng, Xanh nhạt; size: S, M, L, XL; 8 biến thể; giá 349.000 đ (gốc 399.000 đ); hết hàng: —.
- **[DEMO] Quần Jean Nam Slim Fit** (`demo-quan-jean-nam-slim-fit`) — Nam; màu: Xanh đậm, Đen; size: S, M, L, XL; 8 biến thể; giá 449.000 đ; hết hàng: DEMO-QJ-DEN-S.
- **[DEMO] Áo Khoác Nam Bomber** (`demo-ao-khoac-nam-bomber`) — Nam; màu: Đen, Olive; size: S, M, L, XL; 8 biến thể; giá 599.000 đ (gốc 749.000 đ); hết hàng: —.
- **[DEMO] Đầm Nữ Dáng Ôm** (`demo-dam-nu-dang-om`) — Nữ; màu: Đen, Kem, Hồng; size: S, M, L, XL; 12 biến thể; giá 399.000 đ (gốc 499.000 đ); hết hàng: DEMO-DAM-HONG-XL.
- **[DEMO] Áo Kiểu Nữ Cổ V** (`demo-ao-kieu-nu-co-v`) — Nữ; màu: Trắng, Hồng; size: S, M, L, XL; 8 biến thể; giá 299.000 đ; hết hàng: —.
- **[DEMO] Quần Ống Rộng Nữ Linen** (`demo-quan-ong-rong-nu-linen`) — Nữ; màu: Be, Đen; size: S, M, L, XL; 8 biến thể; giá 379.000 đ (gốc 449.000 đ); hết hàng: —.
- **[DEMO] Chân Váy Chữ A Nữ** (`demo-chan-vay-chu-a-nu`) — Nữ; màu: Đen, Be; size: S, M, L, XL; 8 biến thể; giá 279.000 đ; hết hàng: —.
- **[DEMO] Giày Sneaker Nam Classic** (`demo-giay-sneaker-nam-classic`) — Giày; màu: Trắng, Đen; size: 39, 40, 41, 42, 43; 10 biến thể; giá 549.000 đ (gốc 649.000 đ); hết hàng: DEMO-SN-NAM-TRANG-43.
- **[DEMO] Giày Sneaker Nữ Pastel** (`demo-giay-sneaker-nu-pastel`) — Giày; màu: Trắng, Hồng; size: 35, 36, 37, 38, 39; 10 biến thể; giá 499.000 đ (gốc 599.000 đ); hết hàng: —.
- **[DEMO] Sandal Nữ Quai Ngang** (`demo-sandal-nu-quai-ngang`) — Giày; màu: Nâu, Đen; size: 35, 36, 37, 38, 39; 10 biến thể; giá 329.000 đ; hết hàng: —.
- **[DEMO] Giày Tây Nam Da Trơn** (`demo-giay-tay-nam-da-tron`) — Giày; màu: Đen, Nâu; size: 39, 40, 41, 42, 43; 10 biến thể; giá 699.000 đ (gốc 849.000 đ); hết hàng: —.
- **[DEMO] Túi Đeo Chéo Mini** (`demo-tui-deo-cheo-mini`) — Phụ kiện; màu: Đen, Nâu, Be; size: Free size; 3 biến thể; giá 399.000 đ (gốc 499.000 đ); hết hàng: —.
- **[DEMO] Thắt Lưng Nam Da Trơn** (`demo-that-lung-nam-da-tron`) — Phụ kiện; màu: Đen, Nâu; size: Free size; 2 biến thể; giá 249.000 đ; hết hàng: —.
- **[DEMO] Mũ Bucket Trơn** (`demo-mu-bucket-tron`) — Phụ kiện; màu: Đen, Be, Navy; size: Free size; 3 biến thể; giá 199.000 đ; hết hàng: —.

## Biến thể hết hàng (stock = 0)

Dùng để kiểm tra chặn đặt hàng khi hết size/màu:

- `DEMO-AT-NAVY-XL` — [DEMO] Áo Thun Nam Cotton Basic, màu Navy, size XL
- `DEMO-QJ-DEN-S` — [DEMO] Quần Jean Nam Slim Fit, màu Đen, size S
- `DEMO-DAM-HONG-XL` — [DEMO] Đầm Nữ Dáng Ôm, màu Hồng, size XL
- `DEMO-SN-NAM-TRANG-43` — [DEMO] Giày Sneaker Nam Classic, màu Trắng, size 43

## Biến thể tồn thấp (stock = 1 hoặc 2)

Dùng để kiểm tra cảnh báo sắp hết hàng:

- `DEMO-AT-TRANG-S` — [DEMO] Áo Thun Nam Cotton Basic, màu Trắng, size S, tồn 2
- `DEMO-SM-XANHNHAT-XL` — [DEMO] Áo Sơ Mi Nam Oxford, màu Xanh nhạt, size XL, tồn 1
- `DEMO-DAM-DEN-S` — [DEMO] Đầm Nữ Dáng Ôm, màu Đen, size S, tồn 2
- `DEMO-SN-NU-HONG-35` — [DEMO] Giày Sneaker Nữ Pastel, màu Hồng, size 35, tồn 1
- `DEMO-GT-NAU-43` — [DEMO] Giày Tây Nam Da Trơn, màu Nâu, size 43, tồn 2
- `DEMO-TUI-BE-FS` — [DEMO] Túi Đeo Chéo Mini, màu Be, size Free size, tồn 1

Các biến thể còn lại có tồn từ 3 đến 24.

## Giá

- `price_vnd`: giá bán, mức trung cấp thị trường Việt Nam (áo thun 249.000 đ, giày tây 699.000 đ, …).
- `compare_at_price_vnd`: giá gốc (gạch ngang). Một số sản phẩm có giảm giá, một số để trống (không khuyến mãi) để test cả hai trường hợp.
- `cost_vnd`: giá nhập, khoảng 50–60% giá bán, chỉ dành cho trang quản trị.

Cột `status` đang để `active` để nhập vào hệ thống là test được ngay. Nếu chỉ muốn nhập mà chưa hiện trên cửa hàng, đổi thành `draft` trước khi nhập.

## Ảnh

- Mỗi màu có một file JPG riêng, khoảng 1200×1500 px, dưới 300 KB.
- Nguồn: ảnh stock giấy phép **Pexels License** (dùng thương mại được), đã tải về thư mục `images/`, không hotlink. Chi tiết từng file nằm trong `images/SOURCES.md`.
- Cột `image_file` chỉ ghi tên file (ví dụ `demo-ao-thun-nam-trang.jpg`), đường dẫn tương đối tới thư mục `images/`.

## Cách dùng

1. Giữ nguyên cấu trúc thư mục khi gửi cho Cursor hoặc tải lên trang quản trị.
2. Khi tính năng nhập CSV/Excel đã có: dùng `demo-products.csv` hoặc sheet **Bien the** trong file Excel (cùng cột). Ảnh upload theo tên trong cột `image_file`.
3. Sau khi nhập, kiểm tra:
   - Lọc sản phẩm theo `[DEMO]` hoặc slug `demo-`.
   - Đặt hàng một SKU hết hàng — hệ thống phải chặn.
   - SKU tồn 1–2 hiện cảnh báo tồn thấp (nếu đã làm tính năng này).
   - Sản phẩm có `compare_at_price_vnd` hiện giá gạch ngang.
   - Đổi màu thì đổi đúng ảnh.
4. Khi đã có hàng thật và xong kiểm thử: gỡ toàn bộ bản ghi có tiền tố DEMO như mục đầu.

## Không làm gì với bộ này

- Không đăng bán công khai như hàng thật.
- Không trộn vào báo cáo doanh thu / tồn kho thật mà không lọc tiền tố DEMO.
- Không xóa các sản phẩm demo *cũ* đang có trên production (VIZFAS) bằng bộ này — bộ này là bộ *mới*, tách biệt, chỉ để test luồng nhập hàng.
