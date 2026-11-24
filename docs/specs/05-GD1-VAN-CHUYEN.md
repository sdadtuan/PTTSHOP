# 05 · GĐ1 MVP — VẬN CHUYỂN (W15 · M09)

> Dán sau prompt 00. Điều kiện bắt đầu: 04 xong. Căn cứ: Đặc tả chức năng v1.1 M09 (FR-901…906), BR-21, BR-22, mục Trạng thái (vận đơn).

## Mục tiêu
Tính phí ship và tạo vận đơn tự động qua **GHN hoặc GHTK**, nhận webhook trạng thái, đối soát COD.

Chọn hãng chính là **đề xuất [cần chốt]**: GHN hoặc GHTK, Goship để so giá ở giai đoạn sau (FR-906). Viết lớp `ShippingProvider` để đổi hãng được.

## Việc cần làm (nhánh `feat/mvp-van-chuyen`)
1. **FR-901 · Tính phí** theo địa chỉ khách, qua API hãng. Một quy tắc miễn phí duy nhất trên toàn site (BR-21, ngưỡng [cần chốt]). Khi API lỗi thì dùng bảng phí dự phòng [cần chốt].
2. **FR-902 · Tạo vận đơn** với mã đơn nội bộ làm khoá chống tạo trùng. Huỷ vận đơn khi đơn huỷ mà hàng chưa được lấy.
3. **FR-903 · Webhook trạng thái:** kiểm xác thực theo tài liệu hãng, xử lý một lần, cập nhật Shipment và Order.
4. **FR-904 · Đối soát COD** theo phiên chuyển tiền của hãng.
5. **FR-905, BR-22 · Nhiều kiện:** đơn kho + dropship tách kiện; khách tra cứu từng mã vận đơn (TC-06).
6. **Phiếu in** (FR-606): phiếu đóng gói, phiếu xuất kho.

## Biến môi trường (chỉ tên)
`GHN_TOKEN`, `GHN_SHOP_ID` hoặc `GHTK_TOKEN`; địa chỉ kho lấy hàng [cần chốt].

## Tiêu chí chấp nhận
- Trên sandbox: tạo, huỷ, nhận webhook đúng; gửi trùng không tạo vận đơn thứ hai.
- TC-06 đạt.
- Báo cáo đối soát COD khớp dữ liệu thử.

## Dừng lại và hỏi
- Chọn hãng, địa chỉ kho, ngưỡng miễn phí ship.
- Trước khi dùng tài khoản hãng production.
