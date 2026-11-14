"use client";

import Link from "next/link";
import { Author } from "@/src/lib/types";
import { interpolate, useLanguage } from "@/src/lib/i18n/context";
import { PageHeader } from "@/src/components/ui/Topbar";
import { DataGrid, DataGridColumn, SortState } from "@/src/components/ui/DataGrid";
import { Avatar } from "@/src/components/ui/Avatar";
import { Users } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import Pagination from "@/src/components/ui/Pagination";

interface AuthorsPageProps {
    authors: Author[];
    isError?: boolean;
    onRetry?: () => void;
    isLoading?: boolean;
    page?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    sort?: SortState | null;
    onSortChange?: (sort: SortState | null) => void;
}

export default function AuthorsPage({
    authors, isError, onRetry,
    isLoading = false, page = 1, totalPages = 1, onPageChange = () => {},
    sort = null, onSortChange = () => {},
}: AuthorsPageProps) {
    const { t } = useLanguage();

    // Column ids double as the backend `sort` values.
    const COLUMNS: DataGridColumn<Author>[] = [
        {
            id: "name", header: t.authors.colName, sortable: true,
            cell: (a) => (
                <Link href={`/authors/${a.id}`} className="flex items-center gap-3 font-medium text-[var(--foreground)] hover:text-[var(--accent)]">
                    <Avatar name={a.name} size="sm" />
                    {a.name}
                </Link>
            ),
        },
        { id: "bookCount", header: t.authors.colBooks, sortable: true, className: "tabular-nums text-[var(--muted)]", cell: (a) => a.bookCount },
    ];

    return (
        <div data-testid="authors-page">
            <PageHeader
                title={t.authors.title}
                subtitle={interpolate(t.authors.subtitle, { count: String(authors.length) })}
            />

            {isError ? (
                <ErrorState
                    heading={t.common.errorHeading}
                    description={t.common.errorDescription}
                    retryLabel={t.common.retry}
                    onRetry={onRetry}
                />
            ) : isLoading && authors.length === 0 ? (
                <p className="py-16 text-center text-sm text-[var(--muted)]">{t.common.loading}</p>
            ) : authors.length === 0 ? (
                <EmptyState
                    heading={t.authors.emptyAuthors}
                    description={t.authors.emptyAuthorsDesc}
                    icon={<Users className="h-6 w-6" />}
                />
            ) : (
                <>
                    <DataGrid
                        columns={COLUMNS}
                        rows={authors}
                        rowKey={(a) => a.id}
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
