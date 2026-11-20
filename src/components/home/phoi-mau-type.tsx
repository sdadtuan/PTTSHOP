import type { CSSProperties } from "react";
import { TYPE_SCALE } from "@/config/home-type-scale";
import { homeImages } from "@/config/home-images";

/**
 * Giant stacked PHỐI / MÀU / TẠO / CHẤT — PHỐI đen, còn lại cam + texture.
 */
export function PhoiMauType({ fillImage }: { fillImage?: string } = {}) {
  // fillImage is CMS-validated (isSafeMediaUrl: no quotes/parentheses/whitespace).
  const fill = fillImage || homeImages.colorPlay.typeFill;
  const textured: CSSProperties = {
    backgroundImage: `linear-gradient(rgba(249,115,22,0.78), rgba(249,115,22,0.78)), url(${fill})`,
    backgroundSize: "cover",
    backgroundPosition: "50% 28%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  return (
    <div
      className="type-stack phoi-mau-type-stack pointer-events-none select-none"
      style={
        {
          ["--phoi-type-fs" as string]: TYPE_SCALE.phoiType.css,
          ["--phoi-type-fs-mobile" as string]: TYPE_SCALE.phoiTypeMobile.css,
        } as CSSProperties
      }
      aria-hidden
      data-testid="phoi-mau-type"
    >
      <span className="type-stack-line text-neutral-900">PHỐI</span>
      <span className="type-stack-line" style={textured}>
        MÀU
      </span>
      <span className="type-stack-line" style={textured}>
        TẠO
      </span>
      <span className="type-stack-line" style={textured}>
        CHẤT
      </span>
    </div>
  );
}
