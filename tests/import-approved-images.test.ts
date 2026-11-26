import { describe, expect, it } from "vitest";
import {
  planApprovedPrimary,
  planUnsplashField,
  rollbackSql,
  webpDimensions,
  type ExistingProductImage,
  type ImportLog,
} from "@/lib/import-approved-images";

const unsplash = (id: string, sortOrder: number): ExistingProductImage => ({
  id,
  url: `https://images.unsplash.com/${id}`,
  sortOrder,
  isHidden: false,
  sha256: null,
});

describe("planApprovedPrimary", () => {
  it("hides every Unsplash image and inserts the approved photo as the primary", () => {
    const plan = planApprovedPrimary({
      images: [unsplash("gucci", 0), unsplash("original", 1)],
      approvedSha256: "abc",
    });
    expect(plan.needsCreate).toBe(true);
    expect(plan.updates).toEqual([
      { id: "gucci", sortOrder: 1, isHidden: true, previous: { sortOrder: 0, isHidden: false } },
      { id: "original", sortOrder: 2, isHidden: true, previous: { sortOrder: 1, isHidden: false } },
    ]);
  });

  it("does nothing the second time once the approved file is already first", () => {
    const plan = planApprovedPrimary({
      images: [
        { id: "new", url: "/media/uploads/a.webp", sortOrder: 0, isHidden: false, sha256: "abc" },
        { ...unsplash("gucci", 1), isHidden: true },
      ],
      approvedSha256: "abc",
    });
    expect(plan.needsCreate).toBe(false);
    expect(plan.updates).toEqual([]);
  });

  it("hides the old blank placeholder after the approved photo is primary", () => {
    const plan = planApprovedPrimary({
      images: [
        {
          id: "blank",
          url: "/images/placeholder-product.png",
          sortOrder: 0,
          isHidden: false,
          sha256: null,
        },
      ],
      approvedSha256: "cap",
    });
    expect(plan.needsCreate).toBe(true);
    expect(plan.updates).toEqual([
      { id: "blank", sortOrder: 1, isHidden: true, previous: { sortOrder: 0, isHidden: false } },
    ]);
    const again = planApprovedPrimary({
      images: [
        { id: "new", url: "/media/uploads/cap.webp", sortOrder: 0, isHidden: false, sha256: "cap" },
        {
          id: "blank",
          url: "/images/placeholder-product.png",
          sortOrder: 1,
          isHidden: true,
          sha256: null,
        },
      ],
      approvedSha256: "cap",
    });
    expect(again.needsCreate).toBe(false);
    expect(again.updates).toEqual([]);
  });
});

describe("planUnsplashField", () => {
  it("points an Unsplash category image at the approved tee and clears the others", () => {
    expect(planUnsplashField("https://images.unsplash.com/photo-1", "/media/uploads/tee.webp")).toEqual({
      next: "/media/uploads/tee.webp",
      change: true,
    });
    expect(planUnsplashField("https://images.unsplash.com/photo-2", null)).toEqual({
      next: null,
      change: true,
    });
    expect(planUnsplashField("/media/uploads/shop.webp", null)).toEqual({
      next: "/media/uploads/shop.webp",
      change: false,
    });
    expect(planUnsplashField(null, "/media/uploads/tee.webp")).toEqual({ next: null, change: false });
  });
});

describe("rollbackSql", () => {
  it("deletes only the new rows and unhides only the logged ids", () => {
    const log: ImportLog = {
      database: "pttshop_staging",
      created: [{ id: "new-1", slug: "ao-thun-nam-basic", url: "/media/uploads/a.webp" }],
      hidden: [{ id: "old-1", slug: "ao-thun-nam-basic" }],
      reordered: [{ id: "old-1", slug: "ao-thun-nam-basic", previousSortOrder: 0, nextSortOrder: 1 }],
      categories: [{ id: "cat-1", slug: "ao-thun", previous: "https://images.unsplash.com/photo-1", next: "/media/uploads/a.webp" }],
      collections: [{ id: "col-1", slug: "essentials", previous: "https://images.unsplash.com/photo-2", next: null }],
    };
    const sql = rollbackSql(log);
    expect(sql).toContain(`DELETE FROM "ProductImage" WHERE id IN ('new-1');`);
    expect(sql).toContain(`UPDATE "ProductImage" SET "isHidden" = false WHERE id IN ('old-1');`);
    expect(sql).toContain(`SET "sortOrder" = 0 WHERE id = 'old-1'`);
    expect(sql).toContain(`UPDATE "Category" SET image = 'https://images.unsplash.com/photo-1' WHERE id = 'cat-1';`);
    expect(sql).toContain(`UPDATE "Collection" SET image = 'https://images.unsplash.com/photo-2' WHERE id = 'col-1';`);
    expect(sql).not.toContain("new-2");
  });
});

describe("webpDimensions", () => {
  it("reads a VP8 lossy frame as 1200x1500", () => {
    const buf = Buffer.alloc(30);
    buf.write("RIFF", 0);
    buf.write("WEBP", 8);
    buf.write("VP8 ", 12);
    buf.writeUInt32LE(12, 16);
    buf[23] = 0x9d;
    buf[24] = 0x01;
    buf[25] = 0x2a;
    buf.writeUInt16LE(1200, 26);
    buf.writeUInt16LE(1500, 28);
    expect(webpDimensions(buf)).toEqual({ width: 1200, height: 1500 });
  });
});
