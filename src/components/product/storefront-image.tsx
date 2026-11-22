import Image, { type ImageProps } from "next/image";
import { isCatalogMediaSrc } from "@/lib/catalog-image";

/** Ảnh cửa hàng. /media/ bỏ qua optimizer vì Nginx mới phục vụ được file đó. */
export function StorefrontImage({ src, unoptimized, ...rest }: ImageProps) {
  const value = typeof src === "string" ? src : "";
  return (
    <Image
      src={src}
      unoptimized={Boolean(unoptimized) || isCatalogMediaSrc(value)}
      {...rest}
    />
  );
}
