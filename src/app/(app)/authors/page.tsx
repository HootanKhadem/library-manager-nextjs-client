'use client';

import {useLibrary} from '@/src/contexts/LibraryContext';
import AuthorsPage from '@/src/components/pages/AuthorsPage';

export default function AuthorsRoute() {
    const {
        authors, authorsLoading, authorsError,
        authorsPage, authorsTotalPages, setAuthorsPage, refetchAuthors,
    } = useLibrary();

    return (
        <AuthorsPage
            authors={authors}
            isError={authorsError}
            onRetry={refetchAuthors}
            isLoading={authorsLoading}
            page={authorsPage}
            totalPages={authorsTotalPages}
            onPageChange={setAuthorsPage}
        />
    );
}
