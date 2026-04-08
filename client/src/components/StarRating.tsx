import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  className?: string;
  showValue?: boolean;
}

export function StarRating({ rating, max = 5, size = 14, className, showValue = false }: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => {
    const filled = i + 1 <= Math.floor(rating);
    const partial = !filled && i < rating && rating - i > 0;
    const pct = partial ? Math.round((rating - i) * 100) : 0;
    return { filled, partial, pct };
  });

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {stars.map((star, i) => (
        <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
          {/* Empty star */}
          <Star
            size={size}
            className="star-empty absolute inset-0"
            style={{ fill: "hsl(var(--border))", stroke: "none" }}
          />
          {/* Filled/partial star */}
          <span
            className="absolute inset-0 overflow-hidden"
            style={{ width: star.filled ? "100%" : star.partial ? `${star.pct}%` : "0%" }}
          >
            <Star
              size={size}
              className="star-filled"
              style={{ fill: "hsl(var(--color-star))", stroke: "none", minWidth: size }}
            />
          </span>
        </span>
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-semibold text-foreground tabular-nums">{rating.toFixed(1)}</span>
      )}
    </span>
  );
}
