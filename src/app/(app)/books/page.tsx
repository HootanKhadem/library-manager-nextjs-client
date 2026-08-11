'use client';

import {useLibrary} from '@/src/contexts/LibraryContext';
import {filterBooks} from '@/src/lib/utils';
import BooksPage from '@/src/components/pages/BooksPage';

export default function BooksRoute() {
    const {
        books, searchQuery, setSelectedBook, setShowAddModal,
        booksLoading, booksError, page, totalPages, totalItems, setPage, refetchBooks,
    } = useLibrary();

    const filtered = filterBooks(books, searchQuery);

    return (
        <BooksPage
            books={filtered}
            onBookClick={setSelectedBook}
            onAddBook={() => setShowAddModal(true)}
            isError={booksError}
            onRetry={refetchBooks}
            isLoading={booksLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
        />
    );
}
