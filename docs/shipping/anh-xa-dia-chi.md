# Ánh xạ địa chỉ hai cấp sang GHN

Form checkout giữ nguyên tỉnh/thành và phường/xã theo danh mục 34 tỉnh, 3.321 phường/xã. Đơn đã tạo vẫn lưu cột `address` cùng `provinceCode` và `wardCode`. Không thêm lại cấp quận/huyện trên form.

GHN vẫn tính phí và tạo vận đơn bằng `to_district_id` (số) và `to_ward_code` (chuỗi trong danh mục GHN), không phải mã phường quốc gia. Lớp ánh xạ làm việc này:

1. Khi có `GHN_TOKEN`, hệ thống tải tỉnh, quận/huyện và phường của GHN.
2. So tên tỉnh và tên phường/xã sau khi bỏ dấu và bỏ tiền tố (thành phố, tỉnh, quận, huyện, phường, xã, thị trấn).
3. Chỉ nhận kết quả khi đúng một quận/huyện khớp. Trùng tên thì bỏ, không tự chọn.
4. Không khớp, hoặc GHN lỗi, hoặc thiếu token: phí rơi về bảng dự phòng (nội tỉnh / liên tỉnh nếu admin đã nhập, không thì phí dự phòng). Tạo vận đơn không bịa mã quận; admin nhập mã vận đơn tay.

Địa chỉ kho cũng để trống cho tới khi admin nhập. Không có kho thì chưa so được nội tỉnh / liên tỉnh và chưa có điểm lấy hàng để gọi GHN.
