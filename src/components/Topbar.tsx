"use client";

import { Search } from "lucide-react";
import { PageId } from "@/src/lib/types";
import { useLanguage } from "@/src/lib/i18n/context";
import { Topbar as TopbarShell } from "@/src/components/ui/Topbar";

interface TopbarProps {
    activePage: PageId;
    onMenuToggle: () => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

export default function Topbar({ activePage, onMenuToggle, searchQuery, onSearchChange }: TopbarProps) {
    const { t } = useLanguage();
    const [title] = t.topbar.pages[activePage];

    return (
        <TopbarShell
            onMenuClick={onMenuToggle}
            startSlot={
                <h2 className="text-sm font-semibold text-[var(--foreground)] tracking-tight" data-testid="topbar-title">
                    {title}
                </h2>
            }
            endSlot={
                <div className="flex items-center gap-2 h-8 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 w-56 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all">
                    <Search className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
                    <input
                        type="search"
                        placeholder={t.common.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
                        aria-label={t.common.search}
                    />
                </div>
            }
        />
    );
}
