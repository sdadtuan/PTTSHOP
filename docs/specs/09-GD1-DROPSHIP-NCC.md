# 09 · Dropship và nhà cung cấp — Phần A

Nhánh `feat/dropship`, gốc `fix/video-upload-pg` (`99bc08a`). Phần A là schema và quy tắc. Phần B đã chốt chín điểm dưới đây và code theo đó.

Repo không có bản đầy đủ FR-801…807. Lời TC-07 do anh chốt ngày 25/11/2026 được ghi ở mục 7. Các mục còn lại bám `docs/03-GD1-SAN-PHAM-KHO-GIA.md`, `docs/specs/05-GD1-VAN-CHUYEN.md`, và code đang chạy.

Phạm vi làm thật ở Phần B: hồ sơ NCC, ánh xạ SKU, file CSV và Google Sheet dạng CSV công khai, nhập tay, đồng bộ theo lịch, phiếu đặt hàng tải file, email soạn sẵn để người gửi, cảnh báo quá SLA, tách kiện. CJ Dropshipping chỉ là `SupplierAdapter` trả lỗi “chưa nối”, không gọi mạng và không có cột khoá API. Không thu thập Shopee, Lazada, TikTok Shop, Tiki.

Migration áp dụng: `prisma/migrations/20261125120000_dropship_supplier` thêm bảng và cột. `20261125130000_own_safety_stock_default_zero` đổi default tồn an toàn kho về 0 và đưa các dòng vừa nhận default 2 về 0. File `docs/specs/09-dropship-migration-nhap.sql` là bản nháp, không chạy.

## 1. Schema đề xuất

Tiền là `INTEGER`, đơn vị đồng. Id là `TEXT` cuid, cùng kiểu các bảng hiện có. Trạng thái dùng `TEXT` để không sửa enum cũ. Bảng cũ không bị xoá cột, không đổi kiểu, không đổi dữ liệu đã có.

Hai cột thêm trên bảng cũ, cả hai có mặc định nên dòng sẵn có giữ nguyên giá và tồn:

- `ProductVariant.isPurchasable BOOLEAN NOT NULL DEFAULT true`
- `ProductVariant.safetyStock INTEGER NOT NULL DEFAULT 0`
- `Shipment.fulfillmentSource TEXT` để trống trên vận đơn cũ. Giá trị mới: `WAREHOUSE` hoặc `SUPPLIER`.

### Supplier

Hồ sơ một nhà cung cấp.

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| id | TEXT | Khoá |
| code | TEXT unique | Mã nội bộ, ví dụ `NCC-AO-01` |
| name | TEXT | Tên |
| taxCode | TEXT | MST, có thể trống khi chưa ký |
| contactName, email, phone, address | TEXT | Liên hệ |
| connectionType | TEXT | `FILE`, `GOOGLE_SHEET`, `MANUAL`, `API_STUB` |
| sheetUrl | TEXT | Chỉ URL CSV công khai. Không phải khoá |
| slaHours | INTEGER | Số giờ từ lúc đánh dấu đã gửi phiếu đến lúc có vận đơn |
| contractRef | TEXT | Số hợp đồng |
| contractExpiresAt | TIMESTAMP(3) | Hết hạn hợp đồng |
| imageLicense | TEXT | `NONE`, `WRITTEN`, `OWN_PHOTOS` (BR-16) |
| imageLicenseNote | TEXT | Ghi chú văn bản cho phép |
| imageLicenseExpiresAt | TIMESTAMP(3) | Hết hạn quyền dùng ảnh |
| paysReturnFee | BOOLEAN | Trống cho tới khi chốt. NCC có chịu phí đổi trả hay không |
| isActive | BOOLEAN default true | Ngừng dùng không xoá hồ sơ |
| createdAt, updatedAt | TIMESTAMP(3) | |

Không có cột `apiKey`, `apiSecret`, `accessToken`. CJ dùng `connectionType = API_STUB`.

### SupplierSku

