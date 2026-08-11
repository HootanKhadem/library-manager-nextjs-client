export type BookStatus = "Owned" | "Lent Out" | "Wishlist" | "Read";

export type BookGenre =
    | "Fiction"
    | "Non-fiction"
    | "Mystery"
    | "Science Fiction"
    | "Philosophy"
    | "Art Theory"
    | "Poetry"
    | "History"
    | "Biography"
    | "Psychology"
    | "Poetry/Prose"
    | "Other";

export interface LendRecord {
    lentTo: string;
    dateOut: string;
    dateReturned: string | null;
    condition?: string;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    year: number;
    genre: BookGenre | string;
    status: BookStatus;
    lentTo?: string;
    dueBack?: string;
    dateLent?: string;
    rating?: number;
    publisher?: string;
    isbn?: string;
    pages?: number;
    quantity?: number;
    description?: string;
    notes?: string;
    lendingHistory?: LendRecord[];
    overdue?: boolean;
}

export interface Author {
    id: string;
    initials: string;
    name: string;
    bookCount: number;
    genre: string;
}

export interface ActivityItem {
    id: string;
    type: "lent" | "returned" | "added";
    text: string;
    time: string;
}

export type PageId = "dashboard" | "books" | "lent" | "authors" | "settings";

export interface NewBookFormData {
    title: string;
    author: string;
    year: string;
    genre: string;
    status: BookStatus;
    publisher: string;
    isbn: string;
    pages: string;
    quantity: string;
    rating: string;
    description: string;
    notes: string;
}

// ── Dashboard API response types ────────────────────────────────────────────

export interface BookStats {
    totalBooks: number;
    addedThisMonth: number;
}

export interface LentOutStats {
    totalLentOut: number;
    uniqueLendees: number;
}

export interface OverdueStats {
    totalOverdue: number;
}

export interface DashboardBook {
    id: number;
    name: string;
    author: string;
    genre: string | null;
    status: string | null;
    rating: number | null;
}

export interface ActivityEntry {
    id: number;
    action: "LENT" | "RETURNED" | "ADDED" | "REMOVED" | "UPDATED";
    bookName: string | null;
    memberName: string | null;
    occurredAt: string | null;
}

// ── Lending API response type ────────────────────────────────────────────────

export interface ActiveLending {
    id: number;
    bookId: number;
    memberId: number;
    userId: number | null;
    lentDate: string;
    expectedReturnDate: string | null;
    actualReturnDate: string | null;
    status: "ACTIVE" | "OVERDUE" | "RETURNED";
}

// ── Paginated list / backend DTO types ──────────────────────────────────────

export interface PagedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export interface BackendAuthorRef {
    id?: number;
    name: string;
    image?: string;
}

export interface BackendBook {
    id: number;
    name: string;
    author: BackendAuthorRef;
    translator?: string;
    pages: number;
    isbn: string;
    publishedDate: string;
    publisher: string;
    quantity: number;
    image?: string;
    genreId?: number;
    rating?: number;
    status?: string;
    userId?: number;
}

export interface BackendAuthor {
    id: number;
    name: string;
    image: string;
    userId?: number;
}

export interface BackendGenre {
    id: number;
    name: string;
}
