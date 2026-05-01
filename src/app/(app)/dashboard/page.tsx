'use client';

import {useRouter} from 'next/navigation';
import {useLibrary} from '@/src/contexts/LibraryContext';
import {filterBooks} from '@/src/lib/utils';
import DashboardPage from '@/src/components/pages/DashboardPage';

export default function DashboardRoute() {
    const {books, searchQuery, setSelectedBook} = useLibrary();
    const router = useRouter();

    const filtered = filterBooks(books, searchQuery);

    return (
        <DashboardPage
            books={filtered}
            onBookClick={setSelectedBook}
            onViewAll={() => router.push('/books')}
        />
    );
}
