"use client";

import { useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { Book, BookStatus } from "@/src/lib/types";
import { interpolate, useLanguage } from "@/src/lib/i18n/context";
import { PageHeader } from "@/src/components/ui/Topbar";
import { Button } from "@/src/components/ui/Button";
import { DataTable, DataTableHead, DataTableBody, DataTableRow, Th, Td } from "@/src/components/ui/DataTable";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { StarRating } from "@/src/components/ui/StarRating";
import { GenreTag } from "@/src/components/ui/GenreTag";

interface BooksPageProps {
    books: Book[];
    onBookClick: (book: Book) => void;
    onAddBook: () => void;
}

export default function BooksPage({ books, onBookClick, onAddBook }: BooksPageProps) {
    const { t } = useLanguage();
    const [activeFilter, setActiveFilter] = useState<BookStatus | "All">("All");
    const filtered = activeFilter === "All" ? books : books.filter((b) => b.status === activeFilter);

    const FILTERS: { value: BookStatus | "All"; label: string }[] = [
        { value: "All",      label: t.books.filterAll },
        { value: "Owned",    label: t.books.filterOwned },
        { value: "Lent Out", label: t.books.filterLentOut },
        { value: "Wishlist", label: t.books.filterWishlist },
    ];

    return (
        <div data-testid="books-page">
            <PageHeader
                title={t.books.title}
                subtitle={interpolate(t.books.subtitle, { count: String(books.length) })}
                action={
                    <div className="flex items-center gap-2 flex-wrap">
                        {FILTERS.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setActiveFilter(value)}
                                className={[
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                    activeFilter === value
                                        ? "bg-[var(--accent)] text-white"
                                        : "bg-transparent text-[var(--muted)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]",
                                ].join(" ")}
                            >
                                {label}
                            </button>
                        ))}
                        <Button variant="primary" size="sm" onClick={onAddBook}>
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            {t.common.add}
                        </Button>
                    </div>
                }
            />

            {filtered.length === 0 ? (
                <EmptyState
                    heading={t.common.noResults}
                    icon={<BookOpen className="h-6 w-6" />}
                    action={<Button variant="primary" size="sm" onClick={onAddBook}>{t.sidebar.addNewBook}</Button>}
                />
            ) : (
                <DataTable>
                    <DataTableHead>
                        <tr>
                            <Th>#</Th>
                            <Th>{t.books.colTitle}</Th>
                            <Th>{t.books.colAuthor}</Th>
                            <Th>{t.books.colYear}</Th>
                            <Th>{t.books.colGenre}</Th>
                            <Th>{t.books.colStatus}</Th>
                            <Th>{t.books.colLentTo}</Th>
                            <Th>{t.books.colRating}</Th>
                        </tr>
                    </DataTableHead>
                    <DataTableBody>
                        {filtered.map((book, i) => (
                            <DataTableRow
                                key={book.id}
                                onClick={() => onBookClick(book)}
                                className="cursor-pointer"
                            >
                                <Td className="text-[var(--muted-foreground)] tabular-nums w-12">
                                    {String(i + 1).padStart(3, "0")}
                                </Td>
                                <Td>
                                    <span className="font-medium text-[var(--foreground)]">{book.title}</span>
                                </Td>
                                <Td className="text-[var(--muted)]">{book.author}</Td>
                                <Td className="tabular-nums text-[var(--muted)]">{book.year}</Td>
                                <Td><GenreTag genre={book.genre} /></Td>
                                <Td><StatusBadge status={book.status} overdue={book.overdue} /></Td>
                                <Td>
                                    {book.lentTo ? (
                                        <span className={book.overdue ? "text-[var(--destructive)] font-medium text-xs" : "text-xs text-[var(--foreground)]"}>
                                            {book.lentTo}
                                            {book.overdue && <span className="ms-1 text-[var(--destructive)]">({t.common.overdue})</span>}
                                        </span>
                                    ) : (
                                        <span className="text-[var(--muted-foreground)]">—</span>
                                    )}
                                </Td>
                                <Td>
                                    {book.rating
                                        ? <StarRating value={book.rating} />
                                        : <span className="text-[var(--muted-foreground)]">—</span>
                                    }
                                </Td>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            )}
        </div>
    );
}
