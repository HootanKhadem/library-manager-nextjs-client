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
