"use client";

import {usePathname} from 'next/navigation';
import {Bookmark, BookOpen, BookPlus, LayoutDashboard, Library, Settings, Users} from "lucide-react";
import {useLanguage} from "@/src/lib/i18n/context";
import {useLibrary} from "@/src/contexts/LibraryContext";
import {NavItem, SidebarFooter, SidebarLogo, SidebarNav, SidebarShell} from "@/src/components/ui/Sidebar";
import {Tooltip} from "@/src/components/ui/Tooltip";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const NAV_ITEMS = [
    {href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4"/>},
    {href: '/books', icon: <BookOpen className="h-4 w-4"/>},
    {href: '/lent', icon: <Bookmark className="h-4 w-4"/>},
    {href: '/authors', icon: <Users className="h-4 w-4"/>},
    {href: '/settings', icon: <Settings className="h-4 w-4"/>},
] as const;

export default function Sidebar({isOpen, onClose}: SidebarProps) {
    const { t } = useLanguage();
    const {setShowAddModal} = useLibrary();
    const pathname = usePathname();

    const labels: Record<string, string> = {
        '/dashboard': t.sidebar.navDashboard,
        '/books': t.sidebar.navAllBooks,
        '/lent': t.sidebar.navCurrentlyLent,
        '/authors': t.sidebar.navAuthors,
        '/settings': t.sidebar.navPreferences,
    };

    return (
        <SidebarShell isOpen={isOpen} onClose={onClose}>
            <SidebarLogo icon={<Library className="h-5 w-5"/>} label="Librax"/>

            <SidebarNav>
                {NAV_ITEMS.map(({href, icon}) => (
                    <Tooltip key={href} content={labels[href]} side="right">
                        <NavItem
                            href={href}
                            icon={icon}
                            label={labels[href]}
                            active={pathname === href}
                            onClick={onClose}
                        />
                    </Tooltip>
                ))}
            </SidebarNav>

            <SidebarFooter>
                <Tooltip content={t.sidebar.addNewBook} side="right">
                    <button
                        onClick={() => {
                            setShowAddModal(true);
                            onClose();
                        }}
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
