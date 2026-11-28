import { describe, expect, it } from "vitest";
import { canAddLookItem, lookIsPublic, lookbookNav, selectableVariants } from "@/lib/looks";

describe("lookbook", () => {
  it("hides the menu until a look is published", () => {
    const links = [{ href: "/san-pham", label: "Sản phẩm" }, { href: "/lookbook", label: "Lookbook" }];
    expect(lookbookNav(links, 0).map((item) => item.href)).toEqual(["/san-pham"]);
    expect(lookbookNav([{ href: "/san-pham", label: "Sản phẩm" }], 1).map((item) => item.href)).toEqual(["/san-pham", "/lookbook"]);
  });

  it("keeps drafts off the public page", () => {
    expect(lookIsPublic(null)).toBe(false);
    expect(lookIsPublic({ isPublished: false })).toBe(false);
    expect(lookIsPublic({ isPublished: true })).toBe(true);
  });

  it("requires an in-stock size and still lists an out-of-stock item", () => {
    const variants = [
      { id: "a", label: "Đen / M", stock: 0 },
      { id: "b", label: "Kem / L", stock: 2 },
    ];
    expect(selectableVariants(variants).map((item) => item.id)).toEqual(["b"]);
    expect(canAddLookItem(null, variants)).toBe(false);
    expect(canAddLookItem("a", variants)).toBe(false);
    expect(canAddLookItem("b", variants)).toBe(true);
    expect(variants).toHaveLength(2);
  });
});
