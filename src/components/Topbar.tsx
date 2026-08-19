"use client";

import {useEffect, useRef, useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import {LogOut, ScanLine, Search, X} from "lucide-react";
import {PageId} from "@/src/lib/types";
import {useLanguage} from "@/src/lib/i18n/context";
import {useLibrary} from "@/src/contexts/LibraryContext";
import {useAuth} from "@/src/contexts/AuthContext";
import {Avatar} from "@/src/components/ui/Avatar";
import {Topbar as TopbarShell} from "@/src/components/ui/Topbar";
import {BarcodeScanner} from "@/src/components/ui/BarcodeScanner";

interface TopbarProps {
    onMenuToggle: () => void;
}

const PATH_TO_PAGE: Record<string, PageId> = {
    '/dashboard': 'dashboard',
    '/books': 'books',
    '/lent': 'lent',
    '/authors': 'authors',
    '/settings': 'settings',
};

export default function Topbar({onMenuToggle}: TopbarProps) {
    const { t } = useLanguage();
    const {searchQuery, setSearchQuery} = useLibrary();
    const {user, logout} = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [scannerOpen, setScannerOpen] = useState(false);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!accountOpen) return;

        function handleClickOutside(e: MouseEvent) {
            if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
                setAccountOpen(false);
            }
        }

        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") setAccountOpen(false);
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [accountOpen]);

    async function handleLogout() {
        setAccountOpen(false);
        await logout();
        router.replace("/login");
    }

    const pageId: PageId = PATH_TO_PAGE[pathname] ?? 'dashboard';
    const [title] = t.topbar.pages[pageId];

    function closeSearch() {
        setSearchExpanded(false);
        setSearchQuery('');
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
                        <button
                            className="sm:hidden p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-stone-100 hover:text-[var(--foreground)] transition-colors cursor-pointer"
                            aria-label={t.common.search}
                            onClick={() => setSearchExpanded(true)}
                        >
                            <Search className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <div className="hidden sm:flex items-center gap-2 h-8 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 w-56 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all">
                            <Search className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
                            <input
                                type="search"
                                placeholder={t.common.searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
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

                        <div className="relative" ref={accountRef}>
                            <button
                                type="button"
                                onClick={() => setAccountOpen(o => !o)}
                                aria-haspopup="menu"
                                aria-expanded={accountOpen}
                                aria-label={t.topbar.account}
                                className="flex items-center rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                            >
                                <Avatar name={user?.name ?? user?.email ?? "?"} size="sm" />
                            </button>

                            {accountOpen && (
                                <div
                                    role="menu"
                                    aria-label={t.topbar.account}
                                    className="absolute end-0 top-full mt-2 w-56 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg py-1.5 z-30"
                                >
                                    <div className="px-3 py-2 border-b border-[var(--border)]">
                                        <p className="text-xs font-semibold text-[var(--foreground)] truncate">
                                            {user?.name ?? user?.email ?? t.topbar.account}
                                        </p>
                                        {user?.email && user?.name && (
                                            <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                                                {user.email}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--foreground)] hover:bg-stone-100 transition-colors cursor-pointer"
                                    >
                                        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                                        {t.topbar.logout}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                }
            />

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
                        onChange={(e) => setSearchQuery(e.target.value)}
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
                    setSearchQuery(isbn);
                    setScannerOpen(false);
                }}
            />
        </>
    );
}
