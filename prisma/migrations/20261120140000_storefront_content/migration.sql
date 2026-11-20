-- Storefront CMS: SEO on SiteSettings + editable static pages
ALTER TABLE "SiteSettings" ADD COLUMN "seoTitle" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "seoDescription" TEXT;

CREATE TABLE "StorefrontPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "bodyJson" TEXT NOT NULL DEFAULT '[]',
    "draftTitle" TEXT,
    "draftDescription" TEXT,
    "draftBodyJson" TEXT NOT NULL DEFAULT '[]',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "StorefrontPage_slug_key" ON "StorefrontPage"("slug");