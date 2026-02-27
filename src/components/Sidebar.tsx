"use client";
/**
 * components/Sidebar.tsx
 *
 * Fixed sidebar with:
 *  - App logo and subtitle
 *  - Stats chips (total books, lent, authors)
 *  - Navigation items (Library, Catalog, Settings sections)
 *  - "Add New Book" button
 *  - LanguageSwitcher (allows toggling between English and Farsi)
 *
 * i18n: all user-visible strings are sourced from t (Translations) via
 * useLanguage(). The nav items are built from the t.sidebar keys so labels
 * automatically update when the language changes.
 *
 * RTL: the sidebar is positioned with fixed left-0. In RTL mode the browser
 * mirrors it to the right automatically because the <html dir="rtl"> attribute
 * is set by LanguageProvider. The border uses border-e (logical) instead of
 * border-r (physical) so it always appears on the "end" side of the sidebar
 * regardless of direction.
 */

import {PageId} from "@/src/lib/types";
import {getLentBooks} from "@/src/lib/data";
import {useLanguage} from "@/src/lib/i18n/context";
import LanguageSwitcher from "@/src/components/LanguageSwitcher";

interface SidebarProps {
    activePage: PageId;
    onNavigate: (page: PageId) => void;
    isOpen: boolean;
    onClose: () => void;
    onAddBook: () => void;
}

