'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/src/contexts/AuthContext';
import {LibraryProvider, useLibrary} from '@/src/contexts/LibraryContext';
import {LanguageProvider} from '@/src/lib/i18n/context';
import Sidebar from '@/src/components/Sidebar';
import Topbar from '@/src/components/Topbar';
import BookDetailModal from '@/src/components/BookDetailModal';
import AddBookModal from '@/src/components/AddBookModal';

function AppShell({children}: { children: React.ReactNode }) {
    const {selectedBook, setSelectedBook, showAddModal, setShowAddModal, addBook} = useLibrary();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="lg:ms-[60px] min-h-screen flex flex-col">
                <Topbar onMenuToggle={() => setSidebarOpen(o => !o)}/>
                <div className="flex-1 p-6 lg:p-8">
                    {children}
                </div>
            </main>

            {selectedBook && (
                <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)}/>
            )}
            {showAddModal && (
                <AddBookModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={(data) => {
                        addBook(data);
                        setShowAddModal(false);
                    }}
                />
            )}
        </div>
    );
}

export default function AppLayout({children}: { children: React.ReactNode }) {
    const {isAuthenticated, hydrated} = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (hydrated && !isAuthenticated) {
            router.replace('/login');
        }
    }, [hydrated, isAuthenticated, router]);

    if (!hydrated || !isAuthenticated) return null;

    return (
        <LanguageProvider>
            <LibraryProvider>
                <AppShell>{children}</AppShell>
            </LibraryProvider>
        </LanguageProvider>
    );
}