Một biến thể có nhiều NCC. Một NCC có nhiều biến thể.

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| id | TEXT | Khoá |
| supplierId | TEXT | FK Supplier, xoá hồ sơ thì chặn nếu còn dòng |
| variantId | TEXT | FK ProductVariant |
| supplierSku | TEXT | Mã hàng phía NCC |
| priority | INTEGER | Số nhỏ hơn được xét trước |
| costPrice | INTEGER | Giá vốn, đồng |
| supplierStock | INTEGER | Tồn NCC báo |
| safetyStock | INTEGER default 2 | Tồn an toàn của riêng dòng NCC |
| stockUpdatedAt | TIMESTAMP(3) | Ngày cập nhật tồn |
| isActive | BOOLEAN default true | |

Ràng buộc: `(supplierId, supplierSku)` duy nhất, `(supplierId, variantId)` duy nhất.

### SyncRun

Một lần đọc file, sheet hoặc nhập tay.

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| id | TEXT | Khoá |
| supplierId | TEXT nullable | NCC được chọn lúc nhập |
| source | TEXT | `FILE`, `GOOGLE_SHEET`, `MANUAL`, `STUB` |
| startedAt | TIMESTAMP(3) | Bắt đầu |
| finishedAt | TIMESTAMP(3) | Kết thúc, trống khi đang chạy |
| status | TEXT | `RUNNING`, `OK`, `PARTIAL`, `FAILED` |
| rowsRead | INTEGER | Số dòng dữ liệu, không tính dòng tiêu đề |
| rowsChanged | INTEGER | Dòng ghi được vào `SupplierSku` |
| rowsErrored | INTEGER | Dòng bị từ chối |
| errorDetail | TEXT | JSON mảng `{line, code, message}`, không ghi URL có bí mật |

### SupplierOrder

Phiếu chuyển một phần đơn cho một NCC. Không tự gửi email.

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| id | TEXT | Khoá |
| orderId | TEXT | FK Order |
| shipmentId | TEXT nullable | Kiện `SUPPLIER` tương ứng |
| supplierId | TEXT | FK Supplier |
| status | TEXT | `DRAFT`, `READY`, `SENT`, `ACKNOWLEDGED`, `SHIPPED`, `CANCELLED`, `SLA_BREACH` |
| poNumber | TEXT unique | Mã phiếu |
| trackingCode | TEXT | Mã vận đơn NCC điền sau |
| slaDueAt | TIMESTAMP(3) | `sentAt + slaHours` |
| sentAt | TIMESTAMP(3) | Lúc admin xác nhận đã gửi |
| fileName | TEXT | Tên file phiếu đã tạo |
| emailSubject, emailBody | TEXT | Nội dung soạn sẵn |
| createdAt, updatedAt | TIMESTAMP(3) | |

### SupplierDebit

Đối trừ khi hàng NCC lỗi (FR-1006). Đây là khoản NCC nợ PTT, khác khoản PTT hoàn cho khách ở `RefundRequest`.

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| id | TEXT | Khoá |
| supplierId | TEXT | FK |
| supplierOrderId | TEXT nullable | Phiếu liên quan |
| returnRequestId | TEXT nullable | Phiếu đổi trả khách, nếu có |
| amount | INTEGER | Số dương, đồng, NCC phải trừ |
| reason | TEXT | Hàng lỗi, thiếu, sai mẫu |
| status | TEXT | `DRAFT`, `CONFIRMED`, `SETTLED` |
| note | TEXT | |
| createdAt, updatedAt | TIMESTAMP(3) | |

Xác nhận đối trừ không tự sửa `RefundRequest`, không tự cộng tồn, không tự đổi giá.

### Adapter

Phần B sẽ có một interface, chưa viết trong Phần A:

- `FileAdapter` và `GoogleSheetAdapter` đọc cùng các cột CSV.
- `ManualAdapter` không đọc mạng; admin sửa từng dòng.
- `CjAdapter` là stub: mọi lần kéo tồn trả `SyncRun` `FAILED` với thông báo chưa nối, không mở kết nối ra ngoài.

## 2. Giá sàn (BR-04)

Giá bán nằm ở `ProductVariant.price`. Giá vốn admin đang lưu ở `ProductVariant.costPrice`. `PricingRule.floorPrice` là một số nguyên không gắn SKU, không có hệ số. Hàm duy nhất trong code là `isBelowFloor`: có giá sàn và `price < floorPrice`. Checkout, lưu sản phẩm và nhập catalog không gọi hàm này. Mẫu email `INTERNAL_BELOW_FLOOR` đã có sẵn.

