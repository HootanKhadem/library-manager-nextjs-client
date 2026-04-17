import { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "muted";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
    default: "bg-[var(--accent-subtle)] text-[var(--accent)] border border-rose-200",
    success: "bg-green-50 text-green-700 border border-green-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger:  "bg-red-50 text-red-700 border border-red-200",
    muted:   "bg-stone-100 text-[var(--muted)] border border-[var(--border)]",
};

function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
    return (
        <span
            className={[
                "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap",
                variantClasses[variant],
                className,
            ].join(" ")}
            {...props}
        >
            {children}
        </span>
    );
}

export { Badge };
export type { BadgeProps, BadgeVariant };
