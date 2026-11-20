import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  size = "sm",
  className,
}: {
  rating: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const full = Math.round(rating);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-amber-500",
        size === "md" ? "text-base" : "text-sm",
        className,
      )}
      aria-label={`${rating} trên 5 sao`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= full ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}