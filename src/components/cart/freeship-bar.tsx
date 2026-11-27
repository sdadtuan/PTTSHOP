import { formatVnd } from "@/lib/format";
import { freeshipProgress } from "@/lib/shipping/progress";

export function FreeshipBar({
  subtotal,
  threshold,
}: {
  subtotal: number;
  threshold: number | null;
}) {
  const progress = freeshipProgress(subtotal, threshold);
  if (!progress) return null;
  return (
    <div className="mt-3" data-testid="freeship-bar">
      <div className="h-1.5 overflow-hidden rounded bg-neutral-100" aria-hidden="true">
        <div className="h-full bg-neutral-900" style={{ width: `${progress.percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-neutral-600">
        {progress.reached
          ? "Bạn được miễn phí vận chuyển"
          : `Còn thiếu ${formatVnd(progress.remaining)} để miễn phí vận chuyển`}
      </p>
    </div>
  );
}
