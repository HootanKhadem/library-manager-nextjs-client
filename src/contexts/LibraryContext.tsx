'use client';

import {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Author, BackendAuthor, BackendBook, BackendGenre, Book, BookStatus, NewBookFormData, PagedResponse} from '@/src/lib/types';
import type {SortState} from '@/src/components/ui/DataGrid';
import {mapBackendAuthorToAuthor, mapBackendBookToBook, mapBookStatusToBackendStatus} from '@/src/lib/mappers';

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
    booksSort: SortState | null;
    setBooksSort: (sort: SortState | null) => void;

    authors: Author[];
    authorsLoading: boolean;
    authorsError: boolean;
    authorsPage: number;
    authorsTotalPages: number;
    setAuthorsPage: (page: number) => void;
    refetchAuthors: () => void;
    authorsSort: SortState | null;
    setAuthorsSort: (sort: SortState | null) => void;

    genres: BackendGenre[];

    addBook: (data: NewBookFormData) => Promise<{ ok: boolean }>;
    updateBook: (id: string, data: NewBookFormData) => Promise<{ ok: boolean }>;
    removeBookLocal: (id: string) => void;
    markBookLent: (bookId: string) => void;

    dataVersion: number;
    showAddModal: boolean;
    setShowAddModal: (show: boolean) => void;
    editingBook: Book | null;
    setEditingBook: (book: Book | null) => void;

    searchQuery: string;
    setSearchQuery: (q: string) => void;
    activeFilter: BookStatus | 'All';
    setActiveFilter: (f: BookStatus | 'All') => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

function buildGenreMap(genres: BackendGenre[]): Map<number, string> {
    return new Map(genres.map((g) => [g.id, g.name]));
}

// An explicit id keeps same-named authors apart; without one the backend matches/creates by name.
function authorRef(data: NewBookFormData, authorId?: number) {
    const id = authorId ?? (data.authorId ? Number(data.authorId) : undefined);
    return { ...(id ? { id } : {}), name: data.author.trim(), image: '' };
}

// "Create a separate author" was chosen: create it first so the book can reference it by id.
async function createSeparateAuthor(data: NewBookFormData): Promise<number | null | undefined> {
    if (!data.newAuthor || data.authorId) return undefined;
    try {
        const res = await fetch('/api/author', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: data.author.trim(), image: '' }),
        });
        if (!res.ok) return null;
        const created: BackendAuthor | null = await res.json().catch(() => null);
        return created?.id ?? null;
    } catch {
        return null;
    }
}

function buildBookPayload(data: NewBookFormData, authorId?: number) {
    const genreId = Number(data.genre);
    return {
        name: data.title,
        author: authorRef(data, authorId),
        pages: parseInt(data.pages) || 0,
        isbn: data.isbn,
        publishedDate: data.year.trim() || undefined,
        publisher: data.publisher,
        quantity: parseInt(data.quantity) || 1,
        ...(data.translator.trim() ? { translator: data.translator.trim() } : {}),
        ...(data.language.trim() ? { language: data.language.trim() } : {}),
        ...(data.image ? { image: data.image } : {}),
        ...(data.backImage ? { backImage: data.backImage } : {}),
        ...(data.rating ? { rating: parseInt(data.rating) } : {}),
        ...(data.status === 'Owned' ? { status: 'OWNED' } : {}),
        ...(genreId ? { genreId } : {}),
    };
}

