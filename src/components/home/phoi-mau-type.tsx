import type { CSSProperties } from "react";
import { TYPE_SCALE } from "@/config/home-type-scale";
import { homeImages } from "@/config/home-images";

/**
 * Giant stacked PHỐI / MÀU / TẠO / CHẤT — PHỐI đen, còn lại cam + texture.
 */
export function PhoiMauType() {
  const textured: CSSProperties = {
    backgroundImage: `linear-gradient(rgba(249,115,22,0.78), rgba(249,115,22,0.78)), url(${homeImages.colorPlay.typeFill})`,
    backgroundSize: "cover",
    backgroundPosition: "50% 28%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  return (
    <div
      className="pointer-events-none font-[family-name:var(--font-display)] leading-[0.84] font-black tracking-tight select-none"
      style={{ fontSize: TYPE_SCALE.phoiType.css }}
      aria-hidden
      data-testid="phoi-mau-type"
    >
      <span className="block text-neutral-900">PHỐI</span>
      <span className="mt-0.5 block" style={textured}>
        MÀU
      </span>
      <span className="mt-0.5 block" style={textured}>
        TẠO
      </span>
      <span className="mt-0.5 block" style={textured}>
        CHẤT
      </span>
    </div>
  );
}
