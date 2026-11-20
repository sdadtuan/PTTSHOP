import { describe, expect, it } from "vitest";
import { DANH_GIA_NAV_HREF, insertDanhGiaNavLink } from "@/lib/cms/nav-patches";

describe("insertDanhGiaNavLink", () => {
  it("inserts after Sản phẩm without duplicating", () => {
    const nav = [
      { href: "/", label: "Trang Chủ" },
      { href: "/san-pham", label: "Sản Phẩm" },
      { href: "/lien-he", label: "Liên Hệ" },
    ];
    const next = insertDanhGiaNavLink(nav);
    expect(next.map((l) => l.href)).toEqual(["/", "/san-pham", DANH_GIA_NAV_HREF, "/lien-he"]);
    expect(insertDanhGiaNavLink(next)).toBe(next);
  });
});