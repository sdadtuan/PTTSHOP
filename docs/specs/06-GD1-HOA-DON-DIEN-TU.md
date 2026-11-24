# 06 · GĐ1 MVP — HOÁ ĐƠN ĐIỆN TỬ (W16 · M11)

> Dán sau prompt 00. Điều kiện bắt đầu: 04 xong. Căn cứ: Đặc tả chức năng v1.1 M11 (FR-1101…1103), FR-507, TC-13.

## Mục tiêu
Phát hành hoá đơn điện tử tự động khi đơn đủ điều kiện. Xếp hàng gửi lại khi lỗi. Có hoá đơn điều chỉnh / thay thế khi đổi trả, hoàn tiền.

Nhà cung cấp là **đề xuất [cần chốt]**: Viettel S-Invoice hoặc MISA meInvoice. Viết lớp `InvoiceProvider`.

## Việc cần làm (nhánh `feat/mvp-hoa-don`)
1. **Điều kiện phát hành:**
   - thời điểm phát hành (khi giao thành công hay khi thanh toán) [cần chốt với kế toán];
   - mẫu số / ký hiệu [cần chốt].
2. **FR-1101 · Phát hành qua API:**
   - dữ liệu người mua lẻ, hoặc công ty theo FR-507;
   - dòng hàng, VAT;
   - lưu số hoá đơn và liên kết tra cứu.
3. **FR-1102 · Hàng đợi:** lỗi API thì thử lại có giãn cách, quá số lần thì báo kế toán (TC-13).
4. **FR-1103 · Điều chỉnh / thay thế** gắn với đổi trả, hoàn tiền (prompt 07).
5. Màn hình kế toán: danh sách, trạng thái, gửi lại.

## Tiêu chí chấp nhận
- Trên môi trường thử của nhà cung cấp: phát hành, lỗi rồi thử lại, điều chỉnh.
- TC-13 đạt.
- Không phát hành trùng cho một đơn.

## Dừng lại và hỏi
- Chọn nhà cung cấp, thời điểm phát hành, mẫu số / ký hiệu.
- Trước khi phát hành hoá đơn thật đầu tiên: làm theo hướng dẫn kế toán.
