import {LibraryProvider} from '@/src/contexts/LibraryContext';
import {LanguageProvider} from '@/src/lib/i18n/context';
import AppShell from '@/src/components/AppShell';
import {InstallPrompt} from '@/src/components/InstallPrompt';

export default function AppLayout({children}: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <LibraryProvider>
                <AppShell>{children}</AppShell>
                <InstallPrompt/>
            </LibraryProvider>
        </LanguageProvider>
    );
}
