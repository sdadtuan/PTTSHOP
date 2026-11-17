import type { CSSProperties } from "react";
import { homeImages } from "@/config/home-images";

/**
 * Giant stacked PHỐI / MÀU / TẠO / CHẤT — PHỐI đen, còn lại cam + texture ảnh.
 */
export function PhoiMauType() {
  const textured: CSSProperties = {
    backgroundImage: `linear-gradient(rgba(249,115,22,0.72), rgba(249,115,22,0.72)), url(${homeImages.colorPlay.typeFill})`,
    backgroundSize: "cover",
    backgroundPosition: "50% 28%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  return (
    <div
      className="pointer-events-none font-[family-name:var(--font-display)] text-6xl leading-[0.86] font-black tracking-tight select-none sm:text-7xl md:text-8xl lg:text-[7.25rem]"
      aria-hidden
      data-testid="phoi-mau-type"
    >
      <span className="block text-neutral-900">PHỐI</span>
      <span className="mt-1 block" style={textured}>
        MÀU
      </span>
      <span className="mt-1 block" style={textured}>
        TẠO
      </span>
      <span className="mt-1 block" style={textured}>
        CHẤT
      </span>
    </div>
  );
}
