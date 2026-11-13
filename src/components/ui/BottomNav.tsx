import { ReactNode } from "react";
import Link from "next/link";

/* ─── Shell ─────────────────────────────────────────────────────────────── */

function BottomNavShell({ children }: { children: ReactNode }) {
    return (
        <nav
            data-testid="bottom-nav"
            aria-label="Main navigation"
            className="fixed inset-x-0 bottom-0 z-30 flex lg:hidden items-stretch border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
        >
            {children}
        </nav>
    );
}

/* ─── Tab ───────────────────────────────────────────────────────────────── */

interface BottomNavTabProps {
    icon: ReactNode;
    label: string;
    href: string;
    active?: boolean;
}

function BottomNavTab({ icon, label, href, active = false }: BottomNavTabProps) {
    return (
        <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={[
                "flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[56px] py-1.5 text-[11px] font-medium transition-colors duration-150 cursor-pointer",
                active ? "text-[var(--accent)]" : "text-[var(--muted-foreground)] active:text-[var(--foreground)]",
            ].join(" ")}
        >
            <span className="h-5 w-5 flex items-center justify-center">{icon}</span>
            <span className="truncate max-w-full px-1">{label}</span>
        </Link>
    );
}

export { BottomNavShell, BottomNavTab };
