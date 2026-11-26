<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — PTT Shop

Đọc `docs/spec-nang-cap-pttshop.md` (spec) và `docs/ke-hoach-cursor-pttshop.md` (kế hoạch 31 batch) trước khi làm batch nâng cấp.

## Trước khi sửa code
1. Khám phá repo: package.json, app/ hoặc src/, next.config, schema DB, thư mục component. Không giả định đường dẫn từ bộ nhớ hay từ audit.
2. Xác nhận stack (audit 25/11/2026 chỉ là giả định, phải đối chiếu): Next.js (có thể App Router, next/image, header RSC), Auth.js (cookie, /dang-nhap), tiếng Việt, nginx phía trước, route kiểu /san-pham, /gio-hang, /thanh-toan, /lien-he, media /media. DB, package manager (npm/pnpm/yarn/bun) và test runner: tự phát hiện.
3. Tóm tắt file sẽ đụng và kế hoạch nhỏ trước khi sửa diện rộng.

Stack đã đối chiếu ngày 26/11/2026: Next.js 16.4.6 App Router trong `src/app`, React 19, npm, TypeScript, Prisma 6 và PostgreSQL, Auth.js (`next-auth` 5), Vitest, ESLint, Tailwind 4. Production chạy nginx phía trước.

## Dữ liệu nghiệp vụ — không bịa
- Không bịa hotline, email, địa chỉ, giờ mở cửa, STK, ngưỡng freeship, số ngày đổi trả, giá, tồn kho, số đánh giá, nội dung chính sách, hay URL Zalo/mạng xã hội.
- Mọi giá trị đó lấy từ config/admin/env (ví dụ shop_settings hoặc NEXT_PUBLIC_SHOP_* / SHOP_*). Thiếu giá trị: để trống hoặc cờ disabled, không hard-code “cho có”. Liệt kê phần thiếu trong mô tả PR và dừng các bước phụ thuộc.
- Không seed đánh giá ảo, tồn ảo, hay sản phẩm demo lên storefront production.
- Thương hiệu trên production chỉ là PTT Shop. Gỡ WEARLY, VIZFAS, vizfas.vn. Email vizfas không được thay bằng một email bịa; dùng biến cấu hình.

## Git và PR
- Một batch = một nhánh (ví dụ feat/b0-1-branding) = một draft PR. Không gộp nhiều batch trừ khi kế hoạch cho phép.
- Không merge vào main. Không bỏ trạng thái draft. Không push --force lên nhánh shared. Không sửa production env.
- PR mô tả: mục tiêu, file đổi, cách test, screenshot desktop 1440 và mobile 390, giá trị còn thiếu, rủi ro.

## Chất lượng
- Giữ UI tiếng Việt; đừng đổi copy đã đúng.
- Chạy lint/test hiện có (phát hiện lệnh trong package.json). Thêm test khi đụng logic giá, tồn, thanh toán, tìm kiếm, chính sách.
- Chụp trang đã sửa: desktop 1440×900 và mobile 390×844.
- Không làm Lighthouse trang chủ / PDP thụt rõ so với mốc audit (Performance trang chủ ~97 desktop / ~98 mobile, PDP mobile ~95, Accessibility ~96). Trang mới không bắt buộc đạt đúng số đó, nhưng không được làm trang chủ/PDP tụt nặng.
- Không commit secret, .env thật, khóa cổng thanh toán, token Zalo/CRM/sàn.

## Phạm vi
- Chỉ làm đúng batch được giao. Không “tiện thể” làm GĐ sau.
- Không đổi pháp nhân/MST, không đổi nền tảng khỏi Next.js, không viết app native (spec §10).
