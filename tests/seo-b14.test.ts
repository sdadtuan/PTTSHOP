import { describe, expect, it } from "vitest";
import { listingRobots, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

describe("seo B1.4", () => {
  it("bỏ trường trống của Organization", () => {
    const data = organizationJsonLd({ name: "PTT Shop", url: "https://pttshop.vn", telephone: null, email: "", address: null });
    expect(data).not.toHaveProperty("telephone");
    expect(data).not.toHaveProperty("email");
    expect(data).not.toHaveProperty("address");
  });

  it("giữ SĐT và địa chỉ khi có", () => {
    const data = organizationJsonLd({
      name: "PTT Shop",
      url: "https://pttshop.vn",
      telephone: "0900000000",
      address: "Quận 1",
    });
    expect(data.telephone).toBe("0900000000");
    expect(data.address).toEqual({ "@type": "PostalAddress", streetAddress: "Quận 1" });
  });

  it("SearchAction trỏ tới /san-pham?q=", () => {
    const site = websiteJsonLd({ name: "PTT Shop", url: "https://pttshop.vn" });
    expect(site.potentialAction.target).toBe("https://pttshop.vn/san-pham?q={search_term_string}");
  });

  it("noindex khi có q hoặc nhiều tham số lọc", () => {
    expect(listingRobots({ q: "áo" }).index).toBe(false);
    expect(listingRobots({ color: "Đen", size: "L" }).canonical).toBe("/san-pham");
    expect(listingRobots({ color: "Đen" }).index).toBe(true);
  });
});
