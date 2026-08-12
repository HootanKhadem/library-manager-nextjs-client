'use client';

import {useState} from 'react';
import {useLibrary} from '@/src/contexts/LibraryContext';
import Sidebar from '@/src/components/Sidebar';
import Topbar from '@/src/components/Topbar';
import BookDetailModal from '@/src/components/BookDetailModal';
import AddBookModal from '@/src/components/AddBookModal';
import {bookToFormData} from '@/src/lib/mappers';

export default function AppShell({children}: { children: React.ReactNode }) {
    const {
        selectedBook, setSelectedBook,
        showAddModal, setShowAddModal,
        editingBook, setEditingBook,
        genres,
        addBook, updateBook, removeBookLocal, markBookLent,
    } = useLibrary();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const showBookForm = showAddModal || !!editingBook;

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
                <BookDetailModal
                    book={selectedBook}
                    onClose={() => setSelectedBook(null)}
                    onLent={() => {
                        if (selectedBook) markBookLent(selectedBook.id);
                        setSelectedBook(null);
                    }}
                    onEdit={() => {
                        setEditingBook(selectedBook);
                        setSelectedBook(null);
                    }}
                    onDeleted={() => {
                        removeBookLocal(selectedBook.id);
                        setSelectedBook(null);
                    }}
                />
            )}
            {showBookForm && (
                <AddBookModal
                    key={editingBook?.id ?? 'add'}
                    mode={editingBook ? 'edit' : 'add'}
                    initialData={editingBook ? bookToFormData(editingBook, genres) : undefined}
                    genres={genres}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingBook(null);
                    }}
                    onAdd={async (data) => {
                        const result = editingBook
                            ? await updateBook(editingBook.id, data)
                            : await addBook(data);
                        return result.ok;
                    }}
                />
            )}
        </div>
    );
}
