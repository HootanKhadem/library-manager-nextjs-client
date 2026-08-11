'use client';

import {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {Author, BackendAuthor, BackendBook, BackendGenre, Book, NewBookFormData, PagedResponse} from '@/src/lib/types';
import {mapBackendAuthorToAuthor, mapBackendBookToBook} from '@/src/lib/mappers';

const PAGE_SIZE = 20;

interface LibraryContextValue {
    books: Book[];
    booksLoading: boolean;
    booksError: boolean;
    page: number;
    totalPages: number;
    totalItems: number;
    setPage: (page: number) => void;
    refetchBooks: () => void;

    authors: Author[];
    authorsLoading: boolean;
    authorsError: boolean;
    authorsPage: number;
    authorsTotalPages: number;
    setAuthorsPage: (page: number) => void;
    refetchAuthors: () => void;

    genres: BackendGenre[];

    addBook: (data: NewBookFormData) => Promise<{ ok: boolean }>;
    updateBook: (id: string, data: NewBookFormData) => Promise<{ ok: boolean }>;
    removeBookLocal: (id: string) => void;
    markBookLent: (bookId: string) => void;

    selectedBook: Book | null;
    setSelectedBook: (book: Book | null) => void;
    showAddModal: boolean;
    setShowAddModal: (show: boolean) => void;
    editingBook: Book | null;
    setEditingBook: (book: Book | null) => void;

    searchQuery: string;
    setSearchQuery: (q: string) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

function buildGenreMap(genres: BackendGenre[]): Map<number, string> {
    return new Map(genres.map((g) => [g.id, g.name]));
}

function buildBookPayload(data: NewBookFormData) {
    const genreId = Number(data.genre);
    return {
        name: data.title,
        author: { name: data.author, image: '' },
        pages: parseInt(data.pages) || 0,
        isbn: data.isbn,
        publishedDate: data.year,
        publisher: data.publisher,
        quantity: parseInt(data.quantity) || 1,
        ...(data.rating ? { rating: parseInt(data.rating) } : {}),
        ...(data.status === 'Owned' ? { status: 'OWNED' } : {}),
        ...(genreId ? { genreId } : {}),
    };
}

async function fetchGenres(): Promise<BackendGenre[]> {
    try {
        const res = await fetch('/api/genre');
        if (!res.ok) return [];
        return await res.json().catch(() => []);
    } catch {
        return [];
    }
}

async function fetchBookPage(pageNum: number, genreMap: Map<number, string>): Promise<
    { ok: true; items: Book[]; totalPages: number; totalItems: number } | { ok: false }
> {
    let res: Response;
    try {
        res = await fetch(`/api/book?page=${pageNum}&pageSize=${PAGE_SIZE}`);
    } catch {
        return { ok: false };
    }
    if (!res.ok) return { ok: false };
    const data: PagedResponse<BackendBook> | null = await res.json().catch(() => null);
    if (!data) return { ok: false };
    return {
        ok: true,
        items: data.items.map((b) => mapBackendBookToBook(b, genreMap)),
        totalPages: data.totalPages,
        totalItems: data.totalItems,
    };
}

async function fetchAuthorPage(pageNum: number): Promise<
    { ok: true; items: BackendAuthor[]; totalPages: number; totalItems: number } | { ok: false }
> {
    let res: Response;
    try {
        res = await fetch(`/api/author?page=${pageNum}&pageSize=${PAGE_SIZE}`);
    } catch {
        return { ok: false };
    }
    if (!res.ok) return { ok: false };
    const data: PagedResponse<BackendAuthor> | null = await res.json().catch(() => null);
    if (!data) return { ok: false };
    return { ok: true, items: data.items, totalPages: data.totalPages, totalItems: data.totalItems };
}

export function LibraryProvider({children}: { children: ReactNode }) {
    const [books, setBooks] = useState<Book[]>([]);
    const [booksLoading, setBooksLoading] = useState(true);
    const [booksError, setBooksError] = useState(false);
    const [page, setPageState] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [authors, setAuthors] = useState<Author[]>([]);
    const [authorsLoading, setAuthorsLoading] = useState(true);
    const [authorsError, setAuthorsError] = useState(false);
    const [authorsPage, setAuthorsPageState] = useState(1);
    const [authorsTotalPages, setAuthorsTotalPages] = useState(1);

    const [genres, setGenres] = useState<BackendGenre[]>([]);

    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const genreMap = useMemo(() => buildGenreMap(genres), [genres]);

    const loadBooks = useCallback(async (pageNum: number, map: Map<number, string>) => {
        setBooksLoading(true);
        setBooksError(false);
        const result = await fetchBookPage(pageNum, map);
        if (!result.ok) {
            setBooksError(true);
            setBooksLoading(false);
            return;
        }
        setBooks(result.items);
        setTotalPages(result.totalPages);
        setTotalItems(result.totalItems);
        setPageState(pageNum);
        setBooksLoading(false);
    }, []);

    const loadAuthors = useCallback(async (pageNum: number) => {
        setAuthorsLoading(true);
        setAuthorsError(false);
        const result = await fetchAuthorPage(pageNum);
        if (!result.ok) {
            setAuthorsError(true);
            setAuthorsLoading(false);
            return;
        }
        setAuthors(result.items.map((a) => mapBackendAuthorToAuthor(a, 0)));
        setAuthorsTotalPages(result.totalPages);
        setAuthorsPageState(pageNum);
        setAuthorsLoading(false);
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const genreList = await fetchGenres();
            if (cancelled) return;
            setGenres(genreList);
            await loadBooks(1, buildGenreMap(genreList));
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadAuthors(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setPage = useCallback((next: number) => { loadBooks(next, genreMap); }, [loadBooks, genreMap]);
    const setAuthorsPage = useCallback((next: number) => { loadAuthors(next); }, [loadAuthors]);
    const refetchBooks = useCallback(() => { loadBooks(page, genreMap); }, [loadBooks, page, genreMap]);
    const refetchAuthors = useCallback(() => { loadAuthors(authorsPage); }, [loadAuthors, authorsPage]);

    const addBook = useCallback(async (data: NewBookFormData): Promise<{ ok: boolean }> => {
        let res: Response;
        try {
            res = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildBookPayload(data)),
            });
        } catch {
            return { ok: false };
        }
        if (!res.ok) return { ok: false };
        const created: BackendBook | null = await res.json().catch(() => null);
        if (!created) return { ok: false };
        setBooks((prev) => [mapBackendBookToBook(created, genreMap), ...prev]);
        return { ok: true };
    }, [genreMap]);

    const updateBook = useCallback(async (id: string, data: NewBookFormData): Promise<{ ok: boolean }> => {
        let res: Response;
        try {
            res = await fetch(`/api/book/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildBookPayload(data)),
            });
        } catch {
            return { ok: false };
        }
        if (!res.ok) return { ok: false };
        const updated: BackendBook | null = await res.json().catch(() => null);
        if (!updated) return { ok: false };
        const mapped = mapBackendBookToBook(updated, genreMap);
        setBooks((prev) => prev.map((b) => (b.id === id ? mapped : b)));
        return { ok: true };
    }, [genreMap]);

    const removeBookLocal = useCallback((id: string) => {
        setBooks((prev) => prev.filter((b) => b.id !== id));
    }, []);

    const markBookLent = useCallback((bookId: string) => {
        setBooks(prev => prev.map(b => (b.id === bookId ? { ...b, status: 'Lent Out' } : b)));
    }, []);

    const value = useMemo(
        () => ({
            books, booksLoading, booksError, page, totalPages, totalItems, setPage, refetchBooks,
            authors, authorsLoading, authorsError, authorsPage, authorsTotalPages, setAuthorsPage, refetchAuthors,
            genres,
            addBook, updateBook, removeBookLocal, markBookLent,
            selectedBook, setSelectedBook,
            showAddModal, setShowAddModal,
            editingBook, setEditingBook,
            searchQuery, setSearchQuery,
        }),
        [
            books, booksLoading, booksError, page, totalPages, totalItems, setPage, refetchBooks,
            authors, authorsLoading, authorsError, authorsPage, authorsTotalPages, setAuthorsPage, refetchAuthors,
            genres, addBook, updateBook, removeBookLocal, markBookLent,
            selectedBook, showAddModal, editingBook, searchQuery,
        ],
    );

    return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
    const ctx = useContext(LibraryContext);
    if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
    return ctx;
}
