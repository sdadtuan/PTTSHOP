# Spec: Nâng cấp PTT Shop (pttshop.vn)

Hệ thống: PTT Shop (https://pttshop.vn), storefront Next.js  
Phiên bản: v0.1 (bản nháp để thảo luận)  
Phạm vi: dọn lỗi đã audit, tăng chuyển đổi, đo lường, rồi mới triển khai AI và đa kênh  
Nền tảng audit: 25/11/2026 (Asia/Saigon). Spec này chỉ nêu hiện trạng đã quan sát được; các số liệu kinh doanh chưa chốt thì để trống và hỏi ở mục 9.

Nguyên tắc chung:

- Không đưa tính năng AI, loyalty hay đa kênh lên production khi Giai đoạn 0 chưa đạt tiêu chí nghiệm thu.
- Không bịa đánh giá, tồn kho, địa chỉ, số điện thoại hay chính sách. Số liệu trên giao diện phải khớp dữ liệu thật.
- Nội dung do AI tạo chỉ được đăng sau khi người phụ trách duyệt.
- Lên giai đoạn sau thì giữ dữ liệu và luồng giai đoạn trước, chỉ bổ sung.

---

## 1. Mục tiêu và KPI

### 1.1 Mục tiêu

1. Đưa storefront ra khỏi trạng thái demo: một thương hiệu PTT Shop, thông tin bán hàng nhất quán, ảnh và tìm kiếm chạy đúng.
2. Khách tìm được hàng, thêm giỏ, thanh toán xong, và liên hệ được người thật khi cần.
3. Đo được hành vi, đơn hàng và kênh, để quyết định sản phẩm dựa trên số liệu chứ không đoán.
4. Sau khi nền sạch: tư vấn AI bám catalog thật, cá nhân hóa, khách hàng thân thiết.
5. Khi đã có ảnh sạch, chính sách bảo mật và tồn kho đáng tin: thử đồ AI, nội dung AI có người duyệt, và đồng bộ đa kênh.

### 1.2 KPI

Chưa có số liệu GA4/pixel từ audit, nên không đặt mốc phần trăm bịa. Hai tuần đầu sau khi GĐ1 bật đo lường dùng để lấy baseline, rồi mới chốt mục tiêu số.

| Nhóm | KPI | Cách đo | Tiêu chí hướng tới |
| --- | --- | --- | --- |
| GĐ0 — sạch lỗi | Số chuỗi WEARLY / VIZFAS / `[DEMO]` trên storefront và sitemap public | Quét HTML + sitemap | 0 |
| GĐ0 — sạch lỗi | Ảnh vỡ hoặc ô xám trên trang chủ và sản phẩm đang bán | Kiểm tra thủ công + monitor 4xx/5xx của `/_next/image` và `/media` | 0 |
| GĐ0 — sạch lỗi | Form liên hệ gửi được; tìm kiếm ra trang kết quả | Test tay và test tự động | Đạt |
| GĐ0 — sạch lỗi | Chính sách public còn dòng “Bản nháp… Chưa có hiệu lực” | Quét các URL chính sách | 0, sau khi đã duyệt |
| GĐ1 — chuyển đổi | Tỷ lệ tìm kiếm có kết quả; tỷ lệ click gợi ý | Sự kiện search, search_results, select_suggestion | Lấy baseline rồi chốt |
| GĐ1 — chuyển đổi | Tỷ lệ thêm giỏ, bắt đầu thanh toán, đặt hàng thành công; giá trị đơn trung bình | GA4 + đơn trong DB | Lấy baseline rồi chốt |
| GĐ1 — chuyển đổi | Tỷ lệ hoàn tất checkout; lý do bỏ dở | Funnel checkout + Clarity | Lấy baseline rồi chốt |
| GĐ1 — tin cậy | Tỷ lệ đánh giá kèm ảnh/video đến từ đơn đã giao | Bảng reviews, chỉ đơn delivered | Không dùng số ảo |
| GĐ2 — gắn kết | Tỷ lệ hội thoại chatbot giải được / chuyển Zalo; tỷ lệ dùng gợi ý size | Log chatbot, không bịa câu trả lời | Lấy baseline rồi chốt |
| GĐ2 — gắn kết | Tỷ lệ khách quay lại, đơn từ điểm/hạng/referral | Dashboard | Lấy baseline rồi chốt |
| GĐ3 — AI và kênh | Chi phí/lần thử đồ (nội bộ); tỷ lệ thử đồ → thêm giỏ; thời gian xóa ảnh đúng hạn | Metering try-on | Theo chính sách đã chốt |
| GĐ3 — AI và kênh | Sai lệch tồn web so với Shopee / TikTok Shop (nếu đã mở gian) | Job đối soát | Ngưỡng do ops chốt |

---

## 2. Vai trò

| Vai trò | Quyền chính |
| --- | --- |
| Khách (vãng lai / đã đăng nhập) | Xem, tìm, mua, đánh giá đơn đã nhận, dùng chatbot, thử đồ (khi bật), xem điểm nếu có tài khoản |
| CSKH | Tra cứu đơn, trả lời Zalo (tiếp tay từ bot), xử lý đổi trả / khiếu nại |
| Vận hành shop / Admin | Catalog, tồn kho, đơn, cấu hình thanh toán–vận chuyển–chính sách, ẩn demo, duyệt đánh giá |
| Content / MKT | Lookbook, bài viết, UGC, duyệt nội dung AI, pixel, A/B, livestream |
| Kỹ thuật | Triển khai, bảo mật, tích hợp cổng thanh toán / Zalo / CRM / sàn |

---

## 3. Hiện trạng (quan sát từ audit 25/11/2026)

Chỉ ghi điều đã thấy trên https://pttshop.vn. Không suy diễn số liệu bán hàng hay ý định nghiệp vụ.

**Điểm đã có.** HTTPS, favicon, `lang=vi`, ảnh có alt, cookie consent. Logo PTT Shop, palette cam–đen–kem, slogan “Mặc Đơn Giản Vẫn Nổi Bật”. Khung e-commerce khá đủ: danh mục, sort, PDP (gallery, màu, size, tồn, thêm giỏ hoạt động), wishlist, tài khoản (Auth.js, `/dang-nhap`), tra cứu đơn, checkout một trang với COD, hóa đơn công ty, mã giảm giá, tỉnh/phường mới, checkbox điều khoản. Footer có pháp nhân: CÔNG TY TNHH GIẢI PHÁP QUẢNG CÁO PTT, MST 0319378318, người đại diện Trương Quốc Tuấn, địa chỉ Số 73 Đường Tạ Hiện, Phường Cát Lái, TP. Hồ Chí Minh. Có robots.txt, sitemap, các URL chính sách / hỗ trợ / hướng dẫn size. Lighthouse trang chủ: Performance 97 desktop / 98 mobile, Accessibility 96, Best Practices 96, SEO 100 (điểm SEO này chỉ vì trang chủ có title và description; không kiểm tra Open Graph, schema hay title trùng). PDP mobile Performance 95. Trang chủ khoảng 558–568 KiB.

**Thương hiệu và catalog còn demo.** Trang chủ có watermark lớn “WEARLY”. `/ve-chung-toi` tiêu đề “Về VIZFAS”. Tin tức, đánh giá, điều khoản, tuyển dụng còn chữ VIZFAS; tuyển dụng ghi `hello@vizfas.vn`. `/san-pham` (27 sản phẩm) mở đầu bằng các SP `[DEMO]` (mũ bucket, thắt lưng, túi…) kèm watermark DEMO trên ảnh. Sitemap public cũng có các URL `/san-pham/demo-...`.

**Ảnh và tìm kiếm.** Lưới sản phẩm trang chủ (kể cả “Sản phẩm nổi bật”) và ô danh mục “Nữ” hiện ô xám, không có ảnh. `/san-pham?category=ao-thun`: hai ảnh Unsplash đi qua `/_next/image` trả 500 (Áo Thun Nữ Basic, Áo Thun Oversize). Ô tìm kiếm mở được (“Tìm sản phẩm...”) nhưng Enter và nút “Tìm” vẫn ở trang chủ, không ra kết quả. Listing `/san-pham` khoảng 2,2 MB, nhiều ảnh 200–300 KB không qua optimizer như trang chủ.

**Thông tin liên hệ và chính sách mâu thuẫn.** `/lien-he` ghi showroom “123 Nguyễn Huệ, Quận 1, TP.HCM”, giờ 9:00–21:00 (T2–CN); footer ghi 73 Tạ Hiện và Thứ 2–Chủ Nhật 8:00–22:00. Form liên hệ ghi rõ “Gửi tin nhắn (demo — không gửi email thật)”. Không thấy số điện thoại, email CSKH, Zalo hay link mạng xã hội trên footer (chuỗi 0319378318 chỉ là MST). PDP Áo Thun Nam Basic hiện ★ 4.6 (86 đánh giá) trong khi ngay dưới là “Đánh giá (0) / Chưa có đánh giá”, trang `/danh-gia` = 0 đánh giá công khai. Badge “Free Shipping” không điều kiện, nhưng giỏ/checkout thu phí 30.000đ và ghi “Miễn phí vận chuyển từ 500.000đ”. Badge “Đổi trả 30 ngày”, nhưng `/chinh-sach-doi-tra` viết 7 ngày và “Bản nháp ngày 22/11/2026. Chưa có hiệu lực cho đến khi được duyệt và đăng.” Cùng dòng bản nháp còn ở giao hàng, thanh toán, hướng dẫn size, khiếu nại. Hướng dẫn size ghi “Bảng sẽ gắn theo sản phẩm khi có hàng thật” và “liên hệ hotline” nhưng không có số.

**Thanh toán, checkout, SEO, hạ tầng.** Checkout có COD và chuyển khoản; hiện cảnh báo đỏ: “Tài khoản nhận tiền chưa được cấu hình. Đơn chuyển khoản sẽ chưa đặt được.” Banner cookie che thanh “Free ship > 500k” trên desktop, che giá/CTA lần đầu trên PDP mobile, và đẩy khối chuyển khoản xuống dưới banner ở checkout. Nhiều trang (listing, giỏ, liên hệ, BST) trùng title/description generic “PTT Shop — Thời trang mỗi ngày”. Không có canonical, Open Graph, Twitter card, JSON-LD. Bộ lọc chỉ có chip danh mục + sort; chip “Nam” và “Nữ” bị lặp. `/tin-tuc` chỉ placeholder, 0 bài; `/bo-suu-tap` chỉ 1 “Essentials Collection”. Copy PDP Áo Thun Nam Basic ghi “Chất nỉ mềm, dày dặn” và “unisex”; thumbnail thứ 2 là áo in “ORIGINAL” không khớp. HTML public gửi `Cache-Control: no-store` (không vào back/forward cache). HSTS `max-age=86400`. `/apple-touch-icon.png` trả 404 (file thật là `/apple-icon.png`). Menu mobile: “Liên hệ” hiện hai lần; wishlist không có trên header mobile. Lighthouse báo contrast fail ở giá gạch ngang (và chữ WEARLY).

---

## 4. Lộ trình tổng quan

| Giai đoạn | Mục tiêu | Điều kiện bắt đầu | Điều kiện ra |
| --- | --- | --- | --- |
| GĐ0 — Dọn lỗi bắt buộc | Cửa hàng trông và vận hành như shop thật, không còn demo | — | Đạt các tiêu chí 5.11 |
| GĐ1 — Chuyển đổi, đo lường, AI search | Tìm được hàng, chốt đơn dễ hơn, đo được funnel, thanh toán/thông báo cơ bản | GĐ0 đạt | Search AI và pixel chạy; checkout không bị che; cổng đã chốt được cấu hình |
| GĐ2 — AI tư vấn, cá nhân hóa, loyalty | Tư vấn đúng catalog, giữ chân khách | GĐ1 đạt; bảng size thật đã có; Zalo CSKH đã chốt nếu dùng handoff | Bot không bịa tồn/giá; điểm/hạng chạy trên đơn thật |
| GĐ3 — Thử đồ AI, nội dung AI, đa kênh | Thử đồ, nội dung, đồng bộ sàn | Ảnh sản phẩm sạch; chính sách ảnh đã chốt; gian sàn (nếu có) đã xác nhận | Ảnh thử đồ xóa đúng hạn; nội dung AI chưa duyệt không lên production; tồn đối soát được |

Ước lượng effort: S (nhỏ, khoảng vài ngày trở xuống), M (trung bình), L (lớn, nhiều tuần hoặc nhiều hệ thống). Không quy ra tiền hay đơn giá nhà cung cấp.

| Giai đoạn | Hạng mục chính | Effort gộp (tham khảo) |
| --- | --- | --- |
| GĐ0 | Thương hiệu, demo, ảnh, liên hệ, chính sách, search cơ bản, cookie, copy, cache | phần lớn S, khối ảnh M |
| GĐ1 | AI search, mua ngay/sticky/checkout, lọc, SEO, pixel, A/B, cổng TT, ZNS, giỏ bỏ dở, review ảnh | một L (AI search), một L (cổng TT), còn lại S–M |
| GĐ2 | Chatbot, gợi ý, lookbook, quiz, combo, loyalty, dashboard, CRM | hai L (chatbot, loyalty/CRM), còn lại M |
| GĐ3 | Thử đồ, nội dung AI, UGC, link livestream, đồng bộ tồn sàn | hai L (thử đồ, đồng bộ tồn; nội dung AI L), UGC/link S–M |

---

## 5. Giai đoạn 0: Dọn lỗi bắt buộc

### 5.1 Thống nhất thương hiệu PTT Shop — effort S

**Mô tả.** Gỡ mọi dấu vết theme/demo (WEARLY, VIZFAS, email vizfas) để chỉ còn thương hiệu PTT Shop.

**User story.** Là khách, tôi chỉ thấy tên và câu chuyện PTT Shop, không thấy thương hiệu khác, để tôi tin đây là shop thật.

**Yêu cầu chức năng.**

- Quét và thay toàn bộ UI, metadata, chính sách, tuyển dụng, tin tức, đánh giá, điều khoản: WEARLY, VIZFAS, `hello@vizfas.vn`.
- Xóa watermark “WEARLY” trên lưới sản phẩm trang chủ.
- Sửa lỗi chính tả đã thấy: “Nam · Nữmỗi ngày”; viết hoa “Đánh Giá” thống nhất với các mục khác.

**Phụ thuộc.** Không. Email tuyển dụng / CSKH chính thức lấy từ mục 9.

**Tiêu chí nghiệm thu.**

- Quét storefront + view-source các URL đã audit: 0 kết quả WEARLY / VIZFAS / vizfas.vn.
- Trang Về chúng tôi, Tin tức, Đánh giá, Điều khoản, Tuyển dụng mang tên PTT Shop.

### 5.2 Ẩn sản phẩm `[DEMO]` khỏi storefront — effort S

**Mô tả.** Sản phẩm demo không xuất hiện trên web public, sitemap, tìm kiếm, “có thể bạn cũng thích”, hay quảng cáo.

**User story.** Là khách vào `/san-pham`, tôi chỉ thấy hàng thật đang bán, không thấy nhãn `[DEMO]` hay watermark DEMO.

**Yêu cầu chức năng.**

- Cờ `is_demo` (hoặc quy ước slug/sku) trên sản phẩm. Storefront, sitemap, search, recommendation chỉ lấy `is_demo = false` và `status = published`.
- Admin vẫn xem/sửa được demo trên môi trường nội bộ hoặc khi bật bộ lọc.
- Không xóa cứng dữ liệu cho đến khi vận hành xác nhận; mặc định là ẩn trên production.

**Dữ liệu / API (gợi ý).** `products.is_demo boolean`, `products.status`. Sitemap và `GET /api/products` mặc định `is_demo=false`.

**Phụ thuộc.** 5.1. Câu hỏi 9.6: ẩn ngay trên production hay chỉ giữ ở staging.

**Tiêu chí nghiệm thu.**

- `/san-pham`, trang chủ, sitemap public: 0 tiêu đề `[DEMO]`, 0 URL `/san-pham/demo-...`.
- Truy cập trực tiếp slug demo trên production: 404 hoặc redirect, không index.

### 5.3 Sửa và chuẩn hóa ảnh sản phẩm — effort M

**Mô tả.** Không còn ô xám / ảnh 500 trên hàng đang bán. Ảnh do shop sở hữu, phong cách thống nhất hơn, đi qua tối ưu hóa.

**User story.** Là khách, tôi thấy ảnh sản phẩm trên trang chủ và listing, không phải khung xám hay ảnh stock vỡ.

**Yêu cầu chức năng.**

- Sửa nguồn ảnh lưới trang chủ, ô danh mục “Nữ”, và hai URL Unsplash đang 500 trên listing áo thun.
- Ngừng phụ thuộc Unsplash (hoặc nguồn ngoài không kiểm soát) cho hàng đang bán. Host trên `/media` (hoặc CDN của shop), đi qua `/_next/image` với `sizes` đúng.
- PDP: gallery khớp đúng mẫu đang xem; bỏ thumbnail không thuộc sản phẩm (ví dụ áo in “ORIGINAL” trên Áo Thun Nam Basic). Khi đổi màu, ưu tiên ảnh đúng màu nếu đã có.
- Chuẩn hóa nhẹ: nền, tỉ lệ card thống nhất; không yêu cầu chụp mới toàn bộ trong GĐ0 nhưng phải có ảnh thật cho mọi SP đang bán.

**Phụ thuộc.** File ảnh do shop cung cấp. Ảnh “sạch” kiểu ghost mannequin dành cho thử đồ để ở GĐ3, nhưng GĐ0 cần ảnh đủ dùng để bán.

**Tiêu chí nghiệm thu.**

- Trang chủ, `/san-pham`, PDP các SP đang bán: 0 ô xám, 0 ảnh 4xx/5xx trong vòng kiểm tra.
- Monitor 24h không còn 500 từ `/_next/image` trên URL public.

### 5.4 Liên hệ, địa chỉ, form và kênh CSKH — effort S

**Mô tả.** Một địa chỉ, một khung giờ, form gửi được, có cách liên hệ người thật. Giá trị cụ thể lấy từ mục 9, không ghi đoán trong code.

**User story.** Là khách cần hỏi size hoặc đơn, tôi gửi được tin hoặc bấm Zalo/hotline thật, và địa chỉ trên các trang là một.

**Yêu cầu chức năng.**

- Nguồn cấu hình duy nhất (admin): địa chỉ, giờ, hotline, email, link Zalo OA, (tuỳ chọn) Facebook / Instagram / TikTok.
- `/lien-he`, footer, chính sách, hướng dẫn size dùng cùng nguồn này.
- Form liên hệ gửi thật (email hoặc ticket), bỏ chữ “demo — không gửi email thật”. Có thông báo thành công/thất bại rõ.
- Hiện hotline và nút Zalo ở footer; trên mobile cân nhắc nút nổi, không che CTA mua hàng.

**Dữ liệu / API (gợi ý).** Bảng `shop_settings` (key/value hoặc cột rõ ràng). `POST /api/contact` (name, email, message, honeypot/captcha), ghi log, gửi tới hộp CSKH đã chốt.

**Phụ thuộc.** Câu hỏi 9.1 và 9.2 phải chốt trước khi lên production.

**Tiêu chí nghiệm thu.**

- Không còn “123 Nguyễn Huệ” nếu địa chỉ chốt là 73 Tạ Hiện (hoặc ngược lại: chỉ còn một địa chỉ đã chốt).
- Giờ trên liên hệ và footer trùng nhau.
- Gửi form thử: phía CSKH nhận được; không còn nhãn demo trên form.
- Có ít nhất một kênh người thật (hotline hoặc Zalo) nhìn thấy được trên mobile và desktop.

### 5.5 Thống nhất tín hiệu tin cậy và đăng chính sách — effort M

**Mô tả.** Badge, số đánh giá, freeship, đổi trả và trang chính sách phải khớp nhau và đã được duyệt.

**User story.** Là khách, tôi không thấy “86 đánh giá” khi không có review, và điều kiện đổi trả / freeship trên PDP trùng với giỏ hàng và trang chính sách.

**Yêu cầu chức năng.**

- Điểm và số đánh giá trên PDP chỉ tính từ đánh giá công khai đã duyệt. Nếu 0, hiện “Chưa có đánh giá”, không hiện ★ 4.6 (86 đánh giá).
- Điều kiện freeship và số ngày đổi trả lấy từ `shop_settings`, dùng chung cho badge PDP, giỏ, checkout, trang chính sách.
- Các trang `/chinh-sach-*`, `/huong-dan-chon-size`, `/khieu-nai` chỉ hết dòng “Bản nháp… Chưa có hiệu lực” sau khi người có thẩm quyền duyệt và gắn ngày hiệu lực.
- Gộp hoặc chuyển hướng các cặp URL trùng nội dung (`/chinh-sach-doi-tra` và `/ho-tro/doi-tra`, tương tự vận chuyển / thanh toán) về một URL canonical.
- Hướng dẫn size: không còn câu “khi có hàng thật” trên production nếu hàng đã bán; không kêu “gọi hotline” nếu chưa có số (phụ thuộc 5.4). Bảng size có thể hoàn thiện dần, nhưng phải nói đúng tình trạng.

**Dữ liệu / API (gợi ý).** `shop_settings.freeship_threshold_vnd`, `shop_settings.return_days`, `shop_settings.standard_shipping_fee_vnd`. `policies` (slug, body, status = draft/published, effective_at, reviewed_by).

**Phụ thuộc.** Câu hỏi 9.3, 9.4, 9.15.

**Tiêu chí nghiệm thu.**

- PDP Áo Thun Nam Basic (và SP khác): số review = số review public thật.
- Một sản phẩm dưới ngưỡng freeship: không badge “Free Shipping” vô điều kiện; giỏ hiện đúng phí và đúng số tiền còn thiếu.
- Badge đổi trả = số ngày trong chính sách đã publish.
- Trang chính sách public: 0 dòng “Chưa có hiệu lực”.

### 5.6 Tìm kiếm cơ bản — effort S

**Mô tả.** Ô tìm kiếm phải ra trang kết quả. Tầng AI (thiên nhiên, gõ sai, không dấu, autosuggest) làm ở 6.1; GĐ0 chỉ cần luồng chạy đúng.

**User story.** Là khách, tôi gõ “áo thun” rồi Enter hoặc bấm Tìm, và thấy danh sách sản phẩm tại `/san-pham?q=`.

**Yêu cầu chức năng.**

- Submit ô `q` điều hướng tới `/san-pham?q=...` (giữ bộ lọc khác nếu có).
- Trang listing đọc `q`, lọc theo tên (và slug/danh mục nếu đã có), không gồm SP demo.
- Không có kết quả: thông báo rõ + gợi ý danh mục, không im lặng ở trang chủ.
- Enter và nút “Tìm” hành xử giống nhau.

**Dữ liệu / API (gợi ý).** `GET /san-pham?q=` (RSC/listing hiện có). Có thể thêm `GET /api/products?q=`.

**Phụ thuộc.** 5.2.

**Tiêu chí nghiệm thu.**

- Từ trang chủ, gõ “áo thun” / “hoodie”, Enter hoặc Tìm: URL là `/san-pham?q=...` và có kết quả (với catalog hiện tại).
- Query không khớp: trang kết quả rỗng có message, không đứng im ở `/`.

### 5.7 Cấu hình chuyển khoản hoặc ẩn phương thức — effort S

**Mô tả.** Không để khách chọn chuyển khoản rồi báo “tài khoản nhận tiền chưa được cấu hình”.

**User story.** Là khách, tôi chỉ thấy phương thức thanh toán đang dùng được, hoặc chuyển khoản có đủ thông tin để trả.

**Yêu cầu chức năng.**

- Admin nhập STK / chủ TK / ngân hàng (và sau này VietQR). Khi chưa đủ cấu hình, ẩn “Chuyển khoản ngân hàng” khỏi checkout.
- COD giữ nguyên nếu vẫn là phương thức đang mở (đã quan sát là có).
- Không hiện banner lỗi đỏ cho phương thức đã ẩn.

**Dữ liệu / API (gợi ý).** `payment_methods` (code, enabled, config JSON). Checkout chỉ liệt kê `enabled=true` và config hợp lệ.

**Phụ thuộc.** Câu hỏi 9.5.

**Tiêu chí nghiệm thu.**

- Production: không còn câu “Tài khoản nhận tiền chưa được cấu hình” với phương thức đang hiện.
- Nếu chuyển khoản đã bật: đủ thông tin nhận tiền trên UI (hoặc trên bước sau khi đặt, theo cách đã chốt).

### 5.8 Banner cookie không che nội dung — effort S

**Mô tả.** Banner cookie không che USP, CTA, giá, hay khối phương thức thanh toán.

**User story.** Là khách mới vào mobile PDP hoặc checkout, tôi thấy giá, nút mua và cách thanh toán mà không bị banner đè.

**Yêu cầu chức năng.**

- Banner không `position: fixed` đè lên vùng CTA; dùng khoảng trống cuối trang hoặc thanh thấp có safe-area.
- Checkout: toàn bộ phương thức thanh toán nằm trong form, không bị đẩy xuống dưới banner.
- Nhớ lựa chọn cookie (cần thiết / tất cả) để không hỏi lại mỗi trang trong phiên (đúng hạn cookie đã công bố).

**Phụ thuộc.** Không.

**Tiêu chí nghiệm thu.**

- Desktop trang chủ: nhìn thấy đủ “Free ship > …” (hoặc copy đã chốt) khi banner đang hiện.
- Mobile PDP 390px: giá và CTA không bị che trước khi khách đồng ý cookie (hoặc CTA vẫn với tới được).
- Checkout: COD và chuyển khoản (nếu bật) nằm đúng trong form, không tách dưới banner.

### 5.9 Copy PDP, bộ lọc trùng và lỗi UI nhỏ — effort S

**Mô tả.** Sửa các lỗi nội dung và UI đã quan sát, không đợi GĐ1.

**User story.** Là khách xem áo thun nam, tôi đọc đúng chất liệu và thấy bộ lọc Nam/Nữ không bị lặp.

**Yêu cầu chức năng.**

- Viết lại copy PDP đã sai (Áo Thun Nam Basic: không ghi “chất nỉ” nếu là áo thun; không ghi unisex nếu là hàng nam — nội dung do shop cung cấp, không bịa chất liệu mới trong spec).
- Gỡ chip lọc “Nam”, “Nữ” bị trùng trên `/san-pham`.
- Menu mobile: “Liên hệ” chỉ một lần; cân nhắc thêm wishlist cho đồng bộ với desktop.
- Tránh contrast fail ở giá gạch ngang (đủ tỷ lệ với nền, theo WCAG AA).
- Trỏ `/apple-touch-icon.png` tới icon đang có (`/apple-icon.png`) hoặc phục vụ file đúng path.

**Phụ thuộc.** 5.3 (gallery). Nội dung mô tả do shop duyệt.

**Tiêu chí nghiệm thu.**

- PDP Áo Thun Nam Basic không còn “chất nỉ” nếu không đúng; gallery không còn ảnh “ORIGINAL” không thuộc SP.
- `/san-pham`: mỗi chip Nam, Nữ chỉ một.
- Menu mobile: một mục Liên hệ. Icon apple-touch không 404.

### 5.10 Cache và HSTS cho trang public — effort S

**Mô tả.** Trang public được cache hợp lý; HSTS không chỉ 1 ngày.

**User story.** Là khách bấm Back, tôi thấy trang listing/chủ hiện lại nhanh, không tải lại toàn bộ vì `no-store`.

**Yêu cầu chức năng.**

- Trang public (trang chủ, listing, PDP, chính sách) không gửi `Cache-Control: no-store` trên HTML. Dùng chiến lược phù hợp Next.js (ISR/cache-control công khai, tách trang tài khoản/giỏ/checkout là private).
- Tăng `strict-transport-security` max-age theo chuẩn triển khai (thường dài hơn 86400); chỉ bật preload khi đã chắc toàn site HTTPS.
- Không làm hỏng tính đúng của giá/tồn: dữ liệu thay đổi thường xuyên lấy client-side hoặc cache ngắn, không cache cứng tồn kho lâu.

**Phụ thuộc.** Hạ tầng nginx/Next hiện tại.

**Tiêu chí nghiệm thu.**

- Header HTML trang chủ / `/san-pham` không còn `no-store`.
- `/gio-hang`, `/thanh-toan`, `/tai-khoan` vẫn không bị cache công khai.
- Lighthouse không còn fail bfcache vì `no-store` trên trang chủ.

### 5.11 Tiêu chí nghiệm thu chung GĐ0

- 0 chuỗi WEARLY / VIZFAS / `[DEMO]` trên storefront và sitemap public.
- 0 ảnh vỡ/ô xám trên trang chủ và SP đang bán.
- Một địa chỉ, một giờ, form liên hệ gửi được, có kênh người thật đã chốt.
- Số review, freeship, đổi trả khớp dữ liệu/chính sách đã publish.
- Tìm kiếm cơ bản ra `/san-pham?q=`.
- Không hiện chuyển khoản khi chưa cấu hình.
- Cookie không che CTA/giá/phương thức thanh toán.
- Chính sách public không còn “chưa có hiệu lực” nếu đã quyết định đăng; nếu chưa duyệt thì không hứa điều kiện bán hàng trái với bản nháp.

---

## 6. Giai đoạn 1: Chuyển đổi, đo lường và AI search

Điều kiện bắt đầu: GĐ0 đạt.

### 6.1 AI Search — effort L

**Mô tả.** Tìm kiếm hiểu câu tự nhiên, không dấu, gõ sai, có autosuggest, và luôn gắn với `/san-pham?q=`.

**User story.** Là khách, tôi gõ “ao thun nam den duoi 300k” hoặc “ao hodie form rong” và thấy đúng nhóm hàng, kể cả khi thiếu dấu hoặc sai chính tả nhẹ.

**Yêu cầu chức năng.**

- Chuẩn hóa query: chữ thường, bỏ dấu, tách từ. Dung sai chính tả nhẹ (ví dụ khoảng cách sửa 1–2 ký tự / fuzzy trigram).
- Hiểu câu tự nhiên thành bộ lọc khi chắc: loại (áo thun, quần, hoodie…), giới tính/danh mục, màu, size, khoảng giá, “hàng mới”, “đang giảm”. Phần không chắc thì dùng như từ khóa, không bịa lọc.
- Autosuggest khi gõ (debounce): tên SP, danh mục, gợi ý câu (“áo thun nam đen”). Bàn phím, touch, đọc được bởi screen reader.
- Submit luôn tới `/san-pham?q=` kèm filter đã parse (`color`, `size`, `priceMin`, `priceMax`, `category`…) để share/copy URL được.
- Không gồm SP demo / ẩn. Không kết quả: hiện “không tìm thấy”, gợi ý gần nghĩa, link danh mục.
- Ghi sự kiện: query, đã parse gì, số kết quả, click (phục vụ KPI).
- Có thể triển khai trước bằng PostgreSQL `unaccent` + full-text + `pg_trgm`; tầng embedding/semantic là tùy chọn khi từ khóa chưa đủ, không bắt buộc nhà cung cấp trả phí trong spec này.

**Dữ liệu / API (gợi ý).**

- Index: `products` (name, slug, description, category, gender, colors, sizes, price, tags, is_demo, status).
- `GET /api/search/suggest?q=&limit=`
- `GET /api/search?q=&category=&color=&size=&priceMin=&priceMax=&sort=`
- Trả về: `normalizedQuery`, `parsedFilters`, `items[]`, `total`.

**Phụ thuộc.** 5.2, 5.6, 5.3. Catalog có tên/màu/size sạch thì chất lượng cao hơn.

**Tiêu chí nghiệm thu.**

- “áo thun”, “ao thun”, “ao thun nam” ra nhóm áo thun đang bán, URL `/san-pham?q=...`.
- Câu có giá/màu/size (khi dữ liệu có) được lọc đúng; nếu không parse được thì vẫn ra kết quả từ khóa, không 500.
- Gõ sai nhẹ (ví dụ “hodie”) vẫn gợi ý hoặc ra hoodie nếu catalog có.
- Autosuggest hiện trong khoảng debounce đã định; chọn gợi ý đi đúng URL.
- SP `[DEMO]` không xuất hiện.

### 6.2 Mua ngay, sticky CTA mobile, hoàn thiện checkout một trang — effort M

**Mô tả.** Rút ngắn đường từ PDP tới đặt hàng trên mobile và desktop. Checkout vốn đã một trang; GĐ1 sửa cho đủ, rõ, không vỡ layout.

**User story.** Là khách trên điện thoại, tôi luôn thấy nút mua, bấm “Mua ngay” thì vào checkout với đúng mẫu đã chọn, và điền một trang là đặt được.

**Yêu cầu chức năng.**

- PDP: nút “Mua ngay” (thêm đúng variant rồi tới `/thanh-toan`) cạnh “Thêm vào giỏ”.
- Mobile: thanh CTA dính đáy (giá, variant tóm tắt, Thêm giỏ / Mua ngay), không đè banner cookie (nhờ 5.8) và không đè nút Zalo nếu có.
- Bắt chọn size/màu trước khi thêm giỏ hoặc mua ngay; thiếu thì focus và báo, không thêm nhầm variant.
- Checkout một trang: giao hàng, phương thức, tóm tắt, mã giảm, đồng ý điều khoản, Đặt hàng. Không tách payment ra khỏi form.
- Giữ các trường đã có: họ tên, SĐT, email, địa chỉ, tỉnh, phường, ghi chú, hóa đơn công ty. Validate SĐT VN, bắt buộc các trường cần để giao.
- Ảnh dòng giỏ/checkout ưu tiên ảnh đúng màu đã chọn, không mặc định collage nhiều màu nếu đã có ảnh variant.
- Guest checkout: giữ nếu đang cho phép không bắt đăng nhập (không phát minh thêm bước login bắt buộc trừ khi nghiệp vụ chốt).

**Dữ liệu / API (gợi ý).** Tận dụng cart/checkout hiện có. `POST /api/cart/items`, `POST /api/checkout` (payload địa chỉ + `paymentMethod` + `coupon` + consents).

**Phụ thuộc.** 5.7, 5.8. Cổng mới ở 6.10.

**Tiêu chí nghiệm thu.**

- Mobile 390px, PDP: thanh sticky hiện sau khi cuộn qua CTA gốc; bấm Mua ngay tới checkout đúng màu/size/số lượng.
- Checkout 1440 và 390: đủ khối thanh toán trong form, đặt hàng được bằng COD (và phương thức khác nếu đã bật).
- Thiếu size: không thêm giỏ, có thông báo.

### 6.3 Thanh tiến độ freeship — effort S

**Mô tả.** Trên giỏ và checkout, khách thấy còn thiếu bao nhiêu để miễn phí vận chuyển, đúng ngưỡng đã chốt.

**User story.** Là khách, tôi thấy “còn thiếu X để miễn phí vận chuyển” và thanh tiến độ, để quyết định thêm hàng.

**Yêu cầu chức năng.**

- Lấy ngưỡng từ `shop_settings` (câu hỏi 9.3). Tạm tính hàng (sau giảm giá nếu đã chốt là tính trên net) so với ngưỡng.
- Đạt ngưỡng: phí ship = 0, copy “Bạn được miễn phí vận chuyển”.
- Chưa đạt: hiện số tiền còn thiếu + thanh tiến độ. Không hiện nếu freeship bị tắt.

**Phụ thuộc.** 5.5, câu hỏi 9.3.

**Tiêu chí nghiệm thu.**

- Giỏ 1 áo 259.000đ: nếu ngưỡng là 500.000đ thì phí đúng cấu hình (audit từng thấy 30.000đ — dùng số đã chốt, không hard-code trong spec) và còn thiếu đúng 241.000đ.
- Tăng tạm tính đạt ngưỡng: phí về 0, thanh 100%.

### 6.4 Bộ lọc giá, size, màu — effort M

**Mô tả.** Listing lọc được theo giá, size, màu, ngoài chip danh mục và sort hiện có. Gỡ chip trùng đã làm ở 5.9.

**User story.** Là khách, tôi lọc áo thun, màu đen, size L, giá dưới 300.000đ và thấy đúng hàng còn bán.

**Yêu cầu chức năng.**

- Lọc: khoảng giá, màu (từ variant đang bán), size, (tuỳ chọn) đang giảm / hàng mới. Sort giữ: Mới nhất, Giá tăng/giảm, Tên A–Z, Bán chạy.
- URL phản ánh filter (share được). Mobile: sheet lọc, không vỡ chip.
- Kết hợp với `q` của 6.1. Đếm số SP theo filter hiện tại. Trạng thái rỗng rõ ràng.
- Chỉ hiện màu/size thực sự có trên tập đang lọc (tránh chọn rồi ra 0 vì option “chết”).

**Dữ liệu / API (gợi ý).** Mở rộng `GET /api/products` và `/san-pham` với `priceMin`, `priceMax`, `colors`, `sizes`, `onSale`. Facet: `GET /api/products/facets?...`.

**Phụ thuộc.** 5.2, 5.9, 6.1.

**Tiêu chí nghiệm thu.**

- Chọn màu/size/giá: danh sách và số đếm khớp DB.
- Reload URL đã lọc ra đúng tập. Mobile 390px dùng được.

### 6.5 Hiển thị tồn kho thật (scarcity) — effort S

**Mô tả.** Chỉ hiện “còn ít” / “còn N” khi tồn thật thấp. Cấm countdown hay “chỉ còn 2” giả.

**User story.** Là khách, nếu thấy “Còn 3 sản phẩm (Đen / M)”, tôi tin đó là tồn thật của đúng variant.

**Yêu cầu chức năng.**

- PDP đã có dạng “Còn 25 sản phẩm (Đen / S)” — giữ, nhưng số lấy từ tồn variant, cập nhật khi đổi màu/size.
- Ngưỡng “sắp hết” do admin (ví dụ còn ≤ N). Hết hàng: disable thêm giỏ/mua ngay, báo rõ, gợi ý variant khác nếu còn.
- Checkout/giỏ từ chối nếu tồn không đủ (tránh oversell). Không dùng tồn ảo để tạo gấp.

**Dữ liệu / API (gợi ý).** `product_variants.stock_qty`, `low_stock_threshold` (global hoặc từng SP). API cart kiểm tra tồn lúc thêm và lúc đặt.

**Phụ thuộc.** Tồn vận hành nhập đúng. Đồng bộ sàn ở GĐ3, nhưng web đã phải đúng tồn web.

**Tiêu chí nghiệm thu.**

- Đổi variant: số “còn N” đổi đúng. N = 0: không thêm giỏ.
- Không có copy scarcity khi tồn trên ngưỡng. Test đặt song song: không bán quá tồn.

### 6.6 SEO kỹ thuật — effort M

**Mô tả.** Mỗi trang loại quan trọng có title, description, canonical, Open Graph riêng; có JSON-LD phù hợp.

**User story.** Là khách chia sẻ link PDP lên mạng xã hội, tôi thấy đúng tên, giá/ảnh sản phẩm, không bị card generic.

**Yêu cầu chức năng.**

- Title/description riêng: listing (theo danh mục và `q`), PDP, giỏ, liên hệ, BST, tin, chính sách — không dùng chung “PTT Shop — Thời trang mỗi ngày” trừ trang chủ.
- `link rel=canonical` cho trang index được. OG + Twitter: title, description, image, url, type. PDP: ảnh sản phẩm.
- JSON-LD: `Organization`, `WebSite` (+ SearchAction tới `/san-pham?q=`), `BreadcrumbList`, `Product` + `Offer` (giá, currency VND, availability), `FAQPage` nếu FAQ tĩnh.
- Không khai review schema khi chưa có review thật.

**Phụ thuộc.** 5.1, 5.5, 5.3.

**Tiêu chí nghiệm thu.**

- PDP Áo Thun Nam Basic: title chứa tên SP; có canonical, og:title, og:image, Product/Offer. Availability khớp tồn.
- `/san-pham`, `/lien-he`, `/bo-suu-tap`: title khác trang chủ. Công cụ chia sẻ (hoặc debug OG) ra đúng card.

### 6.7 Tối ưu ảnh listing — effort S

**Mô tả.** Giảm trọng lượng `/san-pham` (audit đo khoảng 2,2 MB) bằng cách đưa ảnh qua optimizer, đúng size, lazy-load dưới fold.

**User story.** Là khách 3G, tôi mở danh sách sản phẩm mà không phải tải hàng loạt ảnh 200–300 KB gốc.

**Yêu cầu chức năng.**

- Ảnh card/listing/PDP thumbnail đi `/_next/image` (WebP/AVIF khi được), `sizes` đúng lưới, lazy dưới fold, ưu tiên LCP ảnh đầu.
- Giới hạn kích thước upload phía admin.

**Phụ thuộc.** 5.3.

**Tiêu chí nghiệm thu.**

- Transfer ảnh `/san-pham` giảm rõ so với mốc ~2,2 MB trên cùng số card (đo lại cùng điều kiện).
- Không hồi quy ô xám / ảnh vỡ.

### 6.8 GA4, Meta Pixel, TikTok Pixel, Microsoft Clarity — effort S

**Mô tả.** Gắn đo lường chuẩn, tôn trọng cookie consent đã có trên site.

**User story.** Là vận hành, tôi thấy funnel xem SP → thêm giỏ → thanh toán → mua, và bản ghi Clarity, chỉ sau khi khách đồng ý cookie đo lường.

**Yêu cầu chức năng.**

- GA4, Meta, TikTok Pixel, Clarity: ID lấy từ cấu hình, không hard-code. Script đo lường chỉ chạy khi khách chọn “Đồng ý tất cả” (banner hiện đã nói cookie đo lường chỉ chạy khi đồng ý).
- Sự kiện tối thiểu: `view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info`, `purchase` (id đơn, giá trị, items), `search`, `sign_up`, `generate_lead` (form liên hệ).
- Không bắn `purchase` trừ khi tạo đơn thành công. Tài liệu mapping event cho MKT.

**Dữ liệu / API (gợi ý).** `shop_settings` cho measurement IDs. Consent state dùng lại cookie banner.

**Phụ thuộc.** 5.8. Câu hỏi 9.12 (đã có tài khoản pixel chưa).

**Tiêu chí nghiệm thu.**

- “Chỉ cookie cần thiết”: không tải pixel/Clarity/GA4 measurement.
- “Đồng ý tất cả”: debug GA4/Meta/TikTok nhận `view_item` và `purchase` đúng giá trị đơn test.
- Clarity có session (sau khi đồng ý).

### 6.9 Nền tảng A/B testing — effort M

**Mô tả.** Chạy thử nghiệm có kiểm soát (bắt đầu in-house hoặc công cụ do team chọn — không bắt buộc nhà cung cấp trả phí trong spec). Một khách một biến thể, đo được.

**User story.** Là MKT, tôi thử hai phiên bản CTA PDP (“Thêm vào giỏ” / “Mua ngay” nổi) và thấy tỷ lệ thêm giỏ từng biến thể.

**Yêu cầu chức năng.**

- Experiment: key, biến thể, % chia, điều kiện trang, thời gian, metric chính (ví dụ add_to_cart).
- Gán biến thể bền theo cookie/user, không nhảy mỗi reload. Gửi mã biến thể kèm event 6.8.
- Admin bật/tắt, không deploy lại app cho test nội dung đơn giản (copy nút, hiện sticky).
- GĐ1 chỉ cần chạy được 1–2 test: CTA PDP / sticky mobile.

**Dữ liệu / API (gợi ý).** `experiments`, `experiment_assignments`. `GET /api/experiments/assignment?key=`.

**Phụ thuộc.** 6.8.

**Tiêu chí nghiệm thu.**

- Cùng trình duyệt giữ một biến thể. Event gắn đúng `experiment_id` / `variant`.
- Tắt experiment: mọi khách về control.

### 6.10 VietQR, MoMo, ZaloPay — effort L

**Mô tả.** Thêm cổng thanh toán phổ biến tại VN, bên cạnh COD và chuyển khoản khi đã cấu hình (5.7). Chỉ bật cổng đã chốt ở mục 9.

**User story.** Là khách, tôi chọn VietQR hoặc ví đã bật, trả xong, và đơn chuyển sang trạng thái đã thanh toán mà không gửi chứng từ tay.

**Yêu cầu chức năng.**

- Mỗi cổng là module `enabled` riêng. Chưa chốt / chưa có merchant ID thì không hiện.
- VietQR: hiện QR đúng số tiền và nội dung đối soát; khớp webhook hoặc polling, chống cộng tiền hai lần.
- MoMo / ZaloPay: tạo phiên, redirect/app, webhook ký, idempotent, timeout, hủy.
- Đơn chờ thanh toán hết hạn theo cấu hình; khách thấy trạng thái rõ (chờ TT, đã TT, thất bại).
- Không lưu số thẻ. Log đối soát, màn hình admin đối soát giao dịch.

**Dữ liệu / API (gợi ý).** `payments` (order_id, provider, provider_txn_id, amount, status, raw_payload). `POST /api/payments/:provider/create`, `POST /api/payments/:provider/webhook`.

**Phụ thuộc.** 5.7, câu hỏi 9.5. Tài khoản merchant do shop cung cấp.

**Tiêu chí nghiệm thu.**

- Sandbox từng cổng đã bật: trả thành công → đơn paid; hủy/timeout → không ghi nhận paid; webhook gọi hai lần không nhân đơn.
- Cổng chưa cấu hình không xuất hiện trên `/thanh-toan`.

### 6.11 Thông báo đơn Zalo ZNS — effort M

**Mô tả.** Gửi ZNS cho các mốc đơn (đặt thành công, đã thanh toán, đang giao, đã giao, hủy) qua Zalo OA đã chốt.

**User story.** Là khách đã mua, tôi nhận Zalo đúng khi đơn đổi trạng thái, kèm mã đơn để tra cứu.

**Yêu cầu chức năng.**

- Template ZNS duyệt sẵn, biến: tên, mã đơn, tổng tiền, trạng thái, link `/tra-cuu-don`.
- Chỉ gửi khi có SĐT hợp lệ và template được duyệt; thất bại thì ghi log, không chặn đổi trạng thái đơn.
- Tôn trọng lựa chọn “nhận tin khuyến mãi” với tin marketing; ZNS giao dịch đơn hàng theo quy định template.
- Admin xem lịch sử gửi / lỗi.

**Dữ liệu / API (gợi ý).** `notification_logs` (order_id, channel=ZNS, template, status, provider_id). Hook khi `orders.status` đổi.

**Phụ thuộc.** 5.4, câu hỏi 9.1 (Zalo OA). Có thể phụ thuộc gói ZNS của OA — không ghi giá trong spec.

**Tiêu chí nghiệm thu.**

- Đơn test: ZNS đặt thành công về đúng SĐT test, đúng mã đơn.
- Template chưa duyệt hoặc SĐT lỗi: đơn vẫn tạo, log lỗi, không 500.

### 6.12 Giỏ hàng bỏ dở — effort M

**Mô tả.** Nhận diện giỏ có hàng nhưng chưa đặt, nhắc khách qua kênh đã có (email và/hoặc ZNS), không spam.

**User story.** Là khách để lại áo trong giỏ, tôi nhận một lời nhắc có link về giỏ, và có thể tắt nhắc.

**Yêu cầu chức năng.**

- Giỏ gắn với user đăng nhập hoặc cookie + email/SĐT nếu đã điền ở checkout.
- Quy tắc thời điểm và số lần do admin (ví dụ lần 1 sau X giờ, tối đa N lần). Không gửi nếu đã đặt, đã hủy, hoặc hết tồn toàn bộ dòng.
- Link khôi phục giỏ. Tôn trọng opt-out.
- Báo cáo: số giỏ bỏ, số nhắc, số đơn lấy lại — trên dashboard GĐ2 có thể nối, GĐ1 có bảng đơn giản.

**Dữ liệu / API (gợi ý).** `carts.updated_at`, `cart_reminders` (cart_id, sent_at, channel). Job định kỳ.

**Phụ thuộc.** 6.8 (event), 6.11 nếu nhắc bằng ZNS; email nếu dùng email.

**Tiêu chí nghiệm thu.**

- Giỏ test sau ngưỡng thời gian: đúng 1 nhắc đầu, nội dung đúng SP. Đặt hàng xong: không nhắc nữa.
- Vượt số lần tối đa: dừng.

### 6.13 Đánh giá ảnh / video — chỉ đánh giá thật — effort M

**Mô tả.** Khách đã nhận hàng mới được đánh giá, có thể kèm ảnh/video. Không hiện số review ảo (đã cấm ở 5.5).

**User story.** Là khách đã nhận áo, tôi gửi sao, nội dung và ảnh; là khách khác, tôi chỉ thấy review đã duyệt.

**Yêu cầu chức năng.**

- Chỉ mở form khi đơn ở trạng thái đã giao (hoặc đã hoàn tất) và dòng hàng thuộc đơn đó, một review / SP / đơn.
- Ảnh/video: giới hạn dung lượng, định dạng, quét cơ bản. Ẩn mặc định đến khi admin duyệt (hoặc auto-publish nếu shop chốt — mặc định là duyệt).
- PDP và `/danh-gia`: điểm trung bình và phân bổ tính trên review đã duyệt. Schema SEO chỉ khi có review thật.
- Cấm seed “86 đánh giá”. UGC TikTok nhúng ở 8.3, tách khỏi sao sản phẩm trừ khi cùng một nguồn đã xác minh.

**Dữ liệu / API (gợi ý).** `reviews` (order_item_id, user_id, product_id, rating, body, status, media[]). `POST /api/reviews`, `POST /api/admin/reviews/:id/approve`.

**Phụ thuộc.** 5.5. Đơn phải có trạng thái giao hàng đáng tin.

**Tiêu chí nghiệm thu.**

- Tài khoản chưa mua / chưa nhận: không gửi được review SP đó.
- Review chưa duyệt không hiện public, không计入 điểm PDP.
- Sau duyệt: điểm PDP tăng đúng 1 review.

### 6.14 Tiêu chí nghiệm thu chung GĐ1

- AI search: không dấu, typo nhẹ, autosuggest, URL `/san-pham?q=` + filter.
- Sticky CTA + Mua ngay + checkout một trang dùng được trên 390px và 1440px.
- Freeship bar và tồn “còn N” đúng dữ liệu thật.
- Pixel/Clarity chỉ chạy khi đã đồng ý cookie; event `purchase` đúng.
- Cổng thanh toán đã chốt: thanh toán thử thành công; cổng chưa chốt không hiện.
- Review ảo không quay lại.

---

## 7. Giai đoạn 2: AI tư vấn, cá nhân hóa và loyalty

Điều kiện bắt đầu: GĐ1 đạt. Tư vấn size cần bảng size thật (câu hỏi 9.15). Handoff Zalo cần OA/CSKH (9.1).

### 7.1 Chatbot AI tư vấn — effort L

**Mô tả.** Trợ lý trên web, chỉ trả lời dựa trên catalog, tồn, chính sách, bảng size đã publish, và đơn của đúng khách. Gợi ý outfit, tra cứu đơn, chuyển người thật trên Zalo khi cần. Cấm bịa.

**User story.** Là khách, tôi hỏi “cao 1m70 nặng 65kg mặc áo thun nam basic size nào?” hoặc “đơn PTT123 đang ở đâu?” và nhận câu có căn cứ, hoặc được mời chat Zalo với CSKH.

**Yêu cầu chức năng.**

- Widget (góc trang, không che sticky CTA). Có thể mở từ PDP với ngữ cảnh SP đang xem.
- Grounding: mỗi câu về giá, tồn, chính sách, size phải gắn nguồn (SP/variant, slug chính sách, bản ghi đơn). Không có nguồn thì nói “chưa chắc” và đề nghị Zalo / form — không bịa số đo hay tồn.
- Công cụ (tool) tối thiểu: `search_products`, `get_product`, `suggest_size` (chiều cao, cân nặng, dáng mặc muốn, product_id — so với bảng size, nêu giả định), `suggest_outfit` (từ catalog đang bán, không SP ẩn/demo), `lookup_order` (mã đơn + SĐT, chỉ trả đơn khớp), `handoff_zalo` (link OA hoặc ticket + tóm tắt hội thoại).
- Không dùng review ảo; không hứa đổi trả/freeship khác chính sách đã publish.
- Lịch sử hội thoại lưu có thời hạn; khách có thể xóa. CSKH thấy tóm tắt khi handoff.
- Giới hạn tần suất, lọc prompt injection: không tiết lộ tool ẩn, không đổi giá.

**Dữ liệu / API (gợi ý).** `POST /api/chat` `{sessionId, message, contextProductId}`. `chat_sessions`, `chat_messages` (role, content, citations). Tool đi API nội bộ của 6.1 / 6.5 / đơn / 5.5.

**Phụ thuộc.** 5.4, 5.5, 6.1, 6.5, bảng size (9.15), Zalo (9.1). Model LLM có thể tự host hoặc API; không chốt nhà cung cấp hay giá trong spec.

**Tiêu chí nghiệm thu.**

- Hỏi tồn/giá một SP: đúng số DB tại thời điểm gọi, có citation.
- Hỏi thông tin không có trong chính sách: bot từ chối bịa, mời Zalo.
- Tra đơn: đúng khi mã + SĐT khớp; sai SĐT thì không lộ đơn khác.
- `suggest_size` khi chưa có bảng size: không đoán số đo, nói rõ là chưa có bảng.
- Handoff: mở được kênh Zalo đã chốt, kèm ngữ cảnh (nếu kỹ thuật OA cho phép).

### 7.2 Gợi ý cá nhân hóa — effort M

**Mô tả.** Gợi ý SP dựa trên đang xem, đã xem, đã mua, và (nếu có) kết quả style quiz. Khách vãng lai dùng ngữ cảnh phiên, không bịa “dành riêng cho bạn” khi không có dữ liệu.

**User story.** Là khách xem áo thun nam, tôi thấy gợi ý quần/phụ kiện phối được đang bán, không thấy hàng hết hay demo.

**Yêu cầu chức năng.**

- Vị trí: PDP (“đi cùng” / “có thể bạn cũng thích”), giỏ, trang chủ (khối riêng, không phá layout đã dọn ở GĐ0).
- Tín hiệu: item-to-item (cùng danh mục, complement), lịch sử xem/mua, quiz (7.4) nếu có. Fallback: hàng mới / bán chạy thật.
- Chỉ SP published, còn bán, không demo. Gắn `reason` nội bộ (để debug), copy công khai không quá lời.
- Tôn trọng cookie đo lường với tín hiệu hành vi dài hạn.

**Dữ liệu / API (gợi ý).** `GET /api/recommendations?placement=pdp|cart|home&productId=&limit=`. Bảng `product_relations` (manual merchandising, ưu tiên hơn model nếu có). Log impression/click.

**Phụ thuộc.** 5.2, 6.8. Chatbot 7.1 có thể gọi cùng API.

**Tiêu chí nghiệm thu.**

- PDP không gợi ý chính nó, SP ẩn, hết hàng, hoặc demo.
- Xóa lịch sử / chặn cookie đo lường: về fallback, không lỗi trang.

### 7.3 Lookbook / Shop the look — effort M

**Mô tả.** Bộ look có ảnh phối và danh sách SP mua được, gắn với từng món đang bán.

**User story.** Là khách, tôi mở một look, thấy các món trong ảnh và thêm cả bộ hoặc từng món vào giỏ (nếu còn size).

**Yêu cầu chức năng.**

- CMS: tạo look (ảnh, tiêu đề, mô tả, danh sách product/variant, thứ tự, publish).
- Trang `/bo-suu-tap` và/hoặc `/lookbook`: không còn chỉ một card “Essentials Collection” generic nếu đã có look thật (audit: 1 BST, ảnh stock).
- Trang look: hotspot hoặc danh sách SP, giá hiện tại, trạng thái tồn, thêm từng món / thêm những món còn hàng.
- Look hết một món: vẫn hiện, món hết đánh dấu, không chặn xem.

**Dữ liệu / API (gợi ý).** `looks`, `look_items` (look_id, product_id, variant_id nullable, position). `GET /api/looks/:slug`.

**Phụ thuộc.** 5.2, 5.3, 6.2.

**Tiêu chí nghiệm thu.**

- Look publish xuất hiện, click món tới đúng PDP. “Thêm món còn hàng”: chỉ món còn tồn vào giỏ.
- Look nháp không public.

### 7.4 Style quiz — effort M

**Mô tả.** Quiz ngắn (dáng mặc, màu, ngân sách, giới tính/danh mục) để ra một tập gợi ý và (tuỳ chọn) lưu preference.

**User story.** Là khách mới, tôi trả lời vài câu và nhận một tập SP phù hợp để bắt đầu, không bị bắt buộc tạo tài khoản trước (có thể lưu khi đăng nhập).

**Yêu cầu chức năng.**

- 4–7 câu, cấu hình được trong admin (câu, lựa chọn, tag/filter map). Không hỏi dữ liệu nhạy cảm không cần để gợi ý.
- Kết quả: lưới SP + CTA listing đã lọc. Khách đăng nhập có thể lưu profile phong cách cho 7.2.
- Có thể bỏ qua quiz. Không dùng kết quả để bịa tồn/giá.

**Dữ liệu / API (gợi ý).** `quiz_questions`, `quiz_answers`, `user_style_profiles`. `POST /api/style-quiz/complete`.

**Phụ thuộc.** 6.1, 6.4, 7.2.

**Tiêu chí nghiệm thu.**

- Hoàn tất quiz: ra SP published còn bán, khớp rule đã cấu hình (bộ test cố định).
- Bỏ giữa chừng: site vẫn dùng được.

### 7.5 Combo / bundles — effort M

**Mô tả.** Gói SP (ví dụ áo + quần) với giá/giảm do shop nhập, không bịa giá trong spec.

**User story.** Là khách, tôi thêm một combo đang bán, giỏ thể hiện từng món và giá gói, tồn từng variant vẫn được trừ đúng.

**Yêu cầu chức năng.**

- Admin: tạo bundle, món thành phần, giá hoặc % giảm, thời hạn, publish.
- PDP món thành phần có thể hiện bundle liên quan. Thêm bundle: chọn size/màu từng món.
- Tồn: trừ từng variant. Một món hết: không bán bundle, hoặc bán phần còn lại đúng giá lẻ — phải chốt một hành vi và ghi rõ trên UI.
- Freeship tính trên tổng đơn sau giảm bundle.

**Dữ liệu / API (gợi ý).** `bundles`, `bundle_items`. `POST /api/cart/bundles`.

**Phụ thuộc.** 6.2, 6.3, 6.5.

**Tiêu chí nghiệm thu.**

- Thêm bundle: giỏ đúng thành phần + giá đã cấu hình. Đặt đơn: tồn từng variant giảm đúng.
- Hết một món: đúng hành vi đã chốt, không oversell.

### 7.6 Điểm, hạng thành viên, giới thiệu — effort L

**Mô tả.** Khách đăng nhập tích điểm từ đơn đủ điều kiện, lên hạng, mời bạn (referral). Tỷ lệ điểm, hạng, thưởng là cấu hình — chốt ở mục 9, không ghi số bịa.

**User story.** Là khách đã mua, tôi thấy điểm sau khi đơn hoàn tất, biết còn bao nhiêu để lên hạng, và có mã mời bạn.

**Yêu cầu chức năng.**

- Quy tắc do admin: điểm / số tiền (làm tròn thế nào), đơn nào được tính (đã thanh toán / đã giao), điểm khi hoàn/hủy bị trừ, hạn dùng điểm.
- Hạng: ngưỡng, quyền (đổi điểm, ưu đãi) — nội dung quyền do shop nhập.
- Referral: mã duy nhất, ghi nhận bạn mới khi đặt đơn hợp lệ, thưởng hai bên theo cấu hình, chống tự mời / lạm dụng cơ bản (cùng SĐT, cùng thẻ không xét nếu không có dữ liệu; tối thiểu cùng tài khoản/SĐT).
- Trang tài khoản: số dư, lịch sử, hạng, mã giới thiệu. Checkout: ô dùng điểm nếu được bật, trần điểm/đơn.
- Không áp dụng điểm cho đơn chưa đủ điều kiện.

**Dữ liệu / API (gợi ý).** `loyalty_accounts`, `loyalty_ledger` (delta, reason, order_id), `loyalty_tiers`, `referrals`. `POST /api/loyalty/redeem`.

**Phụ thuộc.** Đơn và trạng thái giao có thật. Câu hỏi 9.13. Có thể hiện điểm trên dashboard 7.7.

**Tiêu chí nghiệm thu.**

- Đơn test hoàn tất: điểm cộng đúng rule. Hủy/hoàn: ledger trừ tương ứng, không âm silently sai rule.
- Đổi điểm ở checkout: tổng tiền khớp, không vượt trần. Referral: đơn bạn mới hợp lệ mới cộng, không tự referral.

### 7.7 Dashboard doanh thu — effort M

**Mô tả.** Màn admin: doanh thu, số đơn, AOV, tỷ lệ chuyển đổi (nếu có GA hoặc đếm session nội bộ), top SP, phương thức thanh toán, trạng thái đơn, giỏ bỏ dở (6.12), (nếu đã bật) điểm/referral.

**User story.** Là quản lý, tôi mở một màn hình trong khoảng ngày tự chọn và thấy số khớp đơn đã chốt, không phải đoán từ nhiều spreadsheet.

**Yêu cầu chức năng.**

- Lọc theo ngày, trạng thái đơn, kênh (web; sàn để dành GĐ3).
- Định nghĩa rõ: “doanh thu” = đơn ở trạng thái nào (ví dụ paid/delivered, trừ hủy). Hiện định nghĩa trên UI.
- Xuất CSV. Quyền chỉ Admin/quản lý.
- Không bịa traffic nếu chưa có 6.8; khi thiếu đo lường thì ẩn conversion hoặc ghi “chưa gắn pixel”.

**Dữ liệu / API (gợi ý).** `GET /api/admin/metrics?from=&to=&channel=`. Aggregate từ `orders`, `order_items`, `payments`.

**Phụ thuộc.** 6.8, 6.12. CRM 7.8 chỉ đọc, không thay dashboard vận hành nhanh.

**Tiêu chí nghiệm thu.**

- Bộ đơn mẫu: tổng doanh thu / số đơn / AOV khớp query SQL đối chiếu.
- User không có quyền: 403.

### 7.8 Tích hợp PTT CRM (rs.pttads.vn) — effort L

**Mô tả.** Đồng bộ khách và đơn từ PTT Shop sang PTT CRM để đội nội bộ thấy doanh thu/khách trên CRM. Spec không giả định CRM đã có sẵn module e-commerce; contract API chốt với đội CRM (mục 9.11).

**User story.** Là nhân sự PTT, tôi mở CRM và thấy khách vừa đặt trên pttshop.vn kèm mã đơn, không nhập tay.

**Yêu cầu chức năng.**

- Đồng bộ khi tạo/cập nhật khách (email/SĐT) và khi đơn đổi trạng thái quan trọng (tạo, paid, shipped, delivered, cancelled, refunded).
- Idempotent theo `shop_order_id`. Thất bại: retry + hàng đợi + cảnh báo, không làm fail checkout khách.
- Không đẩy dữ liệu thừa ngoài phạm vi đã chốt (nguyên tắc minimize). Nhật ký đồng bộ cho kỹ thuật.
- Chiều ngược (CRM sửa địa chỉ/đơn) chỉ làm nếu CRM có API và nghiệp vụ chốt; GĐ2 mặc định là shop → CRM.

**Dữ liệu / API (gợi ý).** Outbox `crm_sync_jobs` (entity_type, entity_id, payload, status, attempts). Endpoint CRM do đội CRM cung cấp — placeholder `POST {CRM}/api/shop/orders`. Mapping: tên, SĐT, email, địa chỉ, dòng hàng, tiền, thanh toán, trạng thái.

**Phụ thuộc.** 9.11. Auth giữa hai hệ thống (service credential), không nhúng secret ra client.

**Tiêu chí nghiệm thu.**

- Đơn test trên shop xuất hiện trên CRM (hoặc môi trường staging CRM) đúng tiền và dòng hàng.
- CRM giả lập lỗi: khách vẫn đặt được, job retry, có log.

### 7.9 Tiêu chí nghiệm thu chung GĐ2

- Chatbot không bịa giá/tồn/chính sách; handoff Zalo chạy nếu đã chốt.
- Gợi ý và lookbook chỉ hàng đang bán, không demo.
- Loyalty/referral đúng rule đã cấu hình trên đơn test.
- Dashboard khớp số đơn; CRM nhận đơn test (nếu môi trường CRM sẵn).

---

## 8. Giai đoạn 3: AI thử đồ, nội dung AI và đa kênh

Điều kiện bắt đầu: GĐ0–GĐ1 đạt; ảnh SP sạch cho những mẫu bật thử đồ; chính sách ảnh và chi phí/lần đã chốt (9.7–9.9). Đồng bộ sàn chỉ khi đã có gian (9.10).

### 8.1 AI thử đồ (virtual try-on) — effort L

**Mô tả.** Khách tải ảnh bản thân, xem gợi ý mặc một SP/variant. Mỗi lần thử được đo (metering) theo chính sách chi phí đã chốt (miễn phí N lần, trừ điểm, tính vào đơn, hoặc chỉ nội bộ — không ghi số tiền trong spec). Có thể tự host ComfyUI hoặc gọi API bên thứ ba; luôn có đồng ý, giới hạn mục đích, và xóa ảnh.

**User story.** Là khách, tôi đồng ý điều khoản ảnh, tải một ảnh rõ, chọn áo, thấy kết quả thử, và biết ảnh sẽ bị xóa sau thời hạn đã công bố; tôi cũng xóa ngay được.

**Yêu cầu chức năng.**

- Chỉ bật trên SP có đủ ảnh “sạch”: chụp phẳng hoặc mannequin, nền đơn, đúng màu variant, độ phân giải tối thiểu (admin checklist). SP thiếu ảnh: ẩn nút thử đồ.
- Trước khi upload: checkbox đồng ý (mục đích chỉ để render thử đồ, thời hạn lưu, xóa khi nào, có gửi ra nhà cung cấp thứ ba hay chỉ xử lý trên máy shop). Không tích thì không upload.
- Giới hạn file (dung lượng, loại, không có ảnh người khác nếu khách không có quyền — nêu trong điều khoản). Từ chối ảnh không phải người / không dùng được, với thông báo rõ, không trừ lượt nếu chốt là vậy.
- Metering: ghi mỗi lần thử (user/session, product, variant, provider, trạng thái, chi phí nội bộ nếu có). Áp dụng hạn mức theo chính sách 9.7 (ví dụ N lần/ngày). Hết lượt: báo cách mở thêm (nếu có), không render lén.
- Nhà cung cấp hoán đổi được bằng cấu hình: (A) tự host ComfyUI trên hạ tầng shop — ảnh ở lại hạ tầng đã kiểm soát; (B) API thứ ba — phải nói rõ trong consent là ảnh rời máy chủ shop, chọn nhà cung cấp có xóa/retention chấp nhận được. Không hard-code một vendor bắt buộc, không ghi giá vendor trong spec.
- Ảnh gốc, ảnh kết quả, prompt/metadata: lưu theo TTL đã chốt (9.9). Job xóa hết hạn; khách và admin xóa sớm (`DELETE`). Sau xóa không khôi phục trên production. Log kiểm toán (ai xóa, khi nào), không lưu lại file.
- Kết quả có disclaimer: ảnh minh họa, màu/vải thực tế có thể khác. CTA thêm giỏ / mua ngay variant đang thử.
- Không dùng ảnh khách để train model trừ khi có đồng ý tách riêng (mặc định: cấm).
- Rate limit, xác thực (khách đăng nhập hoặc captcha/session) để tránh lạm dụng GPU/API.

**Dữ liệu / API (gợi ý).**

- `try_on_assets` trên product/variant (front_image_id, meets_quality).
- `try_on_jobs` (id, user_id, product_id, variant_id, provider, status, consent_version, cost_units, created_at, purge_at).
- Object storage riêng, bucket private.
- `POST /api/try-on` (multipart + `consentVersion` + variantId) → job id.
- `GET /api/try-on/:id` (status, result URL có hạn).
- `DELETE /api/try-on/:id` và `DELETE /api/try-on/me` (xóa toàn bộ ảnh của khách).
- Admin: `GET /api/admin/try-on/usage`.

**Phụ thuộc.** 5.3 (ảnh sạch), 6.2 (CTA), 7.6 nếu trừ điểm. Câu hỏi 9.7, 9.8, 9.9. Hạ tầng GPU nếu chọn ComfyUI.

**Tiêu chí nghiệm thu.**

- SP thiếu ảnh sạch: không có nút thử đồ.
- Chưa consent: không có file nào được lưu.
- Render thành công: hiện kết quả + disclaimer + CTA đúng variant. Job được ghi metering.
- TTL hết: file biến khỏi storage; URL cũ 404. Khách bấm xóa: file mất trước TTL, có log.
- Đổi provider (ComfyUI / API) bằng config: không đổi UI khách, trừ phần copy consent (có/không rời máy chủ).
- Hết hạn mức: không render, có thông báo.

### 8.2 Nội dung AI (có người duyệt) — effort L

**Mô tả.** Hỗ trợ tạo ảnh model ảo, mô tả SP, bài SEO/phối đồ, video ngắn từ catalog. Mọi thứ chỉ ra ngoài sau khi người duyệt ấn publish. Không thay 5.1/5.3 bằng ảnh lỗi hoặc copy sai như “chất nỉ” trên áo thun.

**User story.** Là content, tôi tạo bản nháp mô tả và ảnh model từ SP, sửa, rồi mới đăng; khách không thấy bản nháp.

**Yêu cầu chức năng.**

- Ảnh model ảo: input ảnh SP sạch + prompt/preset (giới tính, dáng, nền). Output là bản nháp, gắn `product_id`, không ghi là ảnh khách thật.
- Mô tả SP + meta title/description: bản nháp từ thuộc tính thật (chất liệu, form, xuất xứ) do ops nhập; người duyệt bắt buộc trước khi ghi đè PDP. Cấm bịa chất liệu không có trong dữ liệu.
- Bài SEO / phối đồ: nháp trên `/tin-tuc` (audit đang trống), có người duyệt, có nguồn SP liên kết.
- Video ngắn: pipeline tách (template/editor hoặc render); file nháp, duyệt, rồi mới dùng ads/PDP. Không tự đăng mạng xã hội nếu chưa chốt kênh.
- Mọi artifact: `draft | rejected | published`, `reviewed_by`, `reviewed_at`. Production chỉ `published`.
- Ghi rõ “ảnh dựng AI” khi legally/nghiệp vụ yêu cầu (chốt copy cảnh báo).

**Dữ liệu / API (gợi ý).** `ai_content_jobs`, `ai_assets` (type = image|copy|post|video, status, payload, review). `POST /api/admin/ai/generate`, `POST /api/admin/ai/:id/review`.

**Phụ thuộc.** 5.3, 6.6, CMS tin tức. Người duyệt (câu hỏi 9.16). Không chốt vendor hay giá.

**Tiêu chí nghiệm thu.**

- Bản nháp không lộ PDP, listing, tin tức public, sitemap, OG.
- Publish chỉ khi có `reviewed_by`. Từ chối: không lên live.
- Mô tả generate không được thêm chất liệu không có trong thuộc tính SP (bộ test).

### 8.3 Nhúng UGC TikTok / Reels — effort S

**Mô tả.** Nhúng video TikTok/Reels/short do shop chọn (khách hoặc brand), có quyền sử dụng. Tách khỏi sao đánh giá trừ khi cùng review đã xác minh (6.13).

**User story.** Là khách, tôi xem được video người thật mặc hàng trên PDP hoặc trang UGC, bấm được tới SP, không bị autoplay tiếng ồn.

**Yêu cầu chức năng.**

- Admin dán URL/embed đã có quyền, gắn SP, publish/gỡ.
- Embed theo quy định nền tảng (TikTok/Instagram), mute mặc định, lazy-load, không làm vỡ LCP trang chủ.
- Không gọi đây là “đánh giá 5 sao” nếu không phải review đơn hàng.

**Dữ liệu / API (gợi ý).** `ugc_embeds` (platform, url, product_ids, status, rights_note).

**Phụ thuộc.** Quyền sử dụng nội dung (MKT chịu). 6.7 (hiệu năng).

**Tiêu chí nghiệm thu.**

- Embed publish hiện đúng PDP; gỡ thì biến mất. Trang vẫn dùng được nếu embed lỗi (fallback).
- Không làm tăng review count.

### 8.4 Link livestream / TikTok Shop — effort S

**Mô tả.** Chỗ chính thức để khách vào phiên livestream hoặc gian TikTok Shop / Shopee khi shop đã có. GĐ3 sớm chỉ là merchandising + link, chưa phải đồng bộ tồn (8.5).

**User story.** Là khách muốn mua lúc live, tôi thấy một entry rõ (“Đang live” / “Mua trên TikTok Shop”) tới đúng URL đã chốt.

**Yêu cầu chức năng.**

- Cấu hình: URL, nhãn, lịch (tuỳ chọn), bật/tắt, badge “Đang live” theo lịch hoặc nút tay.
- Vị trí: header/footer/trang chủ — không phá GĐ0. Nếu chưa có gian: ẩn khối, không hiện nút chết.
- Không giả live khi không có phiên.

**Phụ thuộc.** Câu hỏi 9.10.

**Tiêu chí nghiệm thu.**

- URL tắt: không hiện CTA. Bật: đi đúng link. “Đang live” chỉ khi cờ/lịch đúng.

### 8.5 Đồng bộ tồn kho Shopee / TikTok Shop — effort L

**Mô tả.** Khi đã có gian, tồn và (phạm vi đã chốt) đơn được đối soát với web để giảm oversell. Không giả định đã có gian hay đã có API token trong audit.

**User story.** Là vận hành, khi một size bán hết trên web hoặc trên sàn, size đó không còn bị bán quá số ở kênh còn lại quá ngưỡng đã chốt.

**Yêu cầu chức năng.**

- Mapping SKU/variant shop ↔ item/SKU sàn. SKU chưa map: cảnh báo, không đoán.
- Đồng bộ tồn: hướng và nguồn sự thật do ops chốt (ví dụ tồn tổng, buffer từng kênh). Job định kỳ + webhook nếu sàn có.
- Đơn sàn (nếu trong phạm vi): kéo về hoặc nhận webhook, trừ tồn theo cùng sổ, hiện trên dashboard (kênh = shopee/tiktok).
- Lỗi/mismatch: queue, alert, báo cáo lệch. Không làm sập checkout web khi API sàn lỗi (fail-safe: theo chính sách, ví dụ tạm khóa variant hoặc giữ buffer).
- Auth token sàn lưu server-side, xoay khóa được.

**Dữ liệu / API (gợi ý).** `channel_listings` (variant_id, channel, channel_item_id, channel_sku, last_synced_qty, last_sync_at, error). `inventory_sync_jobs`. Adapter riêng `shopee` / `tiktok_shop`.

**Phụ thuộc.** 6.5, 7.7, câu hỏi 9.10. Tài khoản developer sàn do shop cung cấp.

**Tiêu chí nghiệm thu.**

- Bộ test staging: bán trên web giảm tồn phản ánh trên listing sàn (hoặc buffer đã chốt), và ngược lại.
- SKU lệch/không map: có báo cáo, không tự suy ra SKU khác.
- API sàn chết: web vẫn đặt được trong ngưỡng fail-safe đã ghi; có alert.

### 8.6 Tiêu chí nghiệm thu chung GĐ3

- Thử đồ: consent, metering, xóa đúng hạn, chỉ SP có ảnh sạch.
- Nội dung AI chưa duyệt không ra public.
- UGC và link live/sàn đúng cấu hình, không giả live, không làm tăng sao ảo.
- Nếu có gian: đối soát tồn chạy trên staging/production theo rule đã chốt.

---

## 9. Câu hỏi cần chốt

Không tự điền hộ. Chưa chốt thì tính năng liên quan giữ cấu hình tắt hoặc chỉ chạy trên staging.

1. Hotline, Zalo OA (và ZNS), email CSKH / tuyển dụng chính thức là gì? Có dùng Facebook, Instagram, TikTok không — URL nào?
2. Địa chỉ và giờ đúng là nào: Số 73 Đường Tạ Hiện, Phường Cát Lái, 8:00–22:00 (footer), hay 123 Nguyễn Huệ, Quận 1, 9:00–21:00 (`/lien-he`), hay một giá trị khác?
3. Ngưỡng miễn phí vận chuyển và phí ship chuẩn? (Audit thấy badge “Free Shipping”, đồng thời giỏ thu 30.000đ và “miễn phí từ 500.000đ”.)
4. Thời hạn đổi trả 7 ngày (bản nháp chính sách) hay 30 ngày (badge PDP)? Khi nào các chính sách hết “bản nháp / chưa có hiệu lực” và ai duyệt?
5. Tài khoản ngân hàng nhận chuyển khoản? Có triển khai VietQR, MoMo, ZaloPay không (merchant đã có chưa)?
6. Ẩn toàn bộ sản phẩm `[DEMO]` trên production ngay, hay chỉ giữ trên staging?
7. Chính sách chi phí / hạn mức AI thử đồ: miễn phí bao nhiêu lần, có trừ điểm hay gắn vào đơn không? (Chốt rule, không cần ghi giá vendor vào đây.)
8. Thử đồ: tự host ComfyUI hay API bên thứ ba? Nếu thứ ba, ai chấp nhận việc ảnh rời máy chủ shop?
9. Thời hạn xóa ảnh thử đồ (ví dụ 24 giờ / 7 ngày / xóa ngay sau khi khách đóng trang) và có cho phép dùng ảnh để cải thiện model không? (Spec mặc định: không train trên ảnh khách.)
10. Đã có gian Shopee / TikTok Shop chưa? Shop ID? Có livestream định kỳ không? Có muốn đồng bộ tồn ở GĐ3 không?
11. PTT CRM (https://rs.pttads.vn) sẽ nhận khách/đơn ở module hay API nào? Ai cấp credential? Có cần đồng bộ ngược không?
12. Đã có tài khoản GA4, Meta Pixel, TikTok Pixel, Microsoft Clarity chưa? Ai giữ ID?
13. Loyalty: tỷ lệ điểm, điều kiện cộng (thanh toán hay đã giao), hạng, thưởng giới thiệu, trần đổi điểm/đơn?
14. Đánh giá: chỉ sau khi giao thành công? Duyệt tay trước khi public hay auto-publish?
15. Bảng size thật (số đo theo nhóm áo/quần/phụ kiện) đã có chưa? Ai chịu trách nhiệm đo?
16. Ai duyệt nội dung AI (mô tả, ảnh model ảo, bài SEO, video) trước khi publish?
17. Checkout có bắt buộc tài khoản hay giữ mua với tư cách khách?
18. Bundle khi một món hết hàng: ẩn cả gói hay cho mua phần còn lại theo giá lẻ?
19. Nguồn sự thật tồn kho khi có sàn: sổ tổng trên web, hay từng kênh có buffer riêng?

---

## 10. Ngoài phạm vi (v0.1)

- Thay đổi pháp nhân, MST, hay đăng ký hộ kinh doanh.
- Tự ý chọn và ký hợp đồng nhà cung cấp LLM, cổng thanh toán, ZNS, thử đồ, hay sàn — spec chỉ mô tả năng lực và chỗ cấu hình.
- Bịa dữ liệu đánh giá, tồn kho, địa chỉ, hotline.
- App mobile native (phạm vi là web pttshop.vn; PWA có thể xem xét sau, không nằm trong v0.1).
- Tính năng admin theme builder generic hay đổi nền tảng khỏi Next.js.
