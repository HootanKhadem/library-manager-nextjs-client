interface AvatarProps {
    name: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizeClasses = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-11 w-11 text-base" };

const bgPalette = [
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
    "bg-emerald-100 text-emerald-700",
    "bg-sky-100 text-sky-700",
    "bg-violet-100 text-violet-700",
    "bg-pink-100 text-pink-700",
];

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorIndex(name: string) {
    return name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % bgPalette.length;
}

function Avatar({ name, size = "md", className = "" }: AvatarProps) {
    return (
        <span
            className={[
                "inline-flex items-center justify-center rounded-full font-semibold select-none shrink-0",
                sizeClasses[size],
                bgPalette[colorIndex(name)],
                className,
            ].join(" ")}
            aria-hidden="true"
        >
            {initials(name)}
        </span>
    );
}

export { Avatar };
