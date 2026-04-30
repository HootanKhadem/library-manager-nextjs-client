import {Book} from '@/src/lib/types';

export function filterBooks(books: Book[], query: string): Book[] {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
        b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
    );
}
