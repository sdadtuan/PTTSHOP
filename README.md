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

Admin: [/admin](http://localhost:3000/admin)

## Scripts

- `npm run dev` — dev server
- `npm run db:push` — đồng bộ schema
- `npm run db:seed` — seed dữ liệu mẫu
- `npm run db:setup` — push + seed

## Đã có trong MVP

- Storefront: Home, Catalog (filter), PDP (màu/size), Cart, Checkout COD/CK
- Auth credentials + role ADMIN/CUSTOMER
- Admin xem đơn hàng cơ bản
- Floating Zalo / Messenger / Phone
- Giỏ hàng localStorage

## Phase tiếp theo

- Admin CRUD sản phẩm / upload ảnh
- Wishlist đồng bộ user
- VNPay / MoMo
- Chuyển SQLite → PostgreSQL production
