'use client';

import {useLibrary} from '@/src/contexts/LibraryContext';
import AuthorsPage from '@/src/components/pages/AuthorsPage';

export default function AuthorsRoute() {
    const {
        authors, books, authorsLoading, authorsError,
        authorsPage, authorsTotalPages, setAuthorsPage, refetchAuthors,
    } = useLibrary();

    const bookCountByAuthor = books.reduce<Record<string, number>>((acc, b) => {
        acc[b.author] = (acc[b.author] ?? 0) + 1;
        return acc;
    }, {});
    const authorsWithCounts = authors.map((a) => ({ ...a, bookCount: bookCountByAuthor[a.name] ?? 0 }));

    const borgesWorks = books.filter((b) => b.author === "Jorge Luis Borges");

    return (
        <AuthorsPage
            authors={authorsWithCounts}
            borgesWorks={borgesWorks}
            isError={authorsError}
            onRetry={refetchAuthors}
            isLoading={authorsLoading}
            page={authorsPage}
            totalPages={authorsTotalPages}
            onPageChange={setAuthorsPage}
        />
    );
}
