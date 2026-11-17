# Homepage v2 AI photo mapping

Source mock: `/workspace/mock-v2/homepage-mau-v2.png` (510x2560, VIZFAS streetwear homepage).
All images are newly generated photoreal shots matching each mock slot (existing `/workspace/home-ai` and `/workspace/hoodies` photos did not match this mock closely enough to reuse).
Format: JPEG quality 85, longest side max 1600px. Reference crops used for generation live in `/workspace/mock-v2/crops/`.
Style: East Asian models, warm off-white / light-gray studio, soft light, no UI text.

| File | Aspect | Section | Slot |
|---|---|---|---|
| `hero-main.jpg` | 3:4 (864x1152) | Hero / Mặc Đơn Giản Vẫn Nổi Bật | Main collage source photo on the right (sitting male in cream/green raglan tee + olive cargo). Site should apply the tiled collage UI over this complete photo. |
| `banner-left.jpg` | 3:4 (864x1152) | Banner Phong Cách Đơn Giản Mang Đậm Tính Cá Nhân | Left slightly-rotated portrait (male charcoal tee + black backpack). |
| `banner-right.jpg` | 1:1 (1024x1024) | Banner Phong Cách Đơn Giản Mang Đậm Tính Cá Nhân | Right portrait placed on the orange square (male cream/green raglan tee holding headphones). Photo has a clean studio background; overlay it on the orange square in the layout. |
| `cat-ao-thun.jpg` | 3:4 (864x1152) | Khám Phá Các Bộ Sưu Tập — category tile Áo Thun | Left large tile: female squatting, back view, forest-green graphic tee, beige cargo, studio mirror on the right. |
| `cat-quan.jpg` | 16:9 (1280x720) | Khám Phá Các Bộ Sưu Tập — category tile Quần | Top-right landscape tile: mid-body of woman sitting on a chair in beige cargo pants. |
| `cat-phu-kien.jpg` | 16:9 (1280x720) | Khám Phá Các Bộ Sưu Tập — category tile Phụ Kiện | Bottom-right landscape tile: close-up of beige cargo, white sneakers, and a hand holding a forest-green cap. |
| `mix-model.jpg` | 3:4 (864x1152) | Đa Dạng Kiểu Dáng Dễ Phối Đồ | Left large model, full body: male in sage-green overshirt, white tee, beige cargo pants, white sneakers, hands in pockets. |
| `mix-pants-beige.jpg` | 3:4 (864x1152) | Đa Dạng Kiểu Dáng Dễ Phối Đồ — pants product grid | Row 1, column 1: beige/khaki wide cargo pants, flat product shot. |
| `mix-pants-black.jpg` | 3:4 (864x1152) | Đa Dạng Kiểu Dáng Dễ Phối Đồ — pants product grid | Row 1, column 2: black cargo pants, flat product shot. |
| `mix-pants-olive.jpg` | 3:4 (864x1152) | Đa Dạng Kiểu Dáng Dễ Phối Đồ — pants product grid | Row 1, column 3: olive-green cargo pants, flat product shot. |
| `mix-pants-charcoal.jpg` | 3:4 (864x1152) | Đa Dạng Kiểu Dáng Dễ Phối Đồ — pants product grid | Row 2, column 1: charcoal/dark-gray cargo pants, flat product shot. |
| `mix-pants-cream.jpg` | 3:4 (864x1152) | Đa Dạng Kiểu Dáng Dễ Phối Đồ — pants product grid | Row 2, column 2: light cream wide trousers (no cargo pockets), flat product shot. |
| `mix-pants-brown.jpg` | 3:4 (864x1152) | Đa Dạng Kiểu Dáng Dễ Phối Đồ — pants product grid | Row 2, column 3: chocolate-brown parachute cargo pants, flat product shot. |
| `featured-1.jpg` | 1:1 (1024x1024) | Sản phẩm Nổi Bật — large cards | Left large card: Áo Thun Oversize. Female in faded black oversized tee + black cargo pants. |
| `featured-2.jpg` | 1:1 (1024x1024) | Sản phẩm Nổi Bật — large cards | Right large card: Áo Thun Raglan. Male looking down, cream/green raglan tee + olive cargo shorts. |
| `featured-hoodie.jpg` | 1:1 (1024x1024) | Sản phẩm Nổi Bật — small cards | Row of 4, card 1: Áo Hoodie Basic. Male in black hoodie, cream pants. |
| `featured-jacket.jpg` | 1:1 (1024x1024) | Sản phẩm Nổi Bật — small cards | Row of 4, card 2: Áo Khoác Dù. Female in cream zip windbreaker over a white tee. |
| `featured-polo.jpg` | 1:1 (1024x1024) | Sản phẩm Nổi Bật — small cards | Row of 4, card 3: Áo Polo. Male in forest-green polo, beige pants. |
| `featured-cargo.jpg` | 1:1 (1024x1024) | Sản phẩm Nổi Bật — small cards | Row of 4, card 4: Quần Cargo. Female with cream cap, black crop tank, beige cargo pants. |
| `phoi-mau-main.jpg` | 3:4 (864x1152) | Phối Màu Tạo Chất | Large left full-body: male walking away, looking back, cream tee with orange/black starburst back graphic, olive cargo pants, white sneakers. |
| `phoi-mau-type.jpg` | 4:3 (1152x864) | Phối Màu Tạo Chất — typography fill | Close-up face of a young man in an orange shirt, used as the photo fill inside the large 'PHỐI' letterforms. Crop/mask this into the typography; do not show as a standalone product photo. |
| `phoi-mau-1.jpg` | 4:3 (1152x864) | Phối Màu Tạo Chất — lookbook grid | Top row, left: male in dark forest-green t-shirt, mid-shot portrait. |
| `phoi-mau-2.jpg` | 4:3 (1152x864) | Phối Màu Tạo Chất — lookbook grid | Top row, middle: mid-body crop, orange tee + black cargo shorts. |
| `phoi-mau-3.jpg` | 4:3 (1152x864) | Phối Màu Tạo Chất — lookbook grid | Top row, right: mid-body crop, olive cargo with hand in pocket, black/white top. |
| `phoi-mau-4.jpg` | 4:3 (1152x864) | Phối Màu Tạo Chất — lookbook grid | Bottom row, left: male in cream hoodie, hand on cheek, portrait. |
| `phoi-mau-5.jpg` | 4:3 (1152x864) | Phối Màu Tạo Chất — lookbook grid | Bottom row, middle: male in black cap and black tee, looking down, backpack strap. |
| `phoi-mau-6.jpg` | 4:3 (1152x864) | Phối Màu Tạo Chất — lookbook grid | Bottom row, right: male in bright orange sweatshirt with gold chain, portrait. |

## Notes for layout

- `hero-main.jpg` is a complete uncropped sitting portrait. Recreate the mock's white-gutter collage / slightly offset tiles in CSS or a component; do not bake the grid into the photo.
- `banner-left.jpg` and `banner-right.jpg` are straight photos. Apply the slight rotation and the orange square behind the right photo in the layout.
- Category tiles (`cat-ao-thun`, `cat-quan`, `cat-phu-kien`) have no typography baked in. Overlay the labels 'Áo Thun', 'Quần', 'Phụ Kiện' and the arrow buttons as in the mock.
- The 6 `mix-pants-*.jpg` files are clean catalog flats for the product grid on the right of 'Đa Dạng Kiểu Dáng Dễ Phối Đồ'.
- Featured product cards should overlay the orange cart button and product titles; they are not in the photos.
- `phoi-mau-type.jpg` is only for clipping inside the large 'PHỐI' letters, not a product tile.
- Footer has no photo slots (decorative orange/white squares only).

Total images: 27
