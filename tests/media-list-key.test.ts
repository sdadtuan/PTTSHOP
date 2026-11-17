import { describe, expect, it } from "vitest";
import { mediaListKey } from "@/lib/media-list-key";

describe("mediaListKey", () => {
  it("prefers id when present", () => {
    expect(
      mediaListKey(
        { id: "img_1", url: "/images/ai-hoodies/nau-front.jpg" },
        0,
      ),
    ).toBe("img_1");
  });

  it("falls back to url-index when id missing so duplicate urls stay unique", () => {
    const url = "/images/ai-hoodies/nau-front.jpg";
    expect(mediaListKey({ url }, 0)).toBe(`${url}-0`);
    expect(mediaListKey({ url }, 1)).toBe(`${url}-1`);
    expect(mediaListKey({ id: null, url }, 2)).toBe(`${url}-2`);
  });
});
