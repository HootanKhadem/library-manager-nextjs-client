import { HTMLAttributes, ReactNode } from "react";

interface TopbarProps {
    onMenuClick?: () => void;
    startSlot?: ReactNode;
    endSlot?: ReactNode;
}

function Topbar({ onMenuClick, startSlot, endSlot }: TopbarProps) {
    return (
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-sm px-4">
            {onMenuClick && (
                <button
                    onClick={onMenuClick}
                    className="lg:hidden rounded-lg p-1.5 text-[var(--muted)] hover:bg-stone-100 hover:text-[var(--foreground)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer"
                    aria-label="Open navigation"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            )}
            {startSlot && <div className="flex-1">{startSlot}</div>}
            {!startSlot && <div className="flex-1" />}
            {endSlot && <div className="flex items-center gap-2">{endSlot}</div>}
        </header>
    );
}

/* ─── PageHeader ─────────────────────────────────────────────────────────── */

interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
    title: string;
    subtitle?: string;
    action?: ReactNode;
}

function PageHeader({ title, subtitle, action, className = "", ...props }: PageHeaderProps) {
    return (
        <div
            className={["flex items-start justify-between gap-4 mb-6", className].join(" ")}
            {...props}
        >
            <div>
                <h1 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">{title}</h1>
                {subtitle && (
                    <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

export { Topbar, PageHeader };
export type { TopbarProps, PageHeaderProps };
