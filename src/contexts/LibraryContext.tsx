'use client';

import {createContext, ReactNode, useCallback, useContext, useMemo, useState} from 'react';
import {Book, NewBookFormData} from '@/src/lib/types';
import {BOOKS} from '@/src/lib/data';

interface LibraryContextValue {
    books: Book[];
    addBook: (data: NewBookFormData) => Promise<{ ok: boolean }>;
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

    const addBook = useCallback(async (data: NewBookFormData): Promise<{ ok: boolean }> => {
        const payload = {
            name: data.title,
            author: { name: data.author, image: '' },
            pages: parseInt(data.pages) || 0,
            isbn: data.isbn,
            publishedDate: data.year,
            publisher: data.publisher,
            quantity: parseInt(data.quantity) || 1,
            ...(data.rating ? { rating: parseInt(data.rating) } : {}),
        };

        let res: Response;
        try {
            res = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch {
            return { ok: false };
        }

        if (!res.ok) return { ok: false };
        const created: { id: number } = await res.json().catch(() => ({ id: Date.now() }));

        const newBook: Book = {
            id: String(created.id),
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
        return { ok: true };
    }, []);

    const value = useMemo(
        () => ({
            books,
            addBook,
            selectedBook,
            setSelectedBook,
            showAddModal,
            setShowAddModal,
            searchQuery,
            setSearchQuery
        }),
        [books, addBook, selectedBook, showAddModal, searchQuery],
    );

    return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
    const ctx = useContext(LibraryContext);
    if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
    return ctx;
}
