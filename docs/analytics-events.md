# Sự kiện đo lường

Script GA4, Meta, TikTok và Clarity chỉ được chèn khi admin hoặc biến môi trường có ID, và khách đã bấm “Đồng ý tất cả”. “Chỉ cookie cần thiết” không tải script và không gửi request tới các domain đó.

Không gửi số điện thoại, email hay địa chỉ thô. `purchase` lấy `value` từ server, một lần cho mỗi mã đơn.

| Sự kiện | Khi nào | Tham số |
| --- | --- | --- |
| `view_item` | Mở trang sản phẩm | `item_id`, `item_name`, `value` |
| `add_to_cart` | Thêm vào giỏ thành công | `item_id`, `item_name`, `value`, `quantity` |
| `begin_checkout` | Mở trang thanh toán | `value` |
| `add_payment_info` | Chọn phương thức thanh toán | `payment_type` |
| `purchase` | Đơn tạo thành công, server xác nhận | `transaction_id`, `value`, `currency` |
| `search` | Trang kết quả có `q` và `q` không phải SĐT/email | `search_term` |
| `sign_up` | Đăng ký thành công | `method` |
| `generate_lead` | Gửi form liên hệ | không có nội dung form |

Biến môi trường, để trống nếu chưa có: `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID`, `NEXT_PUBLIC_CLARITY_PROJECT_ID`. Admin có thể điền cùng các ID đó ở Cửa hàng. ID trống thì kênh đó không chạy.
