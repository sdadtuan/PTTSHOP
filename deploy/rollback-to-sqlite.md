# Quay lại SQLite trong vòng 15 phút

Dùng khi bản PostgreSQL vừa chuyển không chạy được. Không đổi mã nguồn nếu bản SQLite và schema đang chạy vẫn khớp commit trước lúc chuyển.

1. Dừng dịch vụ ứng dụng: `sudo systemctl stop pttshop`.
2. Nếu file `prod.db` đang ở quyền chỉ đọc (`444`), trả lại quyền ghi: `sudo chmod 644 /var/www/pttshop/data/prod.db`.
3. Trỏ cấu hình dịch vụ về file SQLite đã sao lưu ngay trước lúc chuyển. Không ghi chuỗi kết nối vào nhật ký hay vào tài liệu này.
4. Khởi động lại: `sudo systemctl start pttshop`.
5. Kiểm tra trang chủ và trang đăng nhập trên `127.0.0.1:3400`.
6. Ghi lại giờ bắt đầu và giờ trang trả lời. Toàn bộ các bước trên phải xong trong 15 phút.

Bản PostgreSQL giữ nguyên để đối chiếu. Không xoá dump, không chạy seed, không reset.
