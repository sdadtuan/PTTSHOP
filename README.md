# VIZFAS (PTTSHOP)

Hệ thống thương mại điện tử thời trang / phụ kiện (Nam · Nữ) — Next.js 16 + Prisma + SQLite.

## Chạy local

```bash
npm install
npm run db:setup
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Tài khoản demo

| Vai trò  | Email             | Mật khẩu  |
|----------|-------------------|-----------|
| Admin    | admin@vizfas.vn   | admin123  |
| Khách    | khach@vizfas.vn   | khach123  |

> **Bảo mật:** Đổi mật khẩu admin mặc định trước khi dùng môi trường chia sẻ / production. Xem `.env.example`.

Admin: [/admin](http://localhost:3000/admin)

## Scripts

- `npm run dev` — dev server
- `npm run db:migrate` — chạy Prisma migrations
- `npm run db:seed` — seed dữ liệu mẫu
- `npm run db:setup` — migrate + seed
- `npm run test` — Vitest (API)

## Biến môi trường

Copy `.env.example` → `.env`. Bắt buộc: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`.  
SMTP (`SMTP_*`, `EMAIL_FROM`) tùy chọn — khi trống, email được ghi log console.

## Đã có / đang mở rộng

- Storefront: Home, Catalog, PDP, Cart, Checkout COD/CK
- Auth credentials + role ADMIN/CUSTOMER
- Prisma migrations (không chỉ `db push`)
- Backend phases 0–8: accounts, cart DB, coupons, reviews, admin CRUD, email (xem plan)

## Ghi chú kỹ thuật

- SQLite local (PostgreSQL sau)
- Cart source of truth: DB + cookie `sessionId` (không localStorage)
- Payment: COD + chuyển khoản; chỗ gắn VNPay/MoMo sau
- Ảnh admin: URL (chưa upload file)
