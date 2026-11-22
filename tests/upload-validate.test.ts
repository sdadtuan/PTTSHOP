import { describe, expect, it } from "vitest";
import {
  IMAGE_MAX_BYTES,
  VIDEO_MAX_BYTES,
  validateCatalogImage,
  validateUploadFile,
} from "@/lib/upload-validate";

describe("validateUploadFile", () => {
  it("accepts jpeg/png/webp/gif under image limit", () => {
    for (const [mime, name] of [
      ["image/jpeg", "a.jpg"],
      ["image/png", "a.png"],
      ["image/webp", "a.webp"],
      ["image/gif", "a.gif"],
    ] as const) {
      const r = validateUploadFile({
        mime,
        size: IMAGE_MAX_BYTES,
        name,
      });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.kind).toBe("image");
    }
  });

  it("rejects image over 5MB", () => {
    const r = validateUploadFile({
      mime: "image/jpeg",
      size: IMAGE_MAX_BYTES + 1,
      name: "big.jpg",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/5MB/i);
  });

  it("accepts mp4/webm under video limit", () => {
    for (const [mime, name] of [
      ["video/mp4", "clip.mp4"],
      ["video/webm", "clip.webm"],
    ] as const) {
      const r = validateUploadFile({
        mime,
        size: VIDEO_MAX_BYTES,
        name,
      });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.kind).toBe("video");
    }
  });

  it("rejects video over 100MB", () => {
    const r = validateUploadFile({
      mime: "video/mp4",
      size: VIDEO_MAX_BYTES + 1,
      name: "huge.mp4",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/100MB/i);
  });

  it("rejects disallowed mime", () => {
    const r = validateUploadFile({
      mime: "application/pdf",
      size: 100,
      name: "x.pdf",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects mime/extension mismatch", () => {
    const r = validateUploadFile({
      mime: "video/mp4",
      size: 1000,
      name: "fake.png",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/không khớp|đuôi/i);
  });

  it("catalog images trust the bytes and reject svg or html", () => {
    const png = Uint8Array.from(Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    ));
    const ok = validateCatalogImage({ name: "anh.png", size: png.length, buffer: png });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.ext).toBe("png");
    const svg = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>");
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    expect(validateCatalogImage({ name: "x.svg", size: svg.length, buffer: svg }).ok).toBe(false);
    expect(validateCatalogImage({ name: "x.html", size: html.length, buffer: html }).ok).toBe(false);
    expect(validateCatalogImage({ name: "x.svg", size: png.length, buffer: png }).ok).toBe(false);
    const avif = new Uint8Array(12);
    avif.set([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]);
    const av = validateCatalogImage({ name: "a.avif", size: avif.length, buffer: avif });
    expect(av.ok).toBe(true);
    if (av.ok) expect(av.ext).toBe("avif");
  });
});
