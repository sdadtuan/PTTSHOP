import { describe, expect, it } from "vitest";
import {
  planApprovedPrimary,
  webpDimensions,
  type ExistingProductImage,
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

  it("pushes the blank placeholder behind the new photo without hiding it", () => {
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
      { id: "blank", sortOrder: 1, isHidden: false, previous: { sortOrder: 0, isHidden: false } },
    ]);
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
