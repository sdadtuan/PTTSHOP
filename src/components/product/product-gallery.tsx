"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Search, Volume2, VolumeX } from "lucide-react";
import { mediaListKey } from "@/lib/media-list-key";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  id?: string;
  url: string;
  alt: string | null;
  color?: string | null;
  type?: string | null;
  posterUrl?: string | null;
};

type Props = {
  images: GalleryImage[];
  name: string;
  selectedColor?: string;
};

function isVideo(img: GalleryImage) {
  if ((img.type || "").toLowerCase() === "video") return true;
  const u = (img.url || "").toLowerCase();
  return u.endsWith(".mp4") || u.endsWith(".webm") || u.includes("video/");
}

function prioritizeMedia(list: GalleryImage[]) {
  const videos = list.filter(isVideo);
  const photos = list.filter((img) => !isVideo(img));
  return [...videos, ...photos];
}

function dedupe(list: GalleryImage[]) {
  const seen = new Set<string>();
  return list.filter((img) => {
    const key = `${img.type || "image"}:${img.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function ProductGallery({ images, name, selectedColor }: Props) {
  const filtered = useMemo(() => {
    if (!selectedColor) return prioritizeMedia(images);

    const colorExact = images.filter((img) => img.color === selectedColor);
    const colorVideos = colorExact.filter(isVideo);
    const colorPhotos = colorExact.filter((img) => !isVideo(img));

    const unscoped = images.filter((img) => !img.color);
    const unscopedVideos = unscoped.filter(isVideo);
    const unscopedPhotos = unscoped.filter((img) => !isVideo(img));

    // Prefer: video đúng màu → video chung → ảnh đúng màu → ảnh chung → tất cả
    const preferred = dedupe([
      ...colorVideos,
      ...unscopedVideos,
      ...colorPhotos,
      ...unscopedPhotos,
    ]);
    return preferred.length > 0 ? preferred : prioritizeMedia(images);
  }, [images, selectedColor]);

  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setActive(0);
    setZoom(false);
    setPlaying(true);
  }, [selectedColor, filtered.length]);

  const current = filtered[active] ?? filtered[0];
  const currentIsVideo = current ? isVideo(current) : false;

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !currentIsVideo) return;
    el.muted = muted;
    if (playing) {
      void el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [current, currentIsVideo, muted, playing, active]);

  function selectThumb(i: number) {
    const next = filtered[i];
    if (videoRef.current && (!next || !isVideo(next))) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      setPlaying(true);
    }
    setZoom(false);
    setActive(i);
  }

  if (!current) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center bg-neutral-100 text-neutral-400">
        Không có ảnh
      </div>
    );
  }

  const thumbs = (
    <>
      {filtered.map((img, i) => (
        <button
          key={mediaListKey(img, i)}
          type="button"
          onClick={() => selectThumb(i)}
          className={cn(
            "relative aspect-square overflow-hidden border bg-neutral-100",
            active === i ? "border-neutral-900" : "border-transparent",
          )}
          aria-label={isVideo(img) ? `Video ${i + 1}` : `Ảnh ${i + 1}`}
          data-testid={isVideo(img) ? "gallery-thumb-video" : "gallery-thumb-image"}
        >
          {isVideo(img) ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.posterUrl || img.url}
                alt={img.alt || name}
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-xs font-semibold text-white">
                ▶
              </span>
            </>
          ) : (
            <Image
              src={img.url}
              alt={img.alt || name}
              fill
              sizes="80px"
              className="object-cover"
            />
          )}
        </button>
      ))}
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3 md:gap-4">
        <div className="hidden w-16 shrink-0 flex-col gap-2 sm:flex md:w-20">
          {thumbs}
        </div>

        <div className="relative min-h-[420px] flex-1 overflow-hidden bg-neutral-100 md:aspect-[3/4] md:min-h-0">
          {currentIsVideo ? (
            <>
              <video
                key={current.id ?? `${current.url}-main`}
                ref={videoRef}
                src={current.url}
                poster={current.posterUrl || undefined}
                autoPlay
                muted={muted}
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
                data-testid="pdp-product-video"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
              <div className="absolute right-3 bottom-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPlaying((v) => !v)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-sm"
                  aria-label={playing ? "Tạm dừng video" : "Phát video"}
                >
                  {playing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMuted((v) => !v)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-sm"
                  aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}
                >
                  {muted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto sm:hidden">{thumbs}</div>
    </div>
  );
}
