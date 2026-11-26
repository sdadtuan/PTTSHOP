"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ProductImagePlaceholder } from "@/components/product/product-image-placeholder";
import { isCatalogMediaSrc } from "@/lib/catalog-image";
import { isBlankProductPlaceholder } from "@/lib/product-image-placeholder";

type Props = ImageProps & {
  /** Tên sản phẩm hoặc ô, dùng khi file trống hoặc tải lỗi. */
  emptyName?: string;
};

/** Ảnh cửa hàng. /media/ bỏ qua optimizer vì Nginx mới phục vụ được file đó. */
export function StorefrontImage({ src, unoptimized, emptyName, alt, onError, ...rest }: Props) {
  const value = typeof src === "string" ? src : "";
  const [failed, setFailed] = useState(false);
  if (!value || isBlankProductPlaceholder(value) || failed) {
    const name = (emptyName || (typeof alt === "string" ? alt : "")).trim() || "sản phẩm";
    return <ProductImagePlaceholder name={name} />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      unoptimized={Boolean(unoptimized) || isCatalogMediaSrc(value)}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      {...rest}
    />
  );
}
