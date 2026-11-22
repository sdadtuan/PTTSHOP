# 02 · P0 — PHÁP LÝ VÀ NỘI DUNG (W06–W08)

> Dán sau prompt 00. Làm song song được với 01, sau khi xong P0-1 (sao lưu). Căn cứ: Đặc tả chức năng v1.1 M20 (FR-2001…2004), FR-1503, FR-1403, mục "Yêu cầu nội dung các trang pháp lý"; Kế hoạch triển khai W06–W08.

## Mục tiêu
Website có đủ thông tin doanh nghiệp và bộ chính sách để nộp hồ sơ thông báo website TMĐT bán hàng theo NĐ 248/2026 (W08). Phải có ghi nhận đồng ý xử lý dữ liệu cá nhân và đồng ý cookie. Không còn nội dung mẫu (VIZFAS, đánh giá gán sẵn).

## Bối cảnh
- Doanh nghiệp: CÔNG TY TNHH GIẢI PHÁP QUẢNG CÁO PTT.
  - MST 0319378318, ngày cấp 23/01/2026, nơi cấp [cần chốt].
  - Trụ sở: Số 73 Đường Tạ Hiện, Phường Cát Lái, TP. Hồ Chí Minh.
  - Người đại diện: Trương Quốc Tuấn. Hotline, email [cần chốt].
- Chưa nhận đơn thật trước khi:
  - bổ sung ngành nghề 4771, 4791 (4641 nếu bán sỉ) (W07);
  - có xác nhận thông báo website (W08).
- Nội dung chính sách do Cursor soạn **bản nháp**. Luật sư rà là đề xuất [cần chốt]. Anh Tuấn duyệt trước khi đăng.

## Việc cần làm (nhánh `feat/phap-ly`, mỗi mục một commit)

1. **Chân trang doanh nghiệp (FR-2003).**
   - Thành phần dùng chung, đọc từ một tệp cấu hình nội dung, không rải trong mã.
   - Hiển thị trên mọi trang: tên công ty, MST, ngày / nơi cấp, địa chỉ, người đại diện, hotline, email, liên kết các chính sách.
   - Chỗ chưa có dữ liệu thì để `[cần chốt]` trong bản nháp và báo lại, không bịa.
2. **Trang chính sách (FR-1403)** dạng trang nội dung tĩnh, quản trị sửa được. Mỗi trang có ngày hiệu lực.
   | Đường dẫn đề xuất | Nội dung bắt buộc | Căn cứ |
   |---|---|---|
   | `/chinh-sach-bao-mat` | Mục đích, phạm vi thu thập, thời gian lưu, bên nhận (hãng vận chuyển, NCC, cổng thanh toán, hoá đơn), quyền của khách, liên hệ, chuyển dữ liệu ra nước ngoài | NĐ 248/2026 Đ5; Luật 91/2025; NĐ 356/2025 |
   | `/dieu-khoan` | Điều kiện giao dịch chung, xác lập hợp đồng, giá đã gồm VAT, phí ship riêng, giới hạn trách nhiệm | NĐ 248/2026 Đ8, Đ9 |
   | `/chinh-sach-thanh-toan` | Phương thức, thời hạn, hoàn tiền | NĐ 248/2026 Đ10 |
   | `/chinh-sach-giao-hang` | Phạm vi, thời gian, phí, đồng kiểm, giao thất bại, giao nhiều kiện (dropship) | NĐ 248/2026 Đ13 |
   | `/chinh-sach-doi-tra` | BR-08…BR-13 bằng lời dễ hiểu, danh mục không đổi trả (BR-12) | NĐ 248/2026 Đ14; Luật BVQLNTD 19/2023 Đ37 |
   | `/khieu-nai` | Kênh tiếp nhận, thời hạn phản hồi, quy trình | NĐ 248/2026 Đ7 |
   | `/huong-dan-chon-size` | Bảng size theo nhóm, cách đo | — |

   Tham số chưa chốt thì để [cần chốt]: thời hạn đổi trả (đề xuất 7 ngày), ngưỡng miễn phí ship, thời gian giao.
3. **Đồng ý dữ liệu cá nhân (FR-2001, FR-2002).**
   - Ô đồng ý theo từng mục đích (giao hàng, hoá đơn: bắt buộc; tiếp thị: tuỳ chọn) tại thanh toán và đăng ký.
   - Lưu bảng `Consent` (người / email, mục đích, phiên bản chính sách, thời điểm, IP).
   - Trang / form yêu cầu xem, sửa, xoá, rút đồng ý; quản trị xử lý và ghi thời điểm.
   - Schema mới thì tạo migration không phá dữ liệu.
4. **Cookie (FR-1905).** Banner đồng ý. Khi khách từ chối thì không tải thẻ đo lường không thiết yếu (TC-12).
5. **Gỡ nội dung mẫu ở mức mã nguồn.** Xoá nội dung VIZFAS, ảnh Unsplash, khối đánh giá gán sẵn (FR-1503) khỏi mã, hằng số, tệp seed. **Dữ liệu trong `prod.db` chỉ gỡ theo danh sách anh đã duyệt ở P0-7.**
6. **Bộ hồ sơ W07, W08.** Soạn `docs/ho-so-thong-bao-website.md`:
   - danh sách thông tin cần khai cho hồ sơ thông báo website (Mẫu 01) theo NĐ 248/2026;
   - đường dẫn từng chính sách, ảnh chụp màn hình cần có;
   - việc anh tự làm trên cổng của Bộ Công Thương.

   Mẫu biểu, cổng nộp và điều khoản chính xác: đối chiếu văn bản gốc trên cổng chính thức, ghi nguồn; chỗ chưa xác minh được thì để [cần chốt].
7. **Logo xác nhận (FR-2004).** Chuẩn bị vị trí ở chân trang, ẩn cho tới khi có mã xác nhận.

## Tiêu chí chấp nhận
- Mọi trang đều có chân trang đủ thông tin, hoặc ghi rõ [cần chốt].
- 7 trang chính sách truy cập được và có trong sitemap.
- Đặt hàng thử ghi được `Consent`.
- Từ chối cookie thì không có request tới GA4 / Meta (TC-12).
- `grep` repo không còn "VIZFAS".
- Build thành công; có commit cho từng mục; báo cáo theo mẫu.

## Dừng lại và hỏi
- Trước khi đăng chính sách lên production: anh duyệt nội dung, rồi nói "OK deploy".
- Khi gặp thông tin pháp lý chưa xác minh được (nơi cấp, hotline, email, thời hạn, phí).
- Trước khi xoá bất kỳ dữ liệu nào trong CSDL.
