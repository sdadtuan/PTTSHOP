import { missingProductImageAlt } from "@/lib/product-image-placeholder";
import { cn } from "@/lib/utils";

/** Ô thay ảnh thiếu hoặc ảnh lỗi. Có chữ và tên gọi cho trình đọc màn hình, không để nền xám trống. */
export function ProductImagePlaceholder({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const label = missingProductImageAlt(name);
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "absolute inset-0 flex items-center justify-center border border-dashed border-neutral-300 bg-white px-4 text-center",
        className,
      )}
    >
      <span className="text-sm font-medium leading-snug text-neutral-800">{label}</span>
    </div>
  );
}
