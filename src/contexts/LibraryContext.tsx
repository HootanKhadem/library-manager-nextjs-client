'use client';

import {createContext, useContext, useState, ReactNode} from 'react';
import {Book} from '@/src/lib/types';
import {BOOKS} from '@/src/lib/data';
import {NewBookFormData} from '@/src/components/AddBookModal';

interface LibraryContextValue {
    books: Book[];
    addBook: (data: NewBookFormData) => void;
    selectedBook: Book | null;
    setSelectedBook: (book: Book | null) => void;
    showAddModal: boolean;
    setShowAddModal: (show: boolean) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({children}: { children: ReactNode }) {
    const [books, setBooks] = useState<Book[]>(BOOKS);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    function addBook(data: NewBookFormData) {
        const newBook: Book = {
            id: `book-${Date.now()}`,
            title: data.title,
            author: data.author,
            year: parseInt(data.year) || new Date().getFullYear(),
            genre: data.genre || 'Other',
            status: data.status,
            publisher: data.publisher || undefined,
            isbn: data.isbn || undefined,
            pages: data.pages ? parseInt(data.pages) : undefined,
            rating: data.rating ? parseInt(data.rating) : undefined,
            description: data.description || undefined,
            notes: data.notes || undefined,
        };
        setBooks(prev => [newBook, ...prev]);
    }

    return (
        <LibraryContext.Provider value={{
            books,
            addBook,
            selectedBook,
            setSelectedBook,
            showAddModal,
            setShowAddModal,
            searchQuery,
            setSearchQuery,
        }}>
            {children}
        </LibraryContext.Provider>
    );
}

export function useLibrary() {
    const ctx = useContext(LibraryContext);
    if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
    return ctx;
}
