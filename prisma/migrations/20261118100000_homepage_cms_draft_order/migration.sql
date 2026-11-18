-- Additive: separate draft ordering so reordering sections does not change the live homepage
-- until "Xuất bản". Existing rows copy their current published order.
ALTER TABLE "HomepageSection" ADD COLUMN "draftSortOrder" INTEGER NOT NULL DEFAULT 0;
UPDATE "HomepageSection" SET "draftSortOrder" = "sortOrder";
