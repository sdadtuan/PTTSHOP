import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

describe("safeCallbackUrl", () => {
  it("allows relative app paths", () => {
    expect(safeCallbackUrl("/admin")).toBe("/admin");
    expect(safeCallbackUrl("/admin/products?q=ao")).toBe("/admin/products?q=ao");
    expect(safeCallbackUrl("/tai-khoan")).toBe("/tai-khoan");
  });

  it("rejects auth pages to prevent redirect loops", () => {
    expect(safeCallbackUrl("/dang-nhap")).toBe("/");
    expect(safeCallbackUrl("/dang-nhap?callbackUrl=/admin")).toBe("/");
    expect(safeCallbackUrl("/dang-ky")).toBe("/");
    expect(safeCallbackUrl("/quen-mat-khau")).toBe("/");
    expect(safeCallbackUrl("/api/auth/signin")).toBe("/");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeCallbackUrl("https://evil.example/phish")).toBe("/");
    expect(safeCallbackUrl("//evil.example")).toBe("/");
    expect(safeCallbackUrl("\\evil")).toBe("/");
  });

  it("uses fallback when empty", () => {
    expect(safeCallbackUrl(null, "/admin")).toBe("/admin");
    expect(safeCallbackUrl(undefined)).toBe("/");
    expect(safeCallbackUrl("")).toBe("/");
  });
});
