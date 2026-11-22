# 03 · GĐ1 MVP — SẢN PHẨM, KHO, GIÁ SÀN, HÀNG HIỆU (W10–W13, W20)

> Dán sau prompt 00. Điều kiện bắt đầu: P0 (01) đã xong và đã deploy. Căn cứ: Đặc tả chức năng v1.1 M02, M03, M04, M07, M12, M13; BR-01…07, BR-14…16; Phân tích hệ thống v1.1 mục Mô hình dữ liệu.

## Mục tiêu
Có catalog thật của PTT (nam, nữ, giày dép, phụ kiện) với biến thể màu × size, bảng size, ảnh có nguồn hợp lệ, tồn kho theo kho. Mọi giá bán đều ≥ giá sàn. **PTT không bán lỗ.**

## Bối cảnh
- Mô hình sản phẩm hiện tại đơn giản: chưa có giá vốn, giá sàn, nguồn hàng, thương hiệu, kho.
- Công thức giá sàn (BR-01):
  - giá sàn chưa VAT: G = (C + S + P + F) / (1 − f − r − a − m);
  - giá niêm yết = G × (1 + VAT), làm tròn lên 1.000đ.
  - Mặc định đề xuất m = 15%, r = 5%; a và VAT [cần chốt].
- Ảnh chỉ được dùng khi PTT tự chụp hoặc NCC cho phép bằng văn bản (BR-16).
- Hàng hiệu chỉ được bán khi có hồ sơ hàng thật (BR-14).

## Việc cần làm (nhánh `feat/mvp-catalog`, mỗi mục một commit)
1. **W10 · Mở rộng mô hình dữ liệu**, migration không phá dữ liệu:
   - Category nhiều cấp;
   - Brand (cho phép bán online: Có / Không / Chưa rõ);
   - Product: chất liệu, form, xuất xứ, trạng thái Nháp / Đang bán / Tạm ẩn / Ngừng bán, nguồn hàng Kho / Dropship / Hỗn hợp;
   - Variant (SKU, màu, size, giá, giá gạch, giá vốn, khối lượng);
   - ProductImage (nguồn ảnh, văn bản cho phép);
   - SizeChart;
   - Warehouse, StockLevel (tồn thực, đang giữ, tồn an toàn);
   - PricingRule (m, r, a, VAT, S, P, phạm vi);
   - AuthenticityDoc;
   - AuditLog nếu chưa có.

   Viết trên schema hiện tại; nếu đã chuyển PostgreSQL (prompt 08) thì viết trên PostgreSQL.
2. **W11 · Quản trị sản phẩm** (FR-201…208): danh mục, sản phẩm, biến thể, ảnh theo màu, bảng size, nhập / xuất file. Lưu ảnh mà thiếu nguồn hợp lệ thì chặn đăng bán (BR-16).
3. **W12 · Kho** (FR-701…704):
   - phiếu nhập theo PO, ghi lô và giá vốn;
   - kiểm kê có lý do và người duyệt;
   - cảnh báo tồn thấp;
   - tồn khả dụng theo BR-07;
   - giữ hàng tạm (BR-05, đề xuất 15 phút [cần chốt]).
4. **W13 · Giá sàn và voucher** (FR-1201…1204, FR-401…405, BR-02, BR-03):
   - tính giá sàn ở máy chủ;
   - từ chối lưu giá < giá sàn, ở cả nhập tay, nhập file và đồng bộ;
   - voucher không được làm giá dòng < giá sàn (TC-02);
   - màn hình mô phỏng giá;
   - chỉ vai trò được phép mới xem giá vốn.
5. **W20 · Hàng hiệu** (FR-1301…1305, BR-14, BR-15):
   - hồ sơ hàng thật lưu riêng tư;
   - chặn trạng thái "Đang bán" khi thiếu hồ sơ (TC-10);
   - lọc từ khoá cấm ("auth", "rep 1:1", "like auth"…);
   - chức năng ẩn khẩn trong 24 giờ.
6. **M03 · Tìm kiếm, lọc** (FR-301…304): lọc theo size, màu, giá, thương hiệu; tìm không dấu; SEO cho trang danh mục.

## Tiêu chí chấp nhận
- Kiểm thử tự động cho công thức giá sàn (ít nhất 5 bộ số, có làm tròn), BR-02, BR-03 (TC-02), BR-14 (TC-10), BR-07.
- Migration chạy được trên bản sao CSDL (không chạy trên production) và không mất dữ liệu.
- Nhật ký ghi mọi thay đổi giá và tồn (BR-19).

## Dừng lại và hỏi
- Các tham số m, r, a, VAT, P, S mặc định; danh mục cấp 1–2; bảng size chuẩn [cần chốt].
- Trước mọi migration trên VPS: sao lưu, rồi chờ "OK deploy".
- Nếu cần đổi kiểu dữ liệu làm mất dữ liệu cũ.
