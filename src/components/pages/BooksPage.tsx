"use client";

import { Plus, BookOpen } from "lucide-react";
import { Book, BookStatus } from "@/src/lib/types";
import { interpolate, useLanguage } from "@/src/lib/i18n/context";
import { PageHeader } from "@/src/components/ui/Topbar";
import { Button } from "@/src/components/ui/Button";
import { DataGrid, DataGridColumn, SortState } from "@/src/components/ui/DataGrid";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { StarRating } from "@/src/components/ui/StarRating";
import { GenreTag } from "@/src/components/ui/GenreTag";
import Pagination from "@/src/components/ui/Pagination";

interface BooksPageProps {
    books: Book[];
    onBookClick: (book: Book) => void;
    onAddBook: () => void;
    isError?: boolean;
    onRetry?: () => void;
    isLoading?: boolean;
    page?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    totalItems?: number;
    activeFilter?: BookStatus | "All";
    onFilterChange?: (f: BookStatus | "All") => void;
    searchQuery?: string;
    sort?: SortState | null;
    onSortChange?: (sort: SortState | null) => void;
}

export default function BooksPage({
    books, onBookClick, onAddBook, isError, onRetry,
    isLoading = false, page = 1, totalPages = 1, onPageChange = () => {}, totalItems,
    activeFilter = "All", onFilterChange, searchQuery = "",
    sort = null, onSortChange = () => {},
}: BooksPageProps) {
    const { t } = useLanguage();
    const displayCount = totalItems ?? books.length;

    const FILTERS: { value: BookStatus | "All"; label: string }[] = [
        { value: "All",      label: t.books.filterAll },
        { value: "Owned",    label: t.books.filterOwned },
        { value: "Lent Out", label: t.books.filterLentOut },
        { value: "Wishlist", label: t.books.filterWishlist },
    ];

    // Column ids double as the backend `sort` values.
    const COLUMNS: DataGridColumn<Book>[] = [
        {
            id: "number", header: t.books.colNumber,
            className: "text-[var(--muted-foreground)] tabular-nums w-12",
            cell: (_, i) => String(i + 1).padStart(3, "0"),
        },
        { id: "name", header: t.books.colTitle, sortable: true, cell: (b) => <span className="font-medium text-[var(--foreground)]">{b.title}</span> },
        { id: "author", header: t.books.colAuthor, sortable: true, className: "text-[var(--muted)]", cell: (b) => b.author },
        { id: "language", header: t.books.colLanguage, sortable: true, className: "text-[var(--muted)]", cell: (b) => b.language ?? "—" },
        { id: "publishedDate", header: t.books.colYear, sortable: true, className: "tabular-nums text-[var(--muted)]", cell: (b) => b.year ?? "—" },
        { id: "genre", header: t.books.colGenre, sortable: true, cell: (b) => <GenreTag genre={b.genre} /> },
        { id: "status", header: t.books.colStatus, sortable: true, cell: (b) => <StatusBadge status={b.status} overdue={b.overdue} /> },
        {
            id: "lentTo", header: t.books.colLentTo,
            cell: (b) => b.lentTo ? (
                <span className={b.overdue ? "text-[var(--destructive)] font-medium text-xs" : "text-xs text-[var(--foreground)]"}>
                    {b.lentTo}
                    {b.overdue && <span className="ms-1 text-[var(--destructive)]">({t.common.overdue})</span>}
                </span>
            ) : (
                <span className="text-[var(--muted-foreground)]">—</span>
            ),
        },
        {
            id: "rating", header: t.books.colRating, sortable: true,
            cell: (b) => b.rating ? <StarRating value={b.rating} /> : <span className="text-[var(--muted-foreground)]">—</span>,
        },
    ];

    return (
        <div data-testid="books-page">
            <PageHeader
                title={t.books.title}
                subtitle={interpolate(t.books.subtitle, { count: String(displayCount) })}
                action={
                    <div className="flex items-center gap-2 flex-wrap">
                        {FILTERS.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => onFilterChange?.(value)}
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

            {isError ? (
                <ErrorState
                    heading={t.common.errorHeading}
                    description={t.common.errorDescription}
                    retryLabel={t.common.retry}
                    onRetry={onRetry}
                />
            ) : isLoading && books.length === 0 ? (
                <p className="py-16 text-center text-sm text-[var(--muted)]">{t.common.loading}</p>
            ) : books.length === 0 ? (
                activeFilter === "All" && !searchQuery.trim() ? (
                    <EmptyState
                        heading={t.books.emptyAll}
                        description={t.books.emptyAllDesc}
                        icon={<BookOpen className="h-6 w-6" />}
                        action={<Button variant="primary" size="sm" onClick={onAddBook}>{t.sidebar.addNewBook}</Button>}
                    />
                ) : (
                    <EmptyState
                        heading={t.books.emptyFiltered}
                        description={t.books.emptyFilteredDesc}
                        icon={<BookOpen className="h-6 w-6" />}
                    />
                )
            ) : (
                <>
                    <DataGrid
                        columns={COLUMNS}
                        rows={books}
                        rowKey={(b) => b.id}
                        onRowClick={onBookClick}
                        sort={sort}
                        onSortChange={onSortChange}
                    />
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        prevLabel={t.common.prev}
                        nextLabel={t.common.next}
                    />
                </>
            )}
        </div>
    );
}
