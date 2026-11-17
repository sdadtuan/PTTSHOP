"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  url: string;
  alt: string | null;
  color?: string | null;
};

type Props = {
  images: GalleryImage[];
  name: string;
  selectedColor?: string;
};

export function ProductGallery({ images, name, selectedColor }: Props) {
  const filtered = useMemo(() => {
    if (!selectedColor) return images;
    const byColor = images.filter((img) => img.color === selectedColor);
    if (byColor.length > 0) return byColor;
    const unscoped = images.filter((img) => !img.color);
    return unscoped.length > 0 ? unscoped : images;
  }, [images, selectedColor]);

  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    setActive(0);
  }, [selectedColor, filtered.length]);

  const current = filtered[active] ?? filtered[0];

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
        {filtered.map((img, i) => (
          <button
            key={`${img.url}-${i}`}
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
          className={cn(
            "object-cover transition duration-300",
            zoom && "scale-125 cursor-zoom-out",
          )}
          onClick={() => setZoom((v) => !v)}
        />
        <button
          type="button"
          onClick={() => setZoom((v) => !v)}
          className="absolute right-3 bottom-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-sm"
          aria-label={zoom ? "Thu nhỏ" : "Phóng to ảnh"}
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
