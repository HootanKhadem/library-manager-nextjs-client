import {LibraryProvider} from '@/src/contexts/LibraryContext';
import {LanguageProvider} from '@/src/lib/i18n/context';
import AppShell from '@/src/components/AppShell';

export default function AppLayout({children}: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <LibraryProvider>
                <AppShell>{children}</AppShell>
            </LibraryProvider>
        </LanguageProvider>
    );
}
