# Phiên admin tách khỏi cửa hàng — làm sau

W13b chưa tách cookie đăng nhập.

Hiện admin và khách dùng chung một phiên JWT, cùng trang `/dang-nhap`. Đặt hàng khi vai trò là admin thì `Order.userId` để trống, như khách vãng lai, nên đơn không vào tài khoản admin. Giỏ của phiên đó vẫn được xóa sau khi đặt.

Việc còn lại: cookie phiên admin riêng, để duyệt cửa hàng không mang danh tính admin. Chưa làm. Không đụng dữ liệu production khi triển khai bước này.
