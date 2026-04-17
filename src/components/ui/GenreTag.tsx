interface GenreTagProps {
    genre: string;
    className?: string;
}

function GenreTag({ genre, className = "" }: GenreTagProps) {
    return (
        <span
            className={[
                "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-stone-100 text-[var(--muted)] border border-[var(--border)]",
                className,
            ].join(" ")}
        >
            {genre}
        </span>
    );
}

export { GenreTag };