Công thức trong `docs/03-GD1-SAN-PHAM-KHO-GIA.md` chưa được code:

```text
G = (C + S + P + F) / (1 − f − r − a − m)
giá niêm yết = làm tròn lên 1.000 của G × (1 + VAT)
```

Tài liệu đề xuất `m = 15%`, `r = 5%`. `a`, VAT, `S`, `P`, `F` là [cần chốt]. `C` khi làm dropship là `SupplierSku.costPrice` của NCC đang được chọn để bán. Vì mẫu số và các phí chưa có trong database, Phần B chưa được phép tự chọn các hệ số đó.

Quy tắc khi đã có một giá sàn cụ thể cho SKU:

- Giá vốn mới làm `price < giá sàn`: đặt `isPurchasable = false`, ghi nhật ký, xếp email `INTERNAL_BELOW_FLOOR`. Giữ nguyên `price`.
- Không tự tăng giá để chạm sàn.
- Chưa có giá sàn (`PricingRule.floorPrice` trống và chưa có sàn theo SKU): không ẩn. Ghi vào `SyncRun` là cảnh báo “chưa có giá sàn”. Có chặn bán trong trường hợp này hay không là [cần chốt].
- Voucher vẫn không được kéo giá dòng xuống dưới sàn. Phần này đã là yêu cầu TC-02; dropship không nới quy tắc đó.

## 3. Tồn khả dụng (BR-07)

Code hiện tại bán theo `ProductVariant.stock`. Tạo đơn thì trừ tồn ngay; huỷ đơn và hết hạn giữ hàng thì cộng lại. Không có cột đang giữ hay tồn an toàn. Cộng thêm một lớp “đang giữ” sẽ trừ trùng.

Đề xuất, dùng đúng số đang có cộng tồn NCC:

```text
tồn riêng khả dụng = max(0, ProductVariant.stock − ProductVariant.safetyStock)
tồn NCC khả dụng   = max(0, supplierStock − SupplierSku.safetyStock)
                     của dòng NCC active, cập nhật trong hạn,
                     có priority nhỏ nhất và còn tồn sau tồn an toàn
tồn bán            = tồn riêng khả dụng + tồn NCC khả dụng
```

Không cộng tồn của mọi NCC. Hết NCC ưu tiên thì xét NCC kế tiếp. Tồn an toàn kho riêng mặc định 0, admin sửa từng biến thể. Tồn an toàn NCC mặc định 2. Tồn NCC cũ hơn 24 giờ không được cộng vào số bán.

SKU `isPurchasable = false` thì tồn bán bằng 0 dù kho còn hàng.

## 4. File nhập

File mẫu: `docs/specs/samples/ncc-ton-mau.csv`.

Cột, đúng thứ tự, dòng đầu là tiêu đề:

`mã NCC, tên, màu, size, giá vốn, tồn, ngày cập nhật`

`mã NCC` trong file là mã hàng của nhà cung cấp, không phải MST. NCC được chọn trên màn hình trước khi tải file. Nếu anh muốn cột này là MST thì đó là [cần chốt], vì một file sẽ không còn gắn với một hồ sơ.

Ngày dùng `YYYY-MM-DD`. Giá vốn và tồn là số nguyên không âm.

Xử lý:

- Thiếu cột, giá không phải số nguyên, tồn âm, ngày sai: dòng đó vào `errorDetail`, các dòng khác vẫn xử lý. `status = PARTIAL` nếu có cả dòng đạt và dòng lỗi.
- Trùng `mã NCC` trong cùng file: cả hai dòng lỗi, không lấy dòng sau đè dòng trước.
- Không tìm thấy biến thể theo tên sản phẩm + màu + size, hoặc chưa có ánh xạ và cũng không khớp được: dòng lỗi `UNMAPPED`. Không tạo sản phẩm mới.
- Khớp được: cập nhật `costPrice`, `supplierStock`, `stockUpdatedAt` của `SupplierSku`. Không ghi đè `ProductVariant.price`.
- Giá vốn mới làm giá bán dưới sàn: vẫn lưu giá vốn NCC, rồi ẩn SKU theo mục 2.
- File rỗng hoặc không đọc được: `FAILED`, không đổi dòng nào.
- Google Sheet dùng đúng các cột này, chỉ với URL CSV công khai. Sheet riêng tư cần tài khoản Google là [cần chốt] và không lưu token trong database.

