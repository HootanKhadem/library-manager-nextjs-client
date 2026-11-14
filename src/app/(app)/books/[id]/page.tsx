'use client';

import {useParams} from 'next/navigation';
import BookDetailPage from '@/src/components/pages/BookDetailPage';

export default function BookDetailRoute() {
    const {id} = useParams<{ id: string }>();
    return <BookDetailPage id={id}/>;
}
