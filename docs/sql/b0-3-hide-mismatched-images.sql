-- B0.3 — Ẩn ảnh stock không đúng sản phẩm.
-- KHÔNG chạy trên production trong batch này.
-- Trước khi chạy (khi được duyệt riêng): pg_dump database production, rồi mới chạy file này.
-- Cột "isHidden" đã có (baseline BOOLEAN NOT NULL DEFAULT false). File này chỉ UPDATE.
-- Không DELETE dòng, không xóa file.

-- Túi Đeo Chéo Mini (tui-deo-cheo) — túi Gucci GG. Hết ảnh sau khi ẩn → placeholder.
UPDATE "ProductImage"
SET "isHidden" = true
WHERE id = 'cmwpxkkbm0072h28sm0wigxs2'
  AND url = 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80';

-- Áo Thun Nam Basic (ao-thun-nam-basic) — áo in ORIGINAL / KIKI.
-- Còn ảnh áo gấp photo-1562157873 (cmwpxkjoj001dh28s5a2fvloj).
UPDATE "ProductImage"
SET "isHidden" = true
WHERE id = 'cmwpxkjoj001eh28sy6ab8yz9'
  AND url = 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80';

-- Áo Thun Raglan (ao-thun-raglan) — áo in (HOTEL). Hết ảnh sau khi ẩn → placeholder.
UPDATE "ProductImage"
SET "isHidden" = true
WHERE id = 'cmwpxkkcv0079h28sz8apk3ei'
  AND url = 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=800&q=80';

-- Áo Thun Oversize (ao-thun-oversize) — áo in YAHWEH YIRIH.
-- Còn ảnh áo trắng photo-1521572163474 (cmwpxkjl0000ch28sml66141y).
UPDATE "ProductImage"
SET "isHidden" = true
WHERE id = 'cmwpxkjl0000dh28s8vujyeqf'
  AND url = 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80';

-- Áo Thun Oversize — áo badge 705.
UPDATE "ProductImage"
SET "isHidden" = true
WHERE id = 'cmwpxkjl0000eh28szjox59r2'
  AND url = 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80';

-- Quần Cargo Năng Động (quan-cargo) — quần jean.
-- Còn ảnh kaki photo-1473966968600 (cmwpxkk2i005bh28s5ikj2u8m). Không ẩn bản cùng URL của Quần Kaki.
UPDATE "ProductImage"
SET "isHidden" = true
WHERE id = 'cmwpxkk2i005ah28sekzuj3b5'
  AND url = 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80';

-- Áo Khoác Bomber (ao-khoac-bomber) — áo da biker.
-- Còn ảnh bomber nâu photo-1591047139829 (cmwpxkjzr004gh28szzhzgysb).
UPDATE "ProductImage"
SET "isHidden" = true
WHERE id = 'cmwpxkjzr004fh28sf6ajkv3e'
  AND url = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80';