export default function Sidebar({activePage, onNavigate, isOpen, onClose, onAddBook}: SidebarProps) {
    const lentCount = getLentBooks().length;
    // useLanguage() provides t (translations) and dir (text direction)
    const {t} = useLanguage();

    // Nav items are derived from translations — labels update automatically.
    const NAV_ITEMS: { page: PageId; icon: string; label: string }[] = [
        {page: "dashboard", icon: "\uD83C\uDFDB", label: t.sidebar.navDashboard},
        {page: "books", icon: "\uD83D\uDCDA", label: t.sidebar.navAllBooks},
        {page: "lent", icon: "\uD83D\uDD16", label: t.sidebar.navCurrentlyLent},
    ];

    const CATALOG_ITEMS: { page: PageId; icon: string; label: string }[] = [
        {page: "authors", icon: "\u270C", label: t.sidebar.navAuthors},
    ];

    const SETTINGS_ITEMS: { page: PageId; icon: string; label: string }[] = [
        {page: "settings", icon: "\u2699", label: t.sidebar.navPreferences},
    ];

    return (
        <>
            {/* Mobile overlay — closes sidebar when tapped outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[99] lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed top-0 left-0 w-60 h-screen z-[100] flex flex-col border-e-[3px] border-[#b8922a] shadow-[4px_0_24px_rgba(0,0,0,0.35)] transition-transform duration-300
          bg-gradient-to-br from-[#5c2d0a] via-[#3d1c02] to-[#1a0f00]
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
                data-testid="sidebar"
            >
                {/* Logo */}
                <div className="px-6 py-8 pb-6 border-b border-[rgba(196,116,42,0.3)]">
                    <h1 className="font-playfair text-[1.8rem] font-black text-[#d4ae50] tracking-[0.02em] leading-none">
                        Bibliotheca
                    </h1>
                    <p className="font-mono text-[0.6rem] text-[rgba(196,116,42,0.6)] tracking-[0.25em] uppercase mt-1">
                        {t.sidebar.appSubtitle}
                    </p>
                    <p className="text-center text-[#d4ae50] opacity-30 text-xl tracking-[0.5em] mt-2">— ✦ —</p>
                </div>

                {/* Stats chips */}
                <div className="px-6 py-4 border-b border-[rgba(196,116,42,0.2)] flex gap-3">
                    <StatChip num={15} label={t.sidebar.statsBooks} testId="stat-total"/>
                    <StatChip num={lentCount} label={t.sidebar.statsLent} testId="stat-lent"/>
                    <StatChip num={8} label={t.sidebar.statsAuthors} testId="stat-authors"/>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-5 overflow-y-auto">
                    <NavSectionLabel label={t.sidebar.navSectionLibrary}/>
                    {NAV_ITEMS.map(({page, icon, label}) => (
                        <NavItem
                            key={page}
                            icon={icon}
                            label={label}
                            active={activePage === page}
                            badge={page === "lent" ? lentCount : undefined}
                            onClick={() => onNavigate(page)}
                        />
                    ))}
                    <NavSectionLabel label={t.sidebar.navSectionCatalog}/>
                    {CATALOG_ITEMS.map(({page, icon, label}) => (
                        <NavItem
                            key={page}
                            icon={icon}
                            label={label}
                            active={activePage === page}
                            onClick={() => onNavigate(page)}
                        />
                    ))}
                    <NavSectionLabel label={t.sidebar.navSectionSettings}/>
                    {SETTINGS_ITEMS.map(({page, icon, label}) => (
                        <NavItem
                            key={page}
                            icon={icon}
                            label={label}
                            active={activePage === page}
                            onClick={() => onNavigate(page)}
                        />
                    ))}
                </nav>

                {/* Footer: Add Book button + Language Switcher */}
                <div className="px-6 py-4 border-t border-[rgba(196,116,42,0.2)]">
                    <button
                        onClick={onAddBook}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded font-playfair text-sm font-bold tracking-[0.04em] text-[#f5f0e8] border border-[#b8922a] bg-gradient-to-br from-[#c4742a] to-[#7a3d12] hover:from-[#e89a4a] hover:to-[#c4742a] hover:shadow-[0_4px_16px_rgba(196,116,42,0.35)] hover:-translate-y-px transition-all duration-200"
                    >
                        {t.sidebar.addNewBook}
                    </button>

                    {/* Language switcher — renders one button per language in LANGUAGE_META */}
                    <LanguageSwitcher/>
                </div>
            </aside>
        </>
    );
}

function StatChip({num, label, testId}: { num: number; label: string; testId: string }) {
    return (
        <div className="flex-1 bg-[rgba(196,116,42,0.12)] border border-[rgba(196,116,42,0.2)] rounded p-2 text-center">
      <span className="block font-playfair text-[1.4rem] font-bold text-[#d4ae50] leading-none" data-testid={testId}>
        {num}
      </span>
            <span
                className="block font-mono text-[0.55rem] text-[rgba(245,208,168,0.55)] tracking-[0.1em] uppercase mt-0.5">
        {label}
      </span>
        </div>
    );
}

function NavSectionLabel({label}: { label: string }) {
    return (
        <div
            className="font-mono text-[0.55rem] tracking-[0.22em] uppercase text-[rgba(196,116,42,0.45)] px-6 pt-2 pb-1">
            {label}
        </div>
    );
}

function NavItem({
                     icon,
                     label,
                     active,
                     badge,
                     onClick,
                 }: {
    icon: string;
    label: string;
    active: boolean;
    badge?: number;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-6 py-2.5 text-sm font-serif transition-all duration-200 border-s-[3px] relative
        ${
                active
                    ? "text-[#d4ae50] bg-[rgba(196,116,42,0.15)] border-s-[#b8922a] font-bold"
                    : "text-[rgba(245,240,232,0.65)] border-s-transparent hover:text-[#e89a4a] hover:bg-[rgba(196,116,42,0.08)] hover:border-s-[rgba(196,116,42,0.4)]"
            }`}
            aria-current={active ? "page" : undefined}
        >
            <span className="text-base w-5 text-center">{icon}</span>
            {label}
            {/* Badge showing lent count — uses ms-auto (logical margin) for RTL compat */}
            {badge !== undefined && badge > 0 && (
                <span className="ms-auto bg-[#a03020] text-white font-mono text-[0.6rem] px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
            )}
        </button>
    );
}
