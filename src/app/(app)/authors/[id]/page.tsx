'use client';

import {useParams} from 'next/navigation';
import AuthorDetailPage from '@/src/components/pages/AuthorDetailPage';

export default function AuthorDetailRoute() {
    const {id} = useParams<{ id: string }>();
    return <AuthorDetailPage id={id}/>;
}
