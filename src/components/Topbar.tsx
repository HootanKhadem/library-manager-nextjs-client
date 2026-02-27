"use client";
/**
 * components/Topbar.tsx
 *
 * Sticky top bar containing:
 *  - Mobile menu toggle button
 *  - Page title (translated, with italic subtitle)
 *  - Search input (translated placeholder)
 *
 * i18n: page titles and subtitles come from t.topbar.pages[activePage],
 * a tuple [title, subtitle] that updates whenever the language changes.
 * The search placeholder is t.common.searchPlaceholder.
 */

import {PageId} from "@/src/lib/types";
import {useLanguage} from "@/src/lib/i18n/context";

interface TopbarProps {
    activePage: PageId;
    onMenuToggle: () => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

export default function Topbar({activePage, onMenuToggle, searchQuery, onSearchChange}: TopbarProps) {
    const {t} = useLanguage();

    // Page titles are tuples [title, subtitle] from the translation object.
    // Changing the language re-renders with the new locale strings automatically.
    const [title, subtitle] = t.topbar.pages[activePage];

    return (
        <div
            className="sticky top-0 z-50 flex flex-wrap items-center gap-4 px-8 py-4 border-b border-[rgba(61,28,2,0.12)] shadow-[0_2px_12px_rgba(61,28,2,0.12)] bg-[rgba(245,240,232,0.92)] backdrop-blur-md">
            <button
                onClick={onMenuToggle}
                className="lg:hidden border border-[rgba(61,28,2,0.2)] rounded px-2.5 py-1.5 text-base text-[#3d1c02] bg-transparent"
                aria-label={t.topbar.toggleMenu}
            >
                ☰
            </button>
            <div className="flex-1 font-playfair text-2xl font-bold text-[#3d1c02]" data-testid="topbar-title">
                {title} —{" "}
                <span className="italic text-[#c4742a] font-normal">{subtitle}</span>
            </div>
            <div
                className="flex items-center gap-2 bg-[#ede5d5] border border-[rgba(61,28,2,0.18)] rounded px-3.5 py-2 w-72 focus-within:border-[#c4742a] focus-within:shadow-[0_0_0_3px_rgba(196,116,42,0.1)] transition-all">
                <span className="text-[#6b4c2a] text-sm">🔍</span>
                <input
                    type="text"
                    placeholder={t.common.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="border-none bg-transparent font-serif text-[0.8rem] text-[#1a0f00] outline-none w-full placeholder:text-[#6b4c2a] placeholder:opacity-60"
                    aria-label={t.common.search}
                />
            </div>
        </div>
    );
}
