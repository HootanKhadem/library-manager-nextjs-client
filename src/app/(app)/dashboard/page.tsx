'use client';

import {useRouter} from 'next/navigation';
import {useLibrary} from '@/src/contexts/LibraryContext';
import DashboardPage from '@/src/components/pages/DashboardPage';

export default function DashboardRoute() {
    const {books, searchQuery, setSelectedBook} = useLibrary();
    const router = useRouter();

    const filtered = searchQuery.trim()
        ? books.filter(b =>
            b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.author.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : books;

    return (
        <DashboardPage
            books={filtered}
            onBookClick={setSelectedBook}
            onViewAll={() => router.push('/books')}
        />
    );
}
