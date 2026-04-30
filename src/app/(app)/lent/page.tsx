'use client';

import {useLibrary} from '@/src/contexts/LibraryContext';
import {getLentBooks} from '@/src/lib/data';
import LentPage from '@/src/components/pages/LentPage';

export default function LentRoute() {
    const {searchQuery} = useLibrary();

    const lentBooks = getLentBooks().filter(b =>
        searchQuery
            ? b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.author.toLowerCase().includes(searchQuery.toLowerCase())
            : true
    );

    return <LentPage lentBooks={lentBooks}/>;
}
