'use client';

import {useState} from 'react';
import {useLibrary} from '@/src/contexts/LibraryContext';
import Sidebar from '@/src/components/Sidebar';
import Topbar from '@/src/components/Topbar';
import BookDetailModal from '@/src/components/BookDetailModal';
import AddBookModal from '@/src/components/AddBookModal';

export default function AppShell({children}: { children: React.ReactNode }) {
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
