# 10 · Tăng trưởng — Phần A

Nhánh `feat/growth`, gốc `feat/dropship` (`bfb5a61`, đang chạy production). Tài liệu này chỉ rà soát và kế hoạch. Chưa có màn hình mới, chưa có migration trong `prisma/migrations`, chưa đụng máy chủ ngoài ba lệnh curl chỉ đọc.

Repo không có bản đầy đủ FR-505, M14, M15, M16, M18, M19, SEO-01…09, BR-17, BR-18, TC-12. Các mục dưới bám code đang chạy, `docs/02-P0-PHAP-LY-NOI-DUNG.md`, `docs/specs/04-GD1-THANH-TOAN.md`, `docs/specs/07-GD1-DON-DOI-TRA-CRM-QUAN-TRI.md` (M16 ở đó là RBAC, không phải báo cáo), và công thức giá sàn bước 09. Chỗ đặc tả gốc không có trong repo được đánh dấu [cần chốt].

## 1. Hiện trạng

### a. SEO

Đã có:

- Title và description gốc: `generateMetadata` trong `src/app/layout.tsx`. Title mặc định và template `%s | {thương hiệu}` lấy từ cài đặt site (`seoTitle`, `seoDescription` trong `src/lib/cms/types.ts`). Mặc định trong code: title `PTT Shop — Thời trang mỗi ngày đều chất`, description `Cửa hàng thời trang & phụ kiện Nam · Nữ. Chất liệu bền, form hiện đại, dễ phối mỗi ngày.`
- Trang sản phẩm: `src/app/san-pham/[slug]/page.tsx` đặt title = tên sản phẩm, description = `Product.description`.
- Trang tĩnh có metadata riêng: về chúng tôi, đánh giá, tin tức, tuyển dụng, chính sách, hỗ trợ, điều khoản, khiếu nại, chọn size. Nội dung lấy từ trang storefront hoặc câu dự phòng trong từng file.
- `src/app/sitemap.ts` xuất trang chủ, `/san-pham`, `/bo-suu-tap`, `/lien-he`, `/ve-chung-toi`, tám link chính sách trong `src/content/company.ts`, và sản phẩm `saleStatus = SELLING`.
- `src/app/robots.ts` cho phép `/`, chặn `/admin`, `/api`, `/demo-v2`, khai báo sitemap.
- `html lang="vi"` trong layout.

Thiếu:

- Không có `metadataBase`, `alternates.canonical`, Open Graph hay Twitter card. Grep `canonical` và `metadataBase` trong `src` không có kết quả.
- Không có JSON-LD Product, Offer, BreadcrumbList, Organization. Grep `ld+json` và `schema.org` trong `src` không có kết quả.
- Đổi slug không 301. `resolveProductSlug` trong `src/lib/product-save.ts` ghi slug mới và bỏ slug cũ. Không có bảng slug cũ.
- Sitemap chưa có `/danh-gia`, `/tin-tuc`, `/tuyen-dung`. Giỏ và thanh toán không có trong sitemap (đúng hướng, không nên index).
- Trang giỏ, thanh toán, đăng nhập, tài khoản không có metadata riêng; chúng kế thừa title gốc.

Bằng chứng, 25/11/2026, chỉ đọc:

```text
curl --http1.1 https://pttshop.vn/sitemap.xml
HTTP/1.1 200 OK
6174 byte, 39 URL. Bắt đầu bằng https://pttshop.vn, /san-pham, /bo-suu-tap, /lien-he, /ve-chung-toi và các trang chính sách. Có URL /san-pham/{slug}.

curl --http1.1 https://pttshop.vn/robots.txt
HTTP/1.1 200 OK
User-Agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /demo-v2
Sitemap: https://pttshop.vn/sitemap.xml

curl --http1.1 https://pttshop.vn/san-pham/demo-mu-bucket-tron
HTTP/1.1 200 OK
title: [DEMO] Mũ Bucket Trơn | PTT Shop
description: Mũ bucket trơn, vành mềm, size điều chỉnh được (Free size). Sản phẩm DEMO để kiểm thử hệ thống, không phải hàng bán thật.
canonical: không có
og:title: không có
application/ld+json: 0

curl --http1.1 https://pttshop.vn/
HTTP/1.1 200 OK
title: PTT Shop — Thời trang mỗi ngày
description: Cửa hàng thời trang & phụ kiện Nam · Nữ. Chất liệu bền, form hiện đại, dễ phối mỗi ngày.
application/ld+json: 0
```

