-- Ẩn catalog demo trên storefront. Không xóa dòng.
ALTER TABLE "Product" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- Tên bắt đầu bằng [DEMO], slug demo-..., hoặc SKU DEMO-...
UPDATE "Product" AS p
SET "isDemo" = true
WHERE btrim(p."name") LIKE '[DEMO]%'
   OR lower(p."slug") LIKE 'demo-%'
   OR EXISTS (
     SELECT 1 FROM "ProductVariant" AS v
     WHERE v."productId" = p."id"
       AND upper(v."sku") LIKE 'DEMO-%'
   );
