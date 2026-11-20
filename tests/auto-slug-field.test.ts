import { describe, expect, it } from "vitest";
import {
  EMPTY_AUTO_SLUG,
  autoSlugOnNameChange,
  autoSlugOnSlugChange,
  autoSlugStateForEdit,
  slugFromDisplayName,
} from "@/lib/auto-slug-field";

describe("auto slug field", () => {
  it("fills slug live from Vietnamese name", () => {
    let s = EMPTY_AUTO_SLUG;
    s = autoSlugOnNameChange(s, "quần jean");
    expect(s.slug).toBe("quan-jean");
    expect(slugFromDisplayName("Quần Jean Ống Rộng")).toBe("quan-jean-ong-rong");
  });

  it("stops auto when slug edited; resumes when cleared", () => {
    let s = autoSlugOnNameChange(EMPTY_AUTO_SLUG, "Áo thun");
    expect(s.slug).toBe("ao-thun");
    s = autoSlugOnSlugChange(s, "custom-slug");
    expect(s.slugManual).toBe(true);
    s = autoSlugOnNameChange(s, "Áo khoác");
    expect(s.slug).toBe("custom-slug");
    s = autoSlugOnSlugChange(s, "");
    expect(s.slugManual).toBe(false);
    expect(s.slug).toBe("ao-khoac");
  });

  it("preserves slug on edit until cleared", () => {
    const s = autoSlugStateForEdit("Quần jean", "legacy-slug");
    expect(s.slugManual).toBe(true);
    const next = autoSlugOnNameChange(s, "Quần jean mới");
    expect(next.slug).toBe("legacy-slug");
  });
});