Title trang chủ trên production ngắn hơn câu mặc định trong code, nên đang lấy từ cài đặt site đã lưu, không phải từ hằng số trong repo.

### b. Đo lường

Đã có:

- Banner `src/components/legal/cookie-banner.tsx`, gắn trong `src/app/layout.tsx`. Hai nút: “Chỉ cookie cần thiết” ghi cookie `pttshop_cookie=essential`, “Đồng ý tất cả” ghi `pttshop_cookie=all`. Cookie sống 180 ngày. Banner ẩn trên `/admin` và khi đã chọn.
- `src/lib/tracking.ts` có `optionalTrackingAllowed()`. Hàm này không được file nào gọi.
- Không có thẻ GA4, không có `gtag`, không có Meta Pixel, không có Conversions API, không có `event_id`, không có sự kiện purchase trên `src/app/dat-hang-thanh-cong/page.tsx`.

Vì chưa gắn script, từ chối cookie hiện không tạo request đo lường. TC-12 đúng với hiện trạng, nhưng chưa có bộ chặn để khi sau này gắn ID.

Container đã publish, chỉ đọc ngày 25/11/2026:

```text
curl --http1.1 https://www.googletagmanager.com/gtm.js?id=GTM-PQX685KW
HTTP/1.1 200 OK
file 334731 byte. Phần resource JSON 11376 byte, version 1.
tags: 0
predicates: 0
rules: 0
macros: 5, toàn biến sẵn URL, HOST, PATH, referrer, event
Không có G-69N0FCKD7P, không có 1508219437865650, không có thẻ purchase, không có fbq.
```

Chữ `purchase` và `google-analytics` nằm trong thư viện runtime của file `gtm.js`, không nằm trong cấu hình container. Bản nháp chưa publish trong giao diện GTM thì file này không chứa.

Đường đã chọn, vì container trống: gắn trực tiếp `gtag` với `G-69N0FCKD7P` và `fbq` với `1508219437865650`. Không nạp `gtm.js?id=GTM-PQX685KW`. Không gọi cả hai đường cho cùng một kênh.

Consent Mode v2 đặt ngay trong trang, trước khi tải thư viện: `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` mặc định `denied`. Bấm “Đồng ý tất cả” mới `granted`, rồi mới tải `gtag/js` và `fbevents.js`. “Chỉ cookie cần thiết” hoặc chưa chọn thì các tín hiệu đó giữ `denied` và không có request tới `googletagmanager.com`, `google-analytics.com`, `facebook.net`, `facebook.com`. Cookie đăng nhập và giỏ hàng vẫn là cookie cần thiết.

Bỏ qua vì chưa có token: Conversions API. Không thêm `META_CAPI_TOKEN`.

Biến sẽ dùng, chưa đọc file môi trường và chưa thêm vào code:

- `GA4_MEASUREMENT_ID` — `G-69N0FCKD7P`
- `META_PIXEL_ID` — `1508219437865650`

`GTM_CONTAINER_ID` không dùng ở đợt này.

Purchase gọi `gtag('event', 'purchase')` và `fbq('track', 'Purchase')`, `transaction_id` bằng mã đơn, mỗi kênh một lần. Dòng `AnalyticsEvent` chặn lần gửi thứ hai khi tải lại trang cảm ơn.

### c. Đánh giá thật

Đã có:

