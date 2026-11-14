"use client";

import {usePathname} from 'next/navigation';
import {Bookmark, BookOpen, LayoutDashboard, Library, Settings, Users} from "lucide-react";
import {useLanguage} from "@/src/lib/i18n/context";
import {NavItem, SidebarLogo, SidebarNav, SidebarShell} from "@/src/components/ui/Sidebar";

export const NAV_ITEMS = [
    {href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4"/>},
    {href: '/books', icon: <BookOpen className="h-4 w-4"/>},
    {href: '/lent', icon: <Bookmark className="h-4 w-4"/>},
    {href: '/authors', icon: <Users className="h-4 w-4"/>},
    {href: '/settings', icon: <Settings className="h-4 w-4"/>},
] as const;

export function navLabels(t: ReturnType<typeof useLanguage>['t']): Record<string, string> {
    return {
        '/dashboard': t.sidebar.navDashboard,
        '/books': t.sidebar.navAllBooks,
        '/lent': t.sidebar.navCurrentlyLent,
        '/authors': t.sidebar.navAuthors,
        '/settings': t.sidebar.navPreferences,
    };
}

export default function Sidebar() {
    const { t } = useLanguage();
    const pathname = usePathname();

    const labels = navLabels(t);

    return (
        <SidebarShell>
            <SidebarLogo icon={<Library className="h-5 w-5"/>} label={t.sidebar.brand}/>

            <SidebarNav>
                {NAV_ITEMS.map(({href, icon}) => (
                    <NavItem
                        key={href}
                        href={href}
                        icon={icon}
                        label={labels[href]}
                        active={pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))}
                    />
                ))}
            </SidebarNav>
        </SidebarShell>
    );
}
