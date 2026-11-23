# 04 · GĐ1 MVP — ĐẶT HÀNG VÀ THANH TOÁN (W14 · M05)

> Dán sau prompt 00. Điều kiện bắt đầu: 03 xong (giá sàn, giữ hàng). Căn cứ: Đặc tả chức năng v1.1 M05 (FR-501…507), BR-03, BR-05, BR-06, BR-18, BR-20, mục Trạng thái (đơn, thanh toán), mục Đặc tả tích hợp.

## Mục tiêu
Khách đặt hàng không cần tài khoản. Thanh toán bằng **payOS (VietQR)** và **COD**. Trạng thái thanh toán chỉ đổi theo webhook đã kiểm chữ ký. VNPay để GĐ3 (prompt 10).

Lựa chọn cổng: payOS cho MVP là **đề xuất [cần chốt]**; ZaloPay / MoMo để giai đoạn sau. Viết theo lớp `PaymentProvider` để thêm cổng khác.

## Việc cần làm (nhánh `feat/mvp-thanh-toan`)
1. **Trang thanh toán** (FR-501): thông tin nhận hàng theo đơn vị hành chính mới, ghi chú, phương thức, ô đồng ý điều khoản và chính sách (nối với `Consent` ở prompt 02).
2. **Tạo đơn** (FR-502):
   - kiểm tra lại giá sàn và tồn ở máy chủ tại thời điểm tạo;
   - giữ hàng tạm (BR-05);
   - mã đơn duy nhất, không lộ số thứ tự (BR-20, định dạng [cần chốt]).
3. **payOS** (FR-503), theo tài liệu chính thức của payOS:
   - tạo link / mã VietQR;
   - webhook kiểm chữ ký, đúng số tiền, đúng mã đơn, xử lý **một lần** (bảng `WebhookEvent`, khoá theo id sự kiện) (BR-18, TC-03, TC-04);
   - hết thời gian giữ hàng thì huỷ đơn và giải phóng tồn (TC-05).
4. **COD** (FR-504): giữ tồn đến khi CSKH xác nhận; quá thời hạn thì cảnh báo (BR-06, thời hạn [cần chốt]).
5. **Trang kết quả** (FR-506): chỉ đọc trạng thái từ hệ thống, không tin tham số URL.
6. **Yêu cầu hoá đơn công ty** (FR-507): tên, MST, địa chỉ, email.
7. **Máy trạng thái** đơn và thanh toán theo Đặc tả (mục Trạng thái). Cấm chuyển trạng thái sai (FR-603).

## Biến môi trường (chỉ tên, anh tự đặt giá trị)
`PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`. Không ghi giá trị vào mã, log hay báo cáo.

## Tiêu chí chấp nhận
- TC-03 (sai chữ ký thì từ chối), TC-04 (gửi trùng chỉ xử lý 1 lần), TC-05 (hết giờ thì huỷ, trả tồn) đạt trên môi trường sandbox / thử.
- Không đơn nào có dòng giá < giá sàn.
- Webhook nhận đồng thời không lỗi. Nếu vẫn dùng SQLite thì cần cơ chế thử lại; khuyến nghị chuyển PostgreSQL trước khi mở bán (prompt 08).

## Dừng lại và hỏi
- Trước khi gắn khoá payOS production (cần hợp đồng payOS).
- Giao dịch thật nhỏ để thử production: anh tự thanh toán.
- Thời gian giữ hàng, thời hạn xác nhận COD [cần chốt].
