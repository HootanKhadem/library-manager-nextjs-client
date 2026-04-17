import { InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helper?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helper, className = "", id, ...props }, ref) => {
        const generatedId = useId();
        const inputId = id ?? generatedId;

        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-[var(--foreground)]"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={[
                        "h-9 w-full rounded-lg border bg-[var(--card)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none transition-colors",
                        "focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20",
                        error
                            ? "border-[var(--destructive)] focus:border-[var(--destructive)] focus:ring-[var(--destructive)]/20"
                            : "border-[var(--border)] hover:border-[var(--border-strong)]",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        className,
                    ].join(" ")}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
                    {...props}
                />
                {error && (
                    <p id={`${inputId}-error`} className="text-xs text-[var(--destructive)]">
                        {error}
                    </p>
                )}
                {!error && helper && (
                    <p id={`${inputId}-helper`} className="text-xs text-[var(--muted)]">
                        {helper}
                    </p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
export type { InputProps };
