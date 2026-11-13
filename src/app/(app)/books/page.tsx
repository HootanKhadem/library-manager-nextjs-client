'use client';

import {useLibrary} from '@/src/contexts/LibraryContext';
import BooksPage from '@/src/components/pages/BooksPage';

export default function BooksRoute() {
    const {
        books, searchQuery, setSelectedBook, setShowAddModal,
        booksLoading, booksError, page, totalPages, totalItems, setPage, refetchBooks,
        activeFilter, setActiveFilter,
    } = useLibrary();

    return (
        <BooksPage
            books={books}
            onBookClick={setSelectedBook}
            onAddBook={() => setShowAddModal(true)}
            isError={booksError}
            onRetry={refetchBooks}
            isLoading={booksLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            searchQuery={searchQuery}
        />
    );
}
