'use client';

import {useLibrary} from '@/src/contexts/LibraryContext';
import {filterBooks} from '@/src/lib/utils';
import BooksPage from '@/src/components/pages/BooksPage';

export default function BooksRoute() {
    const {books, searchQuery, setSelectedBook, setShowAddModal} = useLibrary();

    const filtered = filterBooks(books, searchQuery);

    return (
        <BooksPage
            books={filtered}
            onBookClick={setSelectedBook}
            onAddBook={() => setShowAddModal(true)}
        />
    );
}