- `Review` trong `prisma/schema.prisma`: `rating`, `comment`, `isPublished` mặc định `true`, `isAdminCreated`, `orderId`, unique `(userId, productId)`.
- `POST /api/reviews` bắt đăng nhập và đơn của đúng khách, trạng thái khác `CANCELLED`, đơn có sản phẩm đó. Đơn `PENDING` vẫn đánh giá được. Review mới hiện ngay, không qua duyệt.
- Admin tạo review tại `src/app/api/admin/reviews/route.ts` với `isAdminCreated: true`.
- `recomputeProductRating` trong `src/lib/reviews.ts` ghi `Product.rating` và `reviewCount` từ mọi review `isPublished`, kể cả review admin.
- Form sửa sản phẩm không có ô rating. Cột `Product.rating` vẫn là `Float` mặc định 0. Script `prisma/upsert-hoodies.ts` từng gán `4.8`.

Đề xuất, không đưa review giả vào JSON-LD:

- Khách chỉ gửi khi đơn của họ có shipment `DELIVERED` hoặc đơn `COMPLETED`. Đơn chưa giao thì 403.
- Review khách tạo với `isPublished = false`. Chỉ hiện sau khi admin bật.
- `Product.rating` chỉ là bộ nhớ đệm của review đã duyệt, không phải review admin. Không có review loại đó thì giao diện không hiện sao và schema không có `aggregateRating`.
- Không viết migration `UPDATE` để xóa số rating đang có. Số cũ nằm trong cột cho tới khi một review thật được duyệt và hàm tính lại chạy. Schema Product/Offer không đọc số đó khi chưa có review thật.

### d. Combo và lookbook

Đã có bộ sưu tập (`Collection`) và khối phối màu trên demo-v2 (`src/components/demo-v2/demo-phoi-mau.tsx`). Không có bảng combo, không có giá combo, không có lookbook bán được.

Giá combo phải lớn hơn hoặc bằng tổng `effectiveFloor` của từng thành phần. Hàm nằm ở `src/lib/dropship/floor.ts`. Thiếu giá sàn của một thành phần thì không lưu combo.

### e. Báo cáo

Đã có:

- `GET /api/admin/stats`: số sản phẩm, số đơn, số khách, đơn chờ, tổng `Order.total` trừ đơn hủy, doanh thu 14 ngày. Không có giá vốn, phí ship thực, phí thanh toán, đối trừ NCC.
- Đối soát COD: `src/app/admin/van-chuyen/doi-soat-cod/page.tsx` và API `cod-reconcile`, nhập CSV mã vận đơn.
- payOS: webhook kiểm chữ ký và bảng `WebhookEvent` trong `src/app/api/payments/webhook/route.ts`.
- `SupplierDebit` từ bước 09. `ProductVariant.costPrice` và `SupplierSku.costPrice`. `Order.shippingFee` là phí khách trả, không phải phí hãng trả cho PTT.

Thiếu cột phí thanh toán và phí vận chuyển thực trả theo đơn. Báo cáo đợt 2 tính được phần đã có (doanh thu dòng, giá vốn đã lưu, phí ship khách trả, đối trừ NCC, hoàn tiền đã ghi). Ô chưa có số để trống, không ước lượng. Xuất CSV trước. Excel là cùng số liệu, file `.xlsx`, làm sau CSV nếu anh cần.

Mười đơn mẫu để đối chiếu tay chỉ tạo trên database test, không lấy đơn production.

### f. VNPay — bỏ qua

Chưa có `VNPAY_TMN_CODE` và `VNPAY_HASH_SECRET`. Stub hiện tại giữ nguyên, không thêm adapter, không thêm giá trị enum.

### g. Zalo ZNS và SMS — bỏ qua

Chưa có Zalo OA và nhà SMS. Không thêm interface, không thêm hàng đợi.

## 2. Schema đề xuất

Chỉ thêm bảng và cột. File nháp `docs/specs/10-growth-migration-nhap.sql` nằm ngoài `prisma/migrations`, nên `prisma migrate deploy` không áp dụng. Không `UPDATE`, không `DELETE` dữ liệu cũ.

