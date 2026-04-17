"use client";

import { LayoutDashboard, BookOpen, Bookmark, Users, Settings, BookPlus, Library } from "lucide-react";
import { PageId } from "@/src/lib/types";
import { useLanguage } from "@/src/lib/i18n/context";
import { SidebarShell, SidebarLogo, SidebarNav, NavItem, SidebarFooter } from "@/src/components/ui/Sidebar";
import { Button } from "@/src/components/ui/Button";
import { Tooltip } from "@/src/components/ui/Tooltip";

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
            <SidebarLogo icon={<Library className="h-5 w-5" />} label="Bibliotheca" />

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
                <Tooltip content={t.sidebar.addNewBook} side="right">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={onAddBook}
                        className="w-full justify-start gap-2 overflow-hidden"
                        aria-label={t.sidebar.addNewBook}
                    >
                        <BookPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap overflow-hidden">
                            {t.sidebar.addNewBook}
                        </span>
                    </Button>
                </Tooltip>
            </SidebarFooter>
        </SidebarShell>
    );
}
