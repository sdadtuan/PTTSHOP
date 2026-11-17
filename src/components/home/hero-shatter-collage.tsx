"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { FRAME_ASPECT, GAPS, HERO_GRID } from "@/config/home-frame-specs";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  className?: string;
  /** Loop period in ms (shatter → assemble → hold). */
  cycleMs?: number;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setMobile(mq.matches);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
}

/**
 * Hero collage: one photo sliced into a grid that shatters then reassembles.
 * GPU-friendly CSS transforms; respects prefers-reduced-motion.
 */
export function HeroShatterCollage({
  src,
  className,
  cycleMs = 7000,
}: Props) {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const cols = mobile ? HERO_GRID.mobile.cols : HERO_GRID.desktop.cols;
  const rows = mobile ? HERO_GRID.mobile.rows : HERO_GRID.desktop.rows;
  const count = cols * rows;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setTick((t) => t + 1), cycleMs);
    return () => window.clearInterval(id);
  }, [cycleMs, reduced]);

  const cells = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const posX = cols === 1 ? 50 : (col / (cols - 1)) * 100;
        const posY = rows === 1 ? 50 : (row / (rows - 1)) * 100;
        return { i, col, row, posX, posY };
      }),
    [cols, rows, count],
  );

  return (
    <div
      className={cn("hero-shatter", className)}
      style={
        {
          ["--hero-src"]: `url(${src})`,
          ["--hero-cols"]: cols,
          ["--hero-rows"]: rows,
          ["--hero-cycle"]: `${cycleMs}ms`,
          ["--hero-gap"]: `${GAPS.heroCollage.desktop}px`,
          aspectRatio: FRAME_ASPECT.heroCollage,
        } as CSSProperties
      }
      data-testid="hero-shatter-collage"
      data-reduced-motion={reduced ? "true" : "false"}
      data-piece-count={count}
      key={reduced ? "static" : `cycle-${tick}`}
      role="img"
      aria-label="Hero collage VIZFAS"
    >
      {cells.map((cell) => (
        <div
          key={cell.i}
          className={cn("hero-shatter__cell", !reduced && "hero-shatter__cell--anim")}
          style={
            {
              ["--pos-x"]: `${cell.posX}%`,
              ["--pos-y"]: `${cell.posY}%`,
              ["--stagger"]: `${cell.i * 45}ms`,
              ["--dx"]: `${(cell.col - (cols - 1) / 2) * 28}px`,
              ["--dy"]: `${(cell.row - (rows - 1) / 2) * 36 - 20}px`,
              ["--rot"]: `${(cell.i % 2 === 0 ? -1 : 1) * (8 + cell.i * 2)}deg`,
            } as CSSProperties
          }
          data-testid="hero-shatter-cell"
        />
      ))}
    </div>
  );
}