| Thêm | Việc |
|---|---|
| `SlugRedirect` | slug cũ → slug hiện tại, phục vụ 301 |
| `AnalyticsEvent` | `eventId` duy nhất, `orderNumber`, tên sự kiện. Purchase chỉ một dòng |
| `Review.isPublished` | giữ cột cũ. Khách tạo mới để `false` trong code, không đổi review đang hiện |
| `Combo`, `ComboItem` | giá combo và các biến thể thành phần |
| `Lookbook`, `LookbookItem` | bài phối, trỏ tới sản phẩm đang bán |
| `Order.carrierCost`, `Order.paymentFee` | số nguyên, để trống cho tới khi đối soát nhập |

`Product.rating` không đổi kiểu và không thêm review giả.

## 3. Thứ tự và ước lượng

Một người, ngày làm việc. Bỏ đợt 3.

| Đợt | Nhánh con từ `feat/growth` | Việc | Ngày |
|---|---|---|---|
| 1 | `feat/growth-seo` | Canonical, Open Graph, sitemap bổ sung, JSON-LD Product/Offer/BreadcrumbList/Organization, bảng slug và 301 | 3 |
| 1 | `feat/growth-do-luong` | Giữ nguyên câu banner. Consent Mode v2 mặc định denied. Sau “Đồng ý tất cả” mới tải `gtag` `G-69N0FCKD7P` và Pixel `1508219437865650`. Không nạp GTM. Purchase một lần mỗi kênh | 2 |
| 1 | `feat/growth-danh-gia` | Chỉ đơn đã giao, duyệt trước khi hiện, rating đệm không gồm review admin, schema không có sao giả | 2 |
| 2 | `feat/growth-combo` | Combo và lookbook. Thiếu giá sàn một thành phần thì không lưu combo | 4 |
| 2 | `feat/growth-bao-cao` | Biên lợi nhuận, tồn, NCC, đối soát, CSV và Excel. Cột: mã đơn, sản phẩm, số lượng, doanh thu dòng, giá vốn, phí ship khách trả, phí ship thực, phí thanh toán, đối trừ NCC, hoàn tiền, biên | 4 |

Mỗi nhánh một hoặc vài commit. Không rebase, không reset, không force-push. Không push và không deploy khi chưa có câu “OK deploy”.

Đợt 1 xong mới sang đợt 2.

## 4. Test sẽ viết

Chưa chạy trong Phần A.

- TC-12: chưa chọn hoặc cookie `essential` thì 0 request tới `google-analytics.com`, `googletagmanager.com`, `facebook.net`, `facebook.com`. Consent Mode vẫn `denied`.
- Đồng ý: purchase đúng một lần trên GA4 và một lần trên Pixel. `transaction_id` bằng mã đơn. Tải lại trang cảm ơn không gửi lại, không thêm dòng `AnalyticsEvent`.
- JSON-LD sản phẩm không có `review` hay `aggregateRating` khi chưa có review khách đã duyệt.
- Combo có giá thấp hơn tổng `effectiveFloor` thì API từ chối.
- Biên lợi nhuận của 10 đơn trên database test khớp bản tính tay. Không dùng 4 đơn production.

## 5. Đã chốt

Anh bảo mục nào chưa có thì bỏ qua.

- Container `GTM-PQX685KW` đã publish, 0 thẻ. Đo bằng `gtag` và `fbq` trực tiếp. Không nạp GTM.
- Làm: SEO, GA4 `G-69N0FCKD7P` và Meta Pixel `1508219437865650` sau khi đồng ý cookie, Consent Mode v2 mặc định denied, đánh giá thật, combo/lookbook, báo cáo CSV.
- Bỏ: nạp GTM, Conversions API, VNPay, Zalo ZNS, SMS.
- Banner giữ câu đang chạy.
- Rating đang lưu: ẩn trên cửa hàng và không đưa vào schema cho tới khi có review khách đã duyệt. Không xóa số trong database.
- Combo thiếu giá sàn một thành phần thì không lưu.
- Báo cáo dùng đúng các cột đã ghi ở mục 3. Ô chưa có số để trống.

## 6. Còn cần chốt

- “Đã giao”: shipment chứa sản phẩm đó có status `DELIVERED`, hoặc đơn `COMPLETED`.
- Đợt 2 xuất cả CSV và Excel (`.xlsx`).
