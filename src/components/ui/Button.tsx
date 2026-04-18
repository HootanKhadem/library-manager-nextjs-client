"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
    primary:
        "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
    secondary:
        "bg-transparent text-[var(--foreground)] border border-[var(--border)] hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
    ghost:
        "bg-transparent text-[var(--muted)] hover:bg-stone-100 hover:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
    danger:
        "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
};

const sizeClasses: Record<Size, string> = {
    sm: "h-7 px-3 text-xs gap-1.5",
    md: "h-9 px-4 text-sm gap-2",
    lg: "h-11 px-6 text-base gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", size = "md", loading, disabled, className = "", children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={[
                    "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                    variantClasses[variant],
                    sizeClasses[size],
                    className,
                ].join(" ")}
                {...props}
            >
                {loading && (
                    <svg
                        className="animate-spin h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                )}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
