"use client";

import {Bookmark, BookOpen, BookPlus, LayoutDashboard, Library, Settings, Users} from "lucide-react";
import {PageId} from "@/src/lib/types";
import {useLanguage} from "@/src/lib/i18n/context";
import {NavItem, SidebarFooter, SidebarLogo, SidebarNav, SidebarShell} from "@/src/components/ui/Sidebar";
import {Tooltip} from "@/src/components/ui/Tooltip";

interface SidebarProps {
    activePage: PageId;
    onNavigate: (page: PageId) => void;
    isOpen: boolean;
    onClose: () => void;
    onAddBook: () => void;
}

const PAGE_ICONS: Record<PageId, React.ReactNode> = {
    dashboard: <LayoutDashboard className="h-4 w-4" />,
    books:     <BookOpen className="h-4 w-4" />,
    lent:      <Bookmark className="h-4 w-4" />,
    authors:   <Users className="h-4 w-4" />,
    settings:  <Settings className="h-4 w-4" />,
};

export default function Sidebar({ activePage, onNavigate, isOpen, onClose, onAddBook }: SidebarProps) {
    const { t } = useLanguage();

    const navItems: { page: PageId; label: string }[] = [
        { page: "dashboard", label: t.sidebar.navDashboard },
        { page: "books",     label: t.sidebar.navAllBooks },
        { page: "lent",      label: t.sidebar.navCurrentlyLent },
        { page: "authors",   label: t.sidebar.navAuthors },
        { page: "settings",  label: t.sidebar.navPreferences },
    ];

    return (
        <SidebarShell isOpen={isOpen} onClose={onClose}>
            <SidebarLogo icon={<Library className="h-5 w-5"/>} label="Librax"/>

            <SidebarNav>
                {navItems.map(({ page, label }) => (
                    <Tooltip key={page} content={label} side="right">
                        <NavItem
                            icon={PAGE_ICONS[page]}
                            label={label}
                            active={activePage === page}
                            onClick={() => { onNavigate(page); onClose(); }}
                        />
                    </Tooltip>
                ))}
            </SidebarNav>

            <SidebarFooter>
                {/*
                 * The Add New Book button mirrors NavItem's collapse behaviour:
                 * - icon always visible (px-2.5 matches NavItem padding)
                 * - label fades in on group-hover (same as NavItem labels)
                 * - overflow-hidden on the wrapper clips the text at 60px
                 */}
                <Tooltip content={t.sidebar.addNewBook} side="right">
                    <button
                        onClick={() => { onAddBook(); onClose(); }}
                        aria-label={t.sidebar.addNewBook}
                        className="flex items-center gap-3 w-full rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] overflow-hidden"
                    >
                        <BookPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap overflow-hidden">
                            {t.sidebar.addNewBook}
                        </span>
                    </button>
                </Tooltip>
            </SidebarFooter>
        </SidebarShell>
    );
}
