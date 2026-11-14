'use client';

import {useCallback, useMemo} from 'react';
import {useLibrary} from '@/src/contexts/LibraryContext';
import AuthorsPage from '@/src/components/pages/AuthorsPage';
import {BackendBook, Book} from '@/src/lib/types';
import {mapBackendBookToBook} from '@/src/lib/mappers';

export default function AuthorsRoute() {
    const {
        authors, authorsLoading, authorsError,
        authorsPage, authorsTotalPages, setAuthorsPage, refetchAuthors, genres, dataVersion,
    } = useLibrary();

    const genreMap = useMemo(() => new Map(genres.map((g) => [g.id, g.name])), [genres]);

    const loadWorks = useCallback(async (authorId: string): Promise<Book[] | null> => {
        try {
            const res = await fetch(`/api/author/${authorId}/books`);
            if (!res.ok) return null;
            const data: BackendBook[] | null = await res.json().catch(() => null);
            if (!Array.isArray(data)) return null;
            return data.map((b) => mapBackendBookToBook(b, genreMap));
        } catch {
            return null;
        }
    }, [genreMap]);

    return (
        <AuthorsPage
            authors={authors}
            loadWorks={loadWorks}
            refreshKey={dataVersion}
            isError={authorsError}
            onRetry={refetchAuthors}
            isLoading={authorsLoading}
            page={authorsPage}
            totalPages={authorsTotalPages}
            onPageChange={setAuthorsPage}
        />
    );
}