## 5. Chuyển đơn và tách kiện (BR-22, TC-06)

Một `Order` giữ nguyên. Hàng kho và hàng NCC là các `Shipment` khác nhau. Model vận đơn và trang `/tra-cuu-don` đã liệt kê nhiều kiện; phiếu in đã render từng kiện. Phần B điền `fulfillmentSource`, không tạo bảng kiện mới.

Tách số lượng:

- Phần lấy từ tồn riêng thành một kiện `WAREHOUSE`, theo hãng đang cấu hình (`MANUAL`, GHN hoặc GHTK).
- Phần còn lại thành một kiện `SUPPLIER` và một `SupplierOrder` trạng thái `DRAFT`.
- Một dòng đặt 3 cái, kho còn 2, NCC chịu 1: kiện kho số lượng 2, kiện NCC số lượng 1.
- Nhiều SKU cùng một NCC vào chung một phiếu. Hai NCC thì hai phiếu, hai kiện.
- Admin tải file phiếu và copy email soạn sẵn, rồi bấm xác nhận đã gửi. Lúc đó `sentAt` và `slaDueAt` mới chạy. Hệ thống không tự gửi thư cho NCC.

Khách thấy một mã đơn, danh sách kiện, mỗi kiện một mã vận đơn khi đã có. Kiện NCC trước khi NCC báo mã thì hiện “Đang đặt hàng”, không hiện mã giả.

Phí ship khách trả vẫn một lần cho cả đơn, theo `decideShippingFee` hiện tại: đơn từ 500.000đ thì 0đ, chưa đủ thì phí hãng, phí nội tỉnh, liên tỉnh, hoặc 30.000đ dự phòng. Không nhân đôi phí theo số kiện. Khách không trả thêm phí kiện NCC. Chi phí kiện thêm nằm ở `S` (`FloorSettings.shippingCost`) của công thức G.

Quá SLA: `now > slaDueAt` và phiếu đang `SENT` hoặc `ACKNOWLEDGED` thì chuyển `SLA_BREACH` và xếp email nội bộ `INTERNAL_SLA`. Không tự huỷ đơn khách.

## 6. Màn hình admin

Nhãn tiếng Việt. Quyền mới nằm cạnh 6 vai trò trong `src/lib/rbac.ts`. Vai trò cũ không được xem giá vốn vẫn không xem giá vốn NCC.

| Đường dẫn | Nhãn | Việc trên màn |
|---|---|---|
| `/admin/nha-cung-cap` | Nhà cung cấp | Danh sách, tạo, ngừng dùng |
| `/admin/nha-cung-cap/[id]` | Hồ sơ nhà cung cấp | MST, liên hệ, kiểu nối, SLA, hợp đồng, giấy phép ảnh |
| `/admin/anh-xa-sku` | Ánh xạ SKU | Gắn biến thể, thứ tự, giá vốn, tồn |
| `/admin/dong-bo-ton` | Đồng bộ tồn | Tải CSV, dán URL sheet, nhập tay, nhật ký lần chạy |
| `/admin/phieu-dat-ncc` | Phiếu đặt nhà cung cấp | Tải file, xem email soạn sẵn, xác nhận đã gửi, nhập mã vận đơn |
| `/admin/doi-tru-ncc` | Đối trừ nhà cung cấp | Lập và xác nhận khoản hàng lỗi |

| Việc | Quản trị | Giám đốc | Kho | CSKH | Kế toán | Marketing |
|---|---|---|---|---|---|---|
| Xem hồ sơ, ánh xạ, phiếu, không xem giá vốn | Có | Có | Có | Có | Có | Không |
| Xem giá vốn NCC | Có | Có | Không | Không | Có | Không |
| Sửa hồ sơ và ánh xạ | Có | Không | Không | Không | Không | Không |
| Chạy đồng bộ, nhập tồn | Có | Không | Có | Không | Không | Không |
| Tạo phiếu và xác nhận đã gửi | Có | Không | Có | Không | Không | Không |
| Xem giấy phép ảnh | Có | Có | Có | Có | Có | Có |
| Lập đối trừ | Có | Có | Không | Không | Có | Không |
| Xác nhận đối trừ | Có | Có | Không | Không | Có | Không |

