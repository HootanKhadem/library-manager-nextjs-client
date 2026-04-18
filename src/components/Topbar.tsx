"use client";

import {useState} from "react";
import {ScanLine, Search, X} from "lucide-react";
import {PageId} from "@/src/lib/types";
import {useLanguage} from "@/src/lib/i18n/context";
import {Topbar as TopbarShell} from "@/src/components/ui/Topbar";
import {BarcodeScanner} from "@/src/components/ui/BarcodeScanner";

interface TopbarProps {
    activePage: PageId;
    onMenuToggle: () => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

export default function Topbar({ activePage, onMenuToggle, searchQuery, onSearchChange }: TopbarProps) {
    const { t } = useLanguage();
    const [title] = t.topbar.pages[activePage];
    const [scannerOpen, setScannerOpen] = useState(false);
    const [searchExpanded, setSearchExpanded] = useState(false);

    function closeSearch() {
        setSearchExpanded(false);
        onSearchChange("");
    }

    return (
        <>
            <TopbarShell
                onMenuClick={onMenuToggle}
                startSlot={
                    <h2 className="text-sm font-semibold text-[var(--foreground)] tracking-tight" data-testid="topbar-title">
                        {title}
                    </h2>
                }
                endSlot={
                    <div className="flex items-center gap-2">
                        {/* Mobile: search icon — opens full-screen overlay */}
                        <button
                            className="sm:hidden p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-stone-100 hover:text-[var(--foreground)] transition-colors cursor-pointer"
                            aria-label={t.common.search}
                            onClick={() => setSearchExpanded(true)}
                        >
                            <Search className="h-4 w-4" aria-hidden="true" />
                        </button>

                        {/* Desktop: always-visible search bar */}
                        <div className="hidden sm:flex items-center gap-2 h-8 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 w-56 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all">
                            <Search className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
                            <input
                                type="search"
                                placeholder={t.common.searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
                                aria-label={t.common.search}
                            />
                            <button
                                type="button"
                                onClick={() => setScannerOpen(true)}
                                aria-label={t.barcodeScanner.title}
                                className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                            >
                                <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                }
            />

            {/* Mobile search overlay — fixed over the topbar */}
            {searchExpanded && (
                <div className="sm:hidden fixed inset-x-0 top-0 z-20 h-14 flex items-center gap-3 px-4 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)]">
                    <button
                        onClick={closeSearch}
                        aria-label={t.common.close}
                        className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-stone-100 hover:text-[var(--foreground)] transition-colors cursor-pointer shrink-0"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <input
                        autoFocus
                        type="search"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={t.common.searchPlaceholder}
                        aria-label={t.common.search}
                        className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => setScannerOpen(true)}
                        aria-label={t.barcodeScanner.title}
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer shrink-0"
                    >
                        <ScanLine className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            )}

            <BarcodeScanner
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScan={(isbn) => {
                    onSearchChange(isbn);
                    setScannerOpen(false);
                }}
            />
        </>
    );
}
