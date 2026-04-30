'use client';

import {useLibrary} from '@/src/contexts/LibraryContext';
import BooksPage from '@/src/components/pages/BooksPage';

export default function BooksRoute() {
    const {books, searchQuery, setSelectedBook, setShowAddModal} = useLibrary();

    const filtered = searchQuery.trim()
        ? books.filter(b =>
            b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.author.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : books;

    return (
        <BooksPage
            books={filtered}
            onBookClick={setSelectedBook}
            onAddBook={() => setShowAddModal(true)}
        />
    );
}
