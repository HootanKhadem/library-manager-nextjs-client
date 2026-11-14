import {LibraryProvider} from '@/src/contexts/LibraryContext';
import AppShell from '@/src/components/AppShell';
import {InstallPrompt} from '@/src/components/InstallPrompt';

export default function AppLayout({children}: { children: React.ReactNode }) {
    return (
        <LibraryProvider>
            <AppShell>{children}</AppShell>
            <InstallPrompt/>
        </LibraryProvider>
    );
}
