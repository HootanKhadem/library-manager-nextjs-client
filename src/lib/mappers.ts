import {
    Author,
    BackendAuthor,
    BackendBook,
    BackendGenre,
    Book,
    BookStatus,
    NewBookFormData,
} from "@/src/lib/types";

const STATUS_BACKEND_TO_FRONTEND: Record<string, BookStatus> = {
    OWNED: "Owned",
    LENT_OUT: "Lent Out",
    WISHLIST: "Wishlist",
    READ: "Read",
};

export function mapBackendStatusToBookStatus(status: string | undefined): BookStatus {
    if (!status) return "Owned";
    return STATUS_BACKEND_TO_FRONTEND[status] ?? "Owned";
}

export function extractYear(publishedDate: string | undefined): number {
    const match = publishedDate?.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : new Date().getFullYear();
}

export function mapBackendBookToBook(b: BackendBook, genreMap: Map<number, string>): Book {
    return {
        id: String(b.id),
        title: b.name,
        author: b.author.name,
        year: extractYear(b.publishedDate),
        genre: (b.genreId !== undefined ? genreMap.get(b.genreId) : undefined) ?? "Other",
        status: mapBackendStatusToBookStatus(b.status),
        publisher: b.publisher || undefined,
        isbn: b.isbn || undefined,
        pages: b.pages || undefined,
        rating: b.rating || undefined,
        quantity: b.quantity,
    };
}

function initialsFromName(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function mapBackendAuthorToAuthor(a: BackendAuthor, bookCount: number): Author {
    return {
        id: String(a.id),
        initials: initialsFromName(a.name),
        name: a.name,
        bookCount,
        genre: "",
    };
}

export function bookToFormData(book: Book, genres: BackendGenre[]): NewBookFormData {
    const matchedGenre = genres.find((g) => g.name === book.genre);
    return {
        title: book.title,
        author: book.author,
        year: String(book.year),
        genre: matchedGenre ? String(matchedGenre.id) : "",
        status: book.status,
        publisher: book.publisher ?? "",
        isbn: book.isbn ?? "",
        pages: book.pages !== undefined ? String(book.pages) : "",
        quantity: book.quantity !== undefined ? String(book.quantity) : "1",
        rating: book.rating !== undefined ? String(book.rating) : "",
        description: book.description ?? "",
        notes: book.notes ?? "",
    };
}
