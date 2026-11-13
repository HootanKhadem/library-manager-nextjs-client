"use client";

import {usePathname} from 'next/navigation';
import {useLanguage} from "@/src/lib/i18n/context";
import {BottomNavShell, BottomNavTab} from "@/src/components/ui/BottomNav";
import {NAV_ITEMS, navLabels} from "@/src/components/Sidebar";

export default function BottomNav() {
    const { t } = useLanguage();
    const pathname = usePathname();
    const labels = navLabels(t);

    return (
        <BottomNavShell>
            {NAV_ITEMS.map(({href, icon}) => (
                <BottomNavTab
                    key={href}
                    href={href}
                    icon={icon}
                    label={labels[href]}
                    active={pathname === href}
                />
            ))}
        </BottomNavShell>
    );
}
