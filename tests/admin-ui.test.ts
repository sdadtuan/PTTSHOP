import { describe, expect, it } from "vitest";
import {
  orderStatusTone,
  paginate,
  adminTokens,
} from "@/components/admin/ui/tokens";

describe("admin design tokens", () => {
  it("keeps cream/white + orange brand palette", () => {
    expect(adminTokens.color.bg).toBe("#fdfcf8");
    expect(adminTokens.color.surface).toBe("#ffffff");
    expect(adminTokens.color.accent).toBe("#f97316");
    expect(adminTokens.color.text).toBe("#171717");
  });
});

describe("orderStatusTone", () => {
  it("maps order statuses to badge tones", () => {
    expect(orderStatusTone("PENDING")).toBe("pending");
    expect(orderStatusTone("CONFIRMED")).toBe("info");
    expect(orderStatusTone("SHIPPING")).toBe("shipping");
    expect(orderStatusTone("COMPLETED")).toBe("success");
    expect(orderStatusTone("CANCELLED")).toBe("danger");
    expect(orderStatusTone("UNKNOWN")).toBe("info");
  });
});

describe("paginate", () => {
  it("slices items and clamps page bounds", () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    expect(paginate(items, 1, 3)).toEqual({
      page: 1,
      totalPages: 3,
      total: 7,
      items: [1, 2, 3],
    });
    expect(paginate(items, 99, 3).page).toBe(3);
    expect(paginate(items, 0, 3).page).toBe(1);
    expect(paginate([], 1, 10)).toEqual({
      page: 1,
      totalPages: 1,
      total: 0,
      items: [],
    });
  });
});
