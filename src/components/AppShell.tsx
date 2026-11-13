'use client';

import {Plus} from 'lucide-react';
import {useLibrary} from '@/src/contexts/LibraryContext';
import {useLanguage} from '@/src/lib/i18n/context';
import Sidebar from '@/src/components/Sidebar';
import Topbar from '@/src/components/Topbar';
import BottomNav from '@/src/components/BottomNav';
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
    const {t} = useLanguage();

    const showBookForm = showAddModal || !!editingBook;

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Sidebar/>

            <main className="lg:ms-[60px] min-h-screen flex flex-col">
                <Topbar/>
                <div className="flex-1 p-4 pb-24 lg:p-8">
                    {children}
                </div>
            </main>

            <BottomNav/>

            <button
                type="button"
                onClick={() => setShowAddModal(true)}
                aria-label={t.sidebar.addNewBook}
                className="fixed z-30 lg:hidden bottom-[calc(72px+env(safe-area-inset-bottom))] end-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[var(--shadow-modal)] transition-colors duration-150 cursor-pointer hover:bg-[var(--accent-hover)]"
            >
                <Plus className="h-6 w-6" aria-hidden="true"/>
            </button>

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
