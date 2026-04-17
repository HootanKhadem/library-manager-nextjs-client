import { Star } from "lucide-react";

interface StarRatingProps {
    value: number;   // 0-5, supports halves
    max?: number;
    size?: number;
    className?: string;
}

function StarRating({ value, max = 5, size = 14, className = "" }: StarRatingProps) {
    return (
        <span className={["inline-flex items-center gap-0.5", className].join(" ")} aria-label={`${value} out of ${max} stars`}>
            {Array.from({ length: max }, (_, i) => (
                <Star
                    key={i}
                    width={size}
                    height={size}
                    className={i < Math.round(value) ? "text-amber-400 fill-amber-400" : "text-stone-300 fill-stone-200"}
                    aria-hidden="true"
                />
            ))}
        </span>
    );
}

export { StarRating };
