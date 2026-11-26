import { describe, expect, it } from "vitest";
import { collectionTileSrc } from "@/lib/collection-tile";
import {
  isBlankProductPlaceholder,
  missingProductImageAlt,
  shopDisplaySrc,
} from "@/lib/product-image-placeholder";
import { primaryImage } from "@/lib/product-media";
import {
  isAllowedNewMediaUrl,
  isAllowedProductMediaUrl,
} from "@/lib/product-media-url";

describe("B0.3 product image placeholder", () => {
  it("names the empty state in Vietnamese and drops the blank placeholder file", () => {
    expect(missingProductImageAlt("Nón Baseball Classic")).toBe("Chưa có ảnh Nón Baseball Classic");
    expect(missingProductImageAlt("  ")).toBe("Chưa có ảnh sản phẩm");
    expect(isBlankProductPlaceholder("/images/placeholder-product.png")).toBe(true);
    expect(isBlankProductPlaceholder("/images/placeholder-product.svg?v=1")).toBe(true);
    expect(shopDisplaySrc("/images/placeholder-product.png")).toBeNull();
    expect(shopDisplaySrc("")).toBeNull();
    expect(shopDisplaySrc("https://images.unsplash.com/photo-1")).toBe(
      "https://images.unsplash.com/photo-1",
    );
    expect(shopDisplaySrc("/media/catalog/real.jpg")).toBe("/media/catalog/real.jpg");
  });

  it("storefront primary image skips isHidden rows", () => {
    const list = [
      { url: "/images/placeholder-product.png", isHidden: false },
      { url: "/media/hidden.jpg", isHidden: true },
      { url: "/media/show.jpg", isHidden: false },
    ];
    expect(primaryImage(list)?.url).toBe("/images/placeholder-product.png");
    expect(primaryImage(list.filter((img) => shopDisplaySrc(img.url)))?.url).toBe("/media/show.jpg");
    expect(primaryImage([{ url: "/media/only.jpg", isHidden: true }])).toBeUndefined();
  });

  it("category tile without an image does not borrow the accessory photo for Nữ", () => {
    expect(collectionTileSrc({ imageUrl: "", resolvedCategorySlug: "nu" })).toBeNull();
    expect(
      collectionTileSrc({
        imageUrl: "/images/home-v2/cat-phu-kien.jpg",
        resolvedCategorySlug: "nu",
      }),
    ).toBeNull();
    expect(
      collectionTileSrc({
        imageUrl: "/images/home-v2/cat-phu-kien.jpg",
        resolvedCategorySlug: "phu-kien",
      }),
    ).toBe("/images/home-v2/cat-phu-kien.jpg");
    expect(
      collectionTileSrc({
        imageUrl: "/images/home-v2/cat-ao-thun.jpg",
        resolvedCategorySlug: "ao-thun",
      }),
    ).toBe("/images/home-v2/cat-ao-thun.jpg");
  });

  it("blocks new external image hosts and keeps an Unsplash URL only when it is already stored", () => {
    expect(isAllowedNewMediaUrl("/media/uploads/a.jpg")).toBe(true);
    expect(isAllowedNewMediaUrl("/images/home-v2/hero-main.jpg")).toBe(true);
    expect(isAllowedNewMediaUrl("https://cdn.vietqr.io/image/x.png")).toBe(true);
    expect(isAllowedNewMediaUrl("https://images.unsplash.com/photo-1")).toBe(false);
    expect(isAllowedNewMediaUrl("https://evil.example/x.jpg")).toBe(false);
    const existing = new Set(["https://images.unsplash.com/photo-kept"]);
    expect(isAllowedProductMediaUrl("https://images.unsplash.com/photo-kept", existing)).toBe(true);
    expect(isAllowedProductMediaUrl("https://images.unsplash.com/photo-new", existing)).toBe(false);
    expect(isAllowedProductMediaUrl("https://images.unsplash.com/photo-kept", new Set())).toBe(false);
  });
});