// Used only by updateBook/PUT. Unlike buildBookPayload (POST), this always includes `status`
// (mapped for all 4 frontend statuses, not just "Owned") so a PUT never silently drops the
// book's status. genreId is still omitted when genuinely unset (NaN/0), but is otherwise
// always included so an unrelated edit doesn't wipe out the book's genre.
function buildBookUpdatePayload(data: NewBookFormData, authorId?: number) {
    const genreId = Number(data.genre);
    return {
        name: data.title,
        author: authorRef(data, authorId),
        pages: parseInt(data.pages) || 0,
        isbn: data.isbn,
        publishedDate: data.year.trim() || undefined,
        publisher: data.publisher,
        quantity: parseInt(data.quantity) || 1,
        ...(data.translator.trim() ? { translator: data.translator.trim() } : {}),
        ...(data.language.trim() ? { language: data.language.trim() } : {}),
        ...(data.image ? { image: data.image } : {}),
        ...(data.backImage ? { backImage: data.backImage } : {}),
        ...(data.rating ? { rating: parseInt(data.rating) } : {}),
        status: mapBookStatusToBackendStatus(data.status),
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

function applySort(params: URLSearchParams, sort: SortState | null) {
    if (!sort) return;
    params.set('sort', sort.id);
    params.set('dir', sort.dir);
}

async function fetchBookPage(pageNum: number, genreMap: Map<number, string>, search?: string, status?: string, sort: SortState | null = null): Promise<
    { ok: true; items: Book[]; totalPages: number; totalItems: number } | { ok: false }
> {
    const params = new URLSearchParams({ page: String(pageNum), pageSize: String(PAGE_SIZE) });
    if (search?.trim()) params.set('q', search.trim());
    if (status) params.set('status', status);
    applySort(params, sort);
    let res: Response;
    try {
        res = await fetch(`/api/book?${params.toString()}`);
    } catch {
        return { ok: false };
    }
    if (!res.ok) return { ok: false };
    const data: PagedResponse<BackendBook> | null = await res.json().catch(() => null);
    if (!data || !Array.isArray(data.items)) return { ok: false };
    return {
        ok: true,
        items: data.items.map((b) => mapBackendBookToBook(b, genreMap)),
        totalPages: data.totalPages,
        totalItems: data.totalItems,
    };
}

async function fetchAuthorPage(pageNum: number, sort: SortState | null = null): Promise<
    { ok: true; items: BackendAuthor[]; totalPages: number; totalItems: number } | { ok: false }
> {
    let res: Response;
    try {
        const params = new URLSearchParams({ page: String(pageNum), pageSize: String(PAGE_SIZE) });
        applySort(params, sort);
        res = await fetch(`/api/author?${params.toString()}`);
    } catch {
        return { ok: false };
    }
    if (!res.ok) return { ok: false };
    const data: PagedResponse<BackendAuthor> | null = await res.json().catch(() => null);
    if (!data || !Array.isArray(data.items)) return { ok: false };
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

    // Sorting is server-side (lists are paginated). Refs mirror state so loaders always send the latest sort.
    const [booksSort, setBooksSortState] = useState<SortState | null>(null);
    const booksSortRef = useRef<SortState | null>(null);
    const [authorsSort, setAuthorsSortState] = useState<SortState | null>(null);
    const authorsSortRef = useRef<SortState | null>(null);

    const [genres, setGenres] = useState<BackendGenre[]>([]);

    // Bumped on every book mutation so mounted views (dashboard, book page) know to refetch.
    const [dataVersion, setDataVersion] = useState(0);
    const bumpVersion = useCallback(() => setDataVersion((v) => v + 1), []);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilterState] = useState<BookStatus | 'All'>('All');

    // "Latest ref" mirrors of searchQuery/activeFilter, updated every render. The mount effect
    // below needs to read whichever value is *current* once its own async work finishes, not
    // the value captured in its (never re-run) closure at mount time.
    const searchQueryRef = useRef(searchQuery);
    searchQueryRef.current = searchQuery;
    const activeFilterRef = useRef(activeFilter);
    activeFilterRef.current = activeFilter;

    // Monotonic request counters: guard against an in-flight loadBooks/loadAuthors call
    // whose response resolves after a newer call has already started (out-of-order network
    // resolution when paging quickly). Only the response matching the latest request id is committed.
    const booksRequestIdRef = useRef(0);
    const authorsRequestIdRef = useRef(0);

    // True once the initial mount load has applied its (empty) filters; gates the debounce
    // effect below so it doesn't double-fire on mount before there's anything to debounce.
    const mountedRef = useRef(false);
    // The search/status last actually sent to the backend, so paging (setPage/refetchBooks)
    // can keep re-requesting with the currently-applied filters instead of losing them.
    const appliedFiltersRef = useRef<{ search: string; status?: string }>({ search: '', status: undefined });
    // Whether a search/status filter is currently applied against the backend — used to decide
    // whether an optimistic local book mutation (add/update/markLent) is safe (no filter: the
    // mutated row still belongs under the current view) or must instead refetch the current
    // page from the server so rows that no longer match the filter drop out.
    const hasActiveFilter = useCallback(
        () => appliedFiltersRef.current.search.trim() !== '' || !!appliedFiltersRef.current.status || booksSortRef.current !== null,
        [],
    );

    const genreMap = useMemo(() => buildGenreMap(genres), [genres]);

    const loadBooks = useCallback(async (pageNum: number, map: Map<number, string>, search?: string, status?: string) => {
        const requestId = ++booksRequestIdRef.current;
        setBooksLoading(true);
        setBooksError(false);
        const result = await fetchBookPage(pageNum, map, search, status, booksSortRef.current);
        if (requestId !== booksRequestIdRef.current) return; // a newer request has since started; discard this stale response
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
        const requestId = ++authorsRequestIdRef.current;
        setAuthorsLoading(true);
        setAuthorsError(false);
        const result = await fetchAuthorPage(pageNum, authorsSortRef.current);
        if (requestId !== authorsRequestIdRef.current) return; // a newer request has since started; discard this stale response
        if (!result.ok) {
            setAuthorsError(true);
            setAuthorsLoading(false);
            return;
        }
        setAuthors(result.items.map((a) => mapBackendAuthorToAuthor(a, a.bookCount ?? 0)));
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
            const map = buildGenreMap(genreList);
            await loadBooks(1, map);
            mountedRef.current = true;
            // The user may have typed a search or picked a filter while this initial, unfiltered
            // load was still in flight. The debounce effect only reacts to a *change* in
            // searchQuery/activeFilter, so a change that happened while mountedRef was still
            // false would otherwise never be retried, leaving the unfiltered page 1 on screen
            // under an active-looking filter/search box. Apply it now if so.
            const latestSearch = searchQueryRef.current;
            const latestFilter = activeFilterRef.current;
            if (latestSearch.trim() !== '' || latestFilter !== 'All') {
                const backendStatus = latestFilter === 'All' ? undefined : mapBookStatusToBackendStatus(latestFilter);
                appliedFiltersRef.current = { search: latestSearch, status: backendStatus };
                await loadBooks(1, map, latestSearch, backendStatus);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadAuthors(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounces searchQuery/activeFilter changes into a fresh page-1 request carrying q/status.
    // Skipped on mount (mountedRef not yet true) so it never fires for the initial load.
    useEffect(() => {
        if (!mountedRef.current) return;
        const backendStatus = activeFilter === 'All' ? undefined : mapBookStatusToBackendStatus(activeFilter);
        const handle = setTimeout(() => {
            appliedFiltersRef.current = { search: searchQuery, status: backendStatus };
            loadBooks(1, genreMap, searchQuery, backendStatus);
        }, 300);
        return () => clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, activeFilter]);

    const setPage = useCallback((next: number) => {
        loadBooks(next, genreMap, appliedFiltersRef.current.search, appliedFiltersRef.current.status);
    }, [loadBooks, genreMap]);
    const setBooksSort = useCallback((sort: SortState | null) => {
        booksSortRef.current = sort;
        setBooksSortState(sort);
        loadBooks(1, genreMap, appliedFiltersRef.current.search, appliedFiltersRef.current.status);
    }, [loadBooks, genreMap]);
    const setAuthorsSort = useCallback((sort: SortState | null) => {
        authorsSortRef.current = sort;
        setAuthorsSortState(sort);
        loadAuthors(1);
    }, [loadAuthors]);
    const setAuthorsPage = useCallback((next: number) => { loadAuthors(next); }, [loadAuthors]);
    const refetchBooks = useCallback(() => {
        loadBooks(page, genreMap, appliedFiltersRef.current.search, appliedFiltersRef.current.status);
    }, [loadBooks, page, genreMap]);
    const refetchAuthors = useCallback(() => { loadAuthors(authorsPage); }, [loadAuthors, authorsPage]);
    const setActiveFilter = useCallback((f: BookStatus | 'All') => { setActiveFilterState(f); }, []);

    const addBook = useCallback(async (data: NewBookFormData): Promise<{ ok: boolean }> => {
        const newAuthorId = await createSeparateAuthor(data);
        if (newAuthorId === null) return { ok: false };
        let res: Response;
        try {
            res = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildBookPayload(data, newAuthorId)),
            });
        } catch {
            return { ok: false };
        }
        if (!res.ok) return { ok: false };
        const created: BackendBook | null = await res.json().catch(() => null);
        if (!created) return { ok: false };
        let mapped: Book;
        try {
            mapped = mapBackendBookToBook(created, genreMap);
        } catch {
            return { ok: false };
        }
        // Under an active search/filter the new book may not belong on the current page/view
        // (e.g. it doesn't match the search term, or its status differs from the active tab) —
        // refetch the current page from the server instead of just prepending it locally.
        if (hasActiveFilter()) {
            refetchBooks();
        } else {
            setBooks((prev) => [mapped, ...prev]);
        }
        bumpVersion();
        refetchAuthors();
        return { ok: true };
    }, [genreMap, hasActiveFilter, refetchBooks, bumpVersion, refetchAuthors]);

    const updateBook = useCallback(async (id: string, data: NewBookFormData): Promise<{ ok: boolean }> => {
        const newAuthorId = await createSeparateAuthor(data);
        if (newAuthorId === null) return { ok: false };
        let res: Response;
        try {
            res = await fetch(`/api/book/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildBookUpdatePayload(data, newAuthorId)),
            });
        } catch {
            return { ok: false };
        }
        if (!res.ok) return { ok: false };
        const updated: BackendBook | null = await res.json().catch(() => null);
        if (!updated) return { ok: false };
        let mapped: Book;
        try {
            mapped = mapBackendBookToBook(updated, genreMap);
        } catch {
            return { ok: false };
        }
        // Same reasoning as addBook above: under an active filter the edited book may no longer
        // belong on the current page/view, so re-fetch from the server rather than patch locally.
        if (hasActiveFilter()) {
            refetchBooks();
        } else {
            setBooks((prev) => prev.map((b) => (b.id === id ? mapped : b)));
        }
        bumpVersion();
        refetchAuthors();
        return { ok: true };
    }, [genreMap, hasActiveFilter, refetchBooks, bumpVersion, refetchAuthors]);

    const removeBookLocal = useCallback((id: string) => {
        setBooks((prev) => prev.filter((b) => b.id !== id));
        bumpVersion();
        refetchAuthors();
    }, [bumpVersion, refetchAuthors]);

    const markBookLent = useCallback((bookId: string) => {
        bumpVersion();
        // Same reasoning as addBook/updateBook: under an active filter (e.g. the "Owned" tab or
        // a search term) a book just marked lent may no longer belong in the current view, so
        // re-fetch from the server rather than just patch its status in place.
        if (hasActiveFilter()) {
            refetchBooks();
            return;
        }
        setBooks(prev => prev.map(b => (b.id === bookId ? { ...b, status: 'Lent Out' } : b)));
    }, [hasActiveFilter, refetchBooks, bumpVersion]);

    const value = useMemo(
        () => ({
            books, booksLoading, booksError, page, totalPages, totalItems, setPage, refetchBooks, booksSort, setBooksSort,
            authors, authorsLoading, authorsError, authorsPage, authorsTotalPages, setAuthorsPage, refetchAuthors, authorsSort, setAuthorsSort,
            genres,
            addBook, updateBook, removeBookLocal, markBookLent,
            dataVersion,
            showAddModal, setShowAddModal,
            editingBook, setEditingBook,
            searchQuery, setSearchQuery,
            activeFilter, setActiveFilter,
        }),
        [
            books, booksLoading, booksError, page, totalPages, totalItems, setPage, refetchBooks, booksSort, setBooksSort,
            authors, authorsLoading, authorsError, authorsPage, authorsTotalPages, setAuthorsPage, refetchAuthors, authorsSort, setAuthorsSort,
            genres, addBook, updateBook, removeBookLocal, markBookLent,
            dataVersion, showAddModal, editingBook, searchQuery,
            activeFilter, setActiveFilter,
        ],
    );

    return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
    const ctx = useContext(LibraryContext);
    if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
    return ctx;
}
