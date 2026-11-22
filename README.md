# PTT Shop (PTTSHOP)

Hệ thống thương mại điện tử thời trang / phụ kiện (Nam · Nữ) — Next.js 16 + Prisma + SQLite + NextAuth v5.

## Chạy local

```bash
npm install
npm run db:setup
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

Seed local cần `ADMIN_EMAIL` và `ADMIN_PASSWORD` (tối thiểu 8 ký tự) trong môi trường lúc chạy. Script dừng ngay khi `NODE_ENV=production` và không tạo tài khoản với mật khẩu cố định.

Admin: [/admin](http://localhost:3000/admin)

## Scripts

- `npm run dev` — dev server
- `npm run db:migrate` — chạy Prisma migrations
- `npm run db:seed` — seed dữ liệu mẫu (xóa & tạo lại)
- `npm run db:setup` — migrate + seed
- `npm run test` — Vitest (register/login/cart/checkout/admin status)

## Biến môi trường

Copy `.env.example` → `.env`.

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `DATABASE_URL` | Có | SQLite local, ví dụ `file:./dev.db` |
| `AUTH_SECRET` | Có | Secret dài ngẫu nhiên cho NextAuth |
| `AUTH_URL` | Có | URL app, ví dụ `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | Không | Tên hiển thị |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Không | SMTP generic — khi trống, email ghi log console |
| `EMAIL_FROM` | Không | Địa chỉ gửi |
| `ADMIN_EMAIL` | Khi seed | Email admin tạo lúc `npm run db:seed` |
| `ADMIN_PASSWORD` | Khi seed | Mật khẩu admin, tối thiểu 8 ký tự, chỉ lấy từ môi trường |
| `TEST_DATABASE_URL` | Không | DB riêng cho Vitest (mặc định `file:./test.db`) |

## Luồng khách → admin (manual checklist)

1. Đăng ký `/dang-ky` hoặc đăng nhập tài khoản vừa seed
2. Thêm sản phẩm vào giỏ (DB cart + cookie `vizfas_cart_sid`)
3. Checkout COD hoặc chuyển khoản. Mã giảm giá mẫu trong seed đang tắt.
4. Admin `/admin` → Đơn hàng → đổi trạng thái (COMPLETED = “Đã giao”)
5. Khách đánh giá sản phẩm đã mua trên PDP
6. Admin quản lý sản phẩm / danh mục / coupon / review / doanh thu 14 ngày

## Kiến trúc ngắn

- **Auth:** NextAuth credentials + JWT; middleware bảo vệ `/admin`; rate-limit login sai (in-memory)
- **Cart:** DB + cookie sessionId; merge guest → user khi đăng nhập; wishlist guest = localStorage
- **Orders:** stock decrement điều kiện `stock >= qty`; coupon atomic; email xác nhận/status
- **Payments:** `CodProvider` + `BankTransferProvider`; stub VNPay/MoMo trong `src/lib/payments`
- **Reviews:** chỉ buyer có đơn không-hủy; recompute `Product.rating` / `reviewCount`
- **DB:** SQLite local (PostgreSQL sau); Prisma migrations (không chỉ `db push`)
- **Ảnh admin:** URL ngoài (chưa upload file/S3)

## Thanh toán online sau này

`src/lib/payments/` có `VnpayProviderStub` / `MomoProviderStub`. Gắn webhook qua `handleWebhook` khi có merchant keys — chưa tích hợp live.
