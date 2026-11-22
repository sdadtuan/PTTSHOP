"use client";

import { StorefrontImage } from "@/components/product/storefront-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Search, Volume2, VolumeX } from "lucide-react";
import { mediaListKey } from "@/lib/media-list-key";
import { firstColorPhotoIndex, isVideoMedia, mediaForColor } from "@/lib/product-media";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  id?: string;
  url: string;
  alt: string | null;
  color?: string | null;
  type?: string | null;
  posterUrl?: string | null;
  isHidden?: boolean | null;
};

type Props = {
  images: GalleryImage[];
  name: string;
  selectedColor?: string;
  /** Increments every time the shopper picks a colour (even the same one again). */
  colorPickNonce?: number;
};

const isVideo = (img: GalleryImage) => isVideoMedia(img);

export function ProductGallery({ images, name, selectedColor, colorPickNonce = 0 }: Props) {
  const filtered = useMemo(
    () => mediaForColor(images, selectedColor),
    [images, selectedColor],
  );

  // Selection is remembered per colour: on first load the video (index 0)
  // stays in the main frame; when the shopper picks another colour the main
  // frame jumps to that colour's first photo. Derived state — no effect needed.
  const [sel, setSel] = useState<{ color?: string; nonce: number; index: number; zoom: boolean }>({
    color: selectedColor,
    nonce: colorPickNonce,
    index: 0,
    zoom: false,
  });
  const sameColor = sel.color === selectedColor && sel.nonce === colorPickNonce;
  const active = Math.min(
    sameColor ? sel.index : firstColorPhotoIndex(filtered, selectedColor),
    Math.max(0, filtered.length - 1),
  );
  const zoom = sameColor ? sel.zoom : false;
  const setZoom = (fn: (v: boolean) => boolean) =>
    setSel({ color: selectedColor, nonce: colorPickNonce, index: active, zoom: fn(zoom) });
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
    setSel({ color: selectedColor, nonce: colorPickNonce, index: i, zoom: false });
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
            "relative aspect-square w-16 shrink-0 overflow-hidden border bg-neutral-100 sm:w-full",
            active === i ? "border-neutral-900" : "border-transparent",
          )}
          aria-label={isVideo(img) ? `Video ${i + 1}` : `Ảnh ${i + 1}`}
          data-testid={isVideo(img) ? "gallery-thumb-video" : "gallery-thumb-image"}
          data-active={active === i ? "true" : "false"}
          data-url={img.url}
        >
          {isVideo(img) ? (
            <>
              {img.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.posterUrl}
                  alt={img.alt || name}
                  className="h-full w-full object-cover"
                />
              ) : (
                // Không có poster: dùng chính khung đầu của video làm thumbnail
                // (trước đây render <img src=".mp4"> → ảnh vỡ hiện alt text).
                <video
                  src={`${img.url}#t=0.1`}
                  muted
                  playsInline
                  preload="metadata"
                  className="pointer-events-none h-full w-full object-cover"
                  aria-hidden="true"
                />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-xs font-semibold text-white">
                ▶
              </span>
            </>
          ) : (
            <StorefrontImage
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
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex gap-3 md:gap-4">
        <div
          className="hidden max-h-[720px] w-16 shrink-0 flex-col gap-2 overflow-y-auto sm:flex md:w-20"
          data-testid="gallery-thumbs-desktop"
        >
          {thumbs}
        </div>

        <div
          className="relative max-md:aspect-[3/4] max-md:max-h-[380px] max-md:min-h-0 flex-1 overflow-hidden bg-neutral-100 md:aspect-[3/4] md:min-h-0"
          data-testid="gallery-main"
          data-current-url={current.url}
          data-current-type={currentIsVideo ? "video" : "image"}
        >
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
                className="absolute inset-0 h-full w-full bg-neutral-100 object-contain max-md:object-contain md:object-cover"
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
              <StorefrontImage
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

      <div
        className="flex gap-2 overflow-x-auto sm:hidden"
        data-testid="gallery-thumbs-mobile"
      >
        {thumbs}
      </div>
    </div>
  );
}
