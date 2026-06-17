interface SkeletonProps {
    className?: string;
}

function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div
            aria-hidden="true"
            className={["animate-pulse rounded bg-stone-100", className].join(" ")}
        />
    );
}

export { Skeleton };
export type { SkeletonProps };
