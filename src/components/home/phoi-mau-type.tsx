import Image from "next/image";
import { homeImages } from "@/config/home-images";

/**
 * Large “PHỐI / MÀU / TẠO / CHẤT” stack with photo fill inside PHỐI
 * via background-clip:text (phoi-mau-type.jpg per MAPPING.md).
 */
export function PhoiMauType() {
  return (
    <div
      className="font-[family-name:var(--font-display)] text-4xl leading-[0.92] font-extrabold tracking-tight select-none md:max-w-[5rem] md:text-5xl lg:text-[3.35rem]"
      aria-hidden
    >
      <span className="relative block">
        <span
          className="bg-clip-text text-transparent [-webkit-background-clip:text]"
          style={{
            backgroundImage: `url(${homeImages.colorPlay.typeFill})`,
            backgroundSize: "cover",
            backgroundPosition: "50% 35%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          PHỐI
        </span>
        {/* Fallback outline if clip unsupported */}
        <span className="pointer-events-none absolute inset-0 -z-10 text-[var(--accent)] opacity-0 [@supports_not_(background-clip:text)]:opacity-100">
          PHỐI
        </span>
      </span>
      <span className="mt-1 block text-neutral-900">MÀU</span>
      <span className="mt-1 block text-[var(--accent)]">TẠO</span>
      <span className="mt-1 block text-neutral-900">CHẤT</span>
      {/* Hidden image for preload / LCP hint */}
      <span className="sr-only">
        <Image
          src={homeImages.colorPlay.typeFill}
          alt=""
          width={96}
          height={72}
        />
      </span>
    </div>
  );
}
