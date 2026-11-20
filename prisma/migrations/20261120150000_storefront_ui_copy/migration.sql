CREATE TABLE "StorefrontUiCopy" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "contentJson" TEXT NOT NULL DEFAULT '{}',
    "draftContentJson" TEXT NOT NULL DEFAULT '{}',
    "publishedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);