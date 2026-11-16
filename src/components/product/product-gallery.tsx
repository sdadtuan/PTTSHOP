"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  images: { url: string; alt: string | null }[];
  name: string;
};

export function ProductGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center bg-neutral-100 text-neutral-400">
        Không có ảnh
      </div>
    );
  }

  return (
    <div className="flex gap-3 md:gap-4">
      <div className="hidden w-16 shrink-0 flex-col gap-2 sm:flex md:w-20">
        {images.map((img, i) => (
          <button
            key={img.url + i}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "relative aspect-square overflow-hidden border bg-neutral-100",
              active === i ? "border-neutral-900" : "border-transparent",
            )}
          >
            <Image
              src={img.url}
              alt={img.alt || name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <div className="relative min-h-[420px] flex-1 overflow-hidden bg-neutral-100 md:aspect-[3/4] md:min-h-0">
        <Image
          src={current.url}
          alt={current.alt || name}
          fill
          priority
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
