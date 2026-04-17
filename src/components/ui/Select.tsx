import { SelectHTMLAttributes, forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helper?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, helper, className = "", id, children, ...props }, ref) => {
        const generatedId = useId();
        const selectId = id ?? generatedId;

        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label
                        htmlFor={selectId}
                        className="text-sm font-medium text-[var(--foreground)]"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={[
                            "h-9 w-full appearance-none rounded-lg border bg-[var(--card)] ps-3 pe-9 text-sm text-[var(--foreground)] outline-none transition-colors",
                            "focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20",
                            error
                                ? "border-[var(--destructive)] focus:border-[var(--destructive)] focus:ring-[var(--destructive)]/20"
                                : "border-[var(--border)] hover:border-[var(--border-strong)]",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            className,
                        ].join(" ")}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${selectId}-error` : helper ? `${selectId}-helper` : undefined}
                        {...props}
                    >
                        {children}
                    </select>
                    <ChevronDown
                        className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]"
                        aria-hidden="true"
                    />
                </div>
                {error && (
                    <p id={`${selectId}-error`} className="text-xs text-[var(--destructive)]">
                        {error}
                    </p>
                )}
                {!error && helper && (
                    <p id={`${selectId}-helper`} className="text-xs text-[var(--muted)]">
                        {helper}
                    </p>
                )}
            </div>
        );
    }
);
Select.displayName = "Select";

export { Select };
export type { SelectProps };
