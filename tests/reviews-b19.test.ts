import { describe, expect, it } from "vitest";
import { reviewMediaDecision } from "@/lib/reviews/media";
import { detectMimeFromBuffer } from "@/lib/upload-validate";

describe("đánh giá thật", () => {
  it("từ chối file không phải ảnh hoặc video dù khai báo khác", () => {
    const text = new Uint8Array(Buffer.from("#!/bin/sh\necho hi\n"));
    expect(detectMimeFromBuffer(text)).toBeNull();
    expect(reviewMediaDecision(text.length, detectMimeFromBuffer(text)).ok).toBe(false);
  });

  it("nhận JPEG đúng kích thước và chặn ảnh quá lớn", () => {
    const jpeg = new Uint8Array(16);
    jpeg[0] = 0xff;
    jpeg[1] = 0xd8;
    jpeg[2] = 0xff;
    expect(reviewMediaDecision(jpeg.length, detectMimeFromBuffer(jpeg))).toMatchObject({
      ok: true,
      kind: "image",
      ext: "jpg",
    });
    expect(reviewMediaDecision(6 * 1024 * 1024, "image/jpeg").ok).toBe(false);
  });
});
