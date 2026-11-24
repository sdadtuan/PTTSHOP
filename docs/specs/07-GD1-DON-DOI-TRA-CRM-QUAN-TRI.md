# 07 · GĐ1 MVP — QUẢN LÝ ĐƠN, ĐỔI TRẢ, CRM, PHÂN QUYỀN, HIỆU NĂNG (W17–W19, W21)

> Dán sau prompt 00. Căn cứ: Đặc tả chức năng v1.1 M06 (FR-601…606), M10 (FR-1001…1006), M16 (FR-1601…1603), M17 (FR-1701…1705, ma trận RBAC), NFR-01, BR-08…13, BR-19.

## Mục tiêu
Vận hành được đơn hàng từ đầu đến cuối: đổi trả, hoàn tiền có người duyệt, đẩy khách và đơn sang CRM, thông báo email, phân quyền theo vai trò, nhật ký thao tác. Trang tải nhanh trên di động.

## Việc cần làm (nhánh `feat/mvp-van-hanh`)
1. **W17 · Đơn hàng** (FR-601…604, FR-606): danh sách có bộ lọc, chi tiết, huỷ đơn (giải phóng tồn, huỷ vận đơn, hoàn tiền nếu đã trả), in phiếu.
2. **W17 · Đổi trả, hoàn tiền** (FR-1001…1006):
   - thời hạn 7 ngày [cần chốt] (BR-08);
   - danh mục loại trừ (BR-12);
   - bên chịu phí theo BR-09…11;
   - hoàn tiền theo phương thức đã trả (BR-13);
   - trên ngưỡng [cần chốt] cần 2 người duyệt (TC-08, TC-09).
3. **W18 · CRM rs.pttads.vn** (FR-605): đẩy khách / đơn, chống trùng theo số điện thoại, gửi lại khi lỗi. API và trường dữ liệu [cần chốt]; chưa có tài liệu API thì dừng và hỏi.
4. **W18 · Thông báo email** (FR-1601…1603), có mẫu quản lý được. Thông báo nội bộ: đơn mới, quá SLA, hoá đơn lỗi, biến thể dưới giá sàn. Nhà cung cấp email là đề xuất [cần chốt].
5. **W19 · Phân quyền**:
   - vai trò và quyền theo ma trận RBAC trong Đặc tả;
   - xác thực 2 lớp cho quản trị (FR-1703);
   - nhật ký thao tác chỉ đọc (FR-1704, BR-19);
   - màn hình cấu hình tích hợp không hiển thị khoá bí mật (FR-1705).

   Phân quyền kiểm tra ở máy chủ cho mọi route; không dùng cơ chế bỏ qua phân quyền. Vai trò Kho mở Quy tắc giá thì bị chặn (TC-11).
6. **W21 · Hiệu năng** (NFR-01): ảnh tối ưu (định dạng hiện đại, kích thước đúng, tải lười), mục tiêu Core Web Vitals tốt trên di động. Đo trước / sau bằng Lighthouse.

## Tiêu chí chấp nhận
- TC-08, TC-09, TC-11 đạt.
- Đẩy CRM thử thành công hoặc có hàng đợi gửi lại.
- Lighthouse di động trang chủ và trang sản phẩm được cải thiện; ghi số đo trước / sau.

## Dừng lại và hỏi
- Ngưỡng hoàn tiền, người giữ từng vai trò, API CRM, kênh email.