Marketing chỉ thấy cờ giấy phép ảnh vì vai này sửa nội dung sản phẩm (BR-16). Ảnh NCC với `imageLicense` khác `WRITTEN` và `OWN_PHOTOS` không được gắn lên sản phẩm đang bán.

## 7. Test sẽ viết ở Phần B

Chưa chạy trong Phần A.

- TC-06: một đơn có một dòng kho và một dòng NCC. Kết quả là hai `Shipment`, trang tra cứu có cả hai mã, phí ship khách chỉ một khoản theo ngưỡng 500.000đ. Số lượng 3 với kho 2 phải thành 2 và 1.
- TC-07: giá vốn mới làm giá bán thấp hơn giá sàn hiệu lực thì `isPurchasable` thành `false`, xếp thư `INTERNAL_BELOW_FLOOR` cho admin, không đổi `ProductVariant.price`. Giá vốn giảm lại không tự bật bán. Admin bật tay. Case nằm trong `tests/dropship.test.ts`.
- Nhật ký đồng bộ với `docs/specs/samples/ncc-ton-mau.csv`: 5 dòng dữ liệu. Một dòng khớp, hai dòng cùng mã (cả hai lỗi), một dòng chưa ánh xạ, một dòng giá vốn kéo giá bán xuống dưới sàn. Kỳ vọng `rowsRead = 5`, `rowsChanged = 2`, `rowsErrored = 3`. Giá bán không đổi. SKU dưới sàn có `isPurchasable = false` và giá vốn NCC vẫn được lưu.
- Stub CJ: gọi adapter không tạo request HTTP và không đọc biến môi trường khoá.
- Quyền: Kho không đọc được giá vốn; Marketing không mở phiếu đặt.

Cách thử file mẫu khi Phần B đã chạy, trên database test local, không trên staging hay production:

1. Tạo một NCC kiểu `FILE` và một biến thể có tên, màu, size trùng dòng hợp lệ trong `ncc-ton-mau.csv`.
2. Đặt `ProductVariant.price` và một `PricingRule.floorPrice` sao cho dòng “dưới sàn” trong file làm giá bán thấp hơn sàn.
3. Tải file ở màn Đồng bộ tồn.
4. Đọc `SyncRun` và đối chiếu bốn số ở trên. Mở trang sản phẩm: SKU bị ẩn không mua được, các SKU khác của cùng sản phẩm vẫn bán.

## 8. Đã chốt

1. Chưa có NCC thật. `NCC-DEMO` chỉ được tạo trên database local hoặc `pttshop_staging`. Migration không seed. Hàm tạo từ chối khi tên database là `pttshop_prod`.
2. Tồn an toàn kho riêng mặc định 0. Tồn an toàn 2 chỉ áp cho phần tồn NCC và sửa được theo dòng NCC. Admin vẫn sửa `safetyStock` từng biến thể kho.
3. SLA mặc định 48 giờ giao đơn vị vận chuyển. Quá 24 giờ chưa có mã vận đơn thì cảnh báo admin một lần. Quá 48 giờ thì phiếu `SLA_BREACH`. Không tự huỷ đơn khách.
4. Giá sàn hiệu lực = max(giá sàn nhập tay, giá niêm yết từ công thức G). Tham số G sửa ở `/admin/quy-tac-gia`.
5. SKU chưa có giá sàn: phần NCC không bán (`supplierQty = 0`). Tồn kho riêng vẫn bán. Không tự đặt `isPurchasable = false` chỉ vì thiếu sàn.
6. Hàng lỗi do NCC: NCC chịu phí đổi trả, ghi `SupplierDebit`. Không tự đổi yêu cầu hoàn tiền của khách.
7. Khách không trả thêm phí kiện NCC. Chi phí đó vào `S` của công thức G.
8. Tồn NCC chỉ tính khi `stockUpdatedAt` trong 24 giờ. Quá hạn thì chỉ bán tồn kho riêng.
9. TC-07 như mục 7. `mã NCC` trong file là mã hàng của NCC, không phải MST.
