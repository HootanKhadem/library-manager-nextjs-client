interface StarRatingProps {
    rating: number;
    max?: number;
}

export default function StarRating({rating, max = 5}: StarRatingProps) {
    return (
        <span className="text-[#b8922a] text-xs tracking-wide" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({length: max}, (_, i) => (i < rating ? "★" : "☆")).join("")}
    </span>
    );
}
