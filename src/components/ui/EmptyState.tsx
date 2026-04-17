import { ReactNode } from "react";

interface EmptyStateProps {
    icon?: ReactNode;
    heading: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

function EmptyState({ icon, heading, description, action, className = "" }: EmptyStateProps) {
    return (
        <div
            className={["flex flex-col items-center justify-center gap-3 py-16 text-center", className].join(" ")}
        >
            {icon && (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-[var(--muted)]">
                    {icon}
                </span>
            )}
            <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{heading}</p>
                {description && (
                    <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
                )}
            </div>
            {action && <div className="mt-1">{action}</div>}
        </div>
    );
}

export { EmptyState };
export type { EmptyStateProps };
