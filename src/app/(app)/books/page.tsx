'use client';

import {useRouter} from 'next/navigation';
import {useLibrary} from '@/src/contexts/LibraryContext';
import BooksPage from '@/src/components/pages/BooksPage';

export default function BooksRoute() {
    const {
        books, searchQuery, setShowAddModal,
        booksLoading, booksError, page, totalPages, totalItems, setPage, refetchBooks,
        activeFilter, setActiveFilter, booksSort, setBooksSort,
    } = useLibrary();

    const router = useRouter();

    return (
        <BooksPage
            books={books}
            onBookClick={(book) => router.push(`/books/${book.id}`)}
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
            sort={booksSort}
            onSortChange={setBooksSort}
        />
    );
}
