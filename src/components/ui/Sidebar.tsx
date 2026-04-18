"use client";

import { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";

/* ─── Shell ─────────────────────────────────────────────────────────────── */

interface SidebarShellProps {
    isOpen: boolean;          // mobile drawer state
    onClose: () => void;
    children: ReactNode;
}

function SidebarShell({ isOpen, onClose, children }: SidebarShellProps) {
    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/40 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                data-testid="sidebar"
                className={[
                    "group fixed inset-y-0 start-0 z-30 flex flex-col bg-[var(--sidebar-bg)] transition-all duration-200 ease-in-out",
                    /* desktop: 60px collapsed, hover → 240px */
                    "lg:w-[60px] lg:hover:w-60",
                    /* mobile: full drawer toggled by isOpen */
                    "w-60",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                ].join(" ")}
            >
                {children}
            </aside>
        </>
    );
}

/* ─── Logo ──────────────────────────────────────────────────────────────── */

interface SidebarLogoProps {
    icon: ReactNode;
    label: string;
}

function SidebarLogo({ icon, label }: SidebarLogoProps) {
    return (
        <div className="flex h-14 items-center gap-3 border-b border-white/10 px-[18px]">
            <span className="shrink-0 text-[var(--accent)]">{icon}</span>
            <span className="overflow-hidden whitespace-nowrap font-semibold text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {label}
            </span>
        </div>
    );
}

/* ─── Nav ───────────────────────────────────────────────────────────────── */

function SidebarNav({ children }: { children: ReactNode }) {
    return (
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3" aria-label="Main navigation">
            <ul className="space-y-0.5 px-2">{children}</ul>
        </nav>
    );
}

/* ─── NavItem ───────────────────────────────────────────────────────────── */

interface NavItemProps {
    icon: ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    href?: string;
}

function NavItem({ icon, label, active = false, onClick, href }: NavItemProps) {
    const className = [
        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer w-full",
        active
            ? "bg-[var(--accent)] text-white"
            : "text-stone-400 hover:bg-white/10 hover:text-white",
    ].join(" ");

    const content = (
        <>
            <span className="shrink-0 h-5 w-5 flex items-center justify-center">{icon}</span>
            <span className="overflow-hidden whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {label}
            </span>
        </>
    );

    if (href) {
        return (
            <li>
                <Link href={href} className={className} aria-current={active ? "page" : undefined}>
                    {content}
                </Link>
            </li>
        );
    }

    return (
        <li>
            <button onClick={onClick} className={className} aria-current={active ? "page" : undefined}>
                {content}
            </button>
        </li>
    );
}

/* ─── Footer ────────────────────────────────────────────────────────────── */

function SidebarFooter({ children }: { children: ReactNode }) {
    return (
        <div className="border-t border-white/10 px-2 py-3">
            {children}
        </div>
    );
}

export { SidebarShell, SidebarLogo, SidebarNav, NavItem, SidebarFooter };
