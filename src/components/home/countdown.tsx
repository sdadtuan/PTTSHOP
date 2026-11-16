"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown({ endsAt }: { endsAt: string }) {
  const [left, setLeft] = useState({ h: "00", m: "00", s: "00" });

  useEffect(() => {
    const target = new Date(endsAt).getTime();

    function tick() {
      const diff = Math.max(0, target - Date.now());
      const totalSec = Math.floor(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setLeft({ h: pad(h), m: pad(m), s: pad(s) });
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return (
    <div className="flex items-center gap-1.5 font-mono text-sm font-semibold md:text-base">
      <span className="rounded bg-neutral-900 px-2 py-1 text-white">{left.h}</span>
      <span>:</span>
      <span className="rounded bg-neutral-900 px-2 py-1 text-white">{left.m}</span>
      <span>:</span>
      <span className="rounded bg-neutral-900 px-2 py-1 text-white">{left.s}</span>
    </div>
  );
}
