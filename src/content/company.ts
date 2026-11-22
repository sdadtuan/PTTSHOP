// Nguồn: docs/02-P0-PHAP-LY-NOI-DUNG.md, mục "Đã có".
// Điền: tên, MST, ngày cấp, trụ sở, người đại diện.
// Để nguyên [cần chốt]: nơi cấp, hotline, email.
export const company = {
  name: "CÔNG TY TNHH GIẢI PHÁP QUẢNG CÁO PTT",
  taxId: "0319378318",
  issuedOn: "23/01/2026",
  issuedBy: "[cần chốt]",
  address: "Số 73 Đường Tạ Hiện, Phường Cát Lái, TP. Hồ Chí Minh",
  representative: "Trương Quốc Tuấn",
  hotline: "[cần chốt]",
  email: "[cần chốt]",
  policyVersion: "2026-11-22-nhap",
  tradeConfirmCode: "",
} as const;

export const companyPolicyLinks = [
  { href: "/chinh-sach-bao-mat", label: "Chính sách bảo mật" },
  { href: "/dieu-khoan", label: "Điều khoản" },
  { href: "/chinh-sach-thanh-toan", label: "Thanh toán" },
  { href: "/chinh-sach-giao-hang", label: "Giao hàng" },
  { href: "/chinh-sach-doi-tra", label: "Đổi trả" },
  { href: "/khieu-nai", label: "Khiếu nại" },
  { href: "/huong-dan-chon-size", label: "Chọn size" },
] as const;
