"use client";

import { useEffect, useRef, useState } from "react";
import { Author, Book } from "@/src/lib/types";
import { interpolate, useLanguage } from "@/src/lib/i18n/context";
import { PageHeader } from "@/src/components/ui/Topbar";
import { Card, CardHeader, CardBody } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { DataTable, DataTableHead, DataTableBody, DataTableRow, Th, Td } from "@/src/components/ui/DataTable";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { StarRating } from "@/src/components/ui/StarRating";
import { GenreTag } from "@/src/components/ui/GenreTag";
import { Avatar } from "@/src/components/ui/Avatar";
import { Users, BookOpen } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import Pagination from "@/src/components/ui/Pagination";

interface AuthorsPageProps {
    authors: Author[];
    /** Loads the books of one author; null means the request failed. */
    loadWorks?: (authorId: string) => Promise<Book[] | null>;
    /** Changes when books are mutated elsewhere, so the open author's works reload. */
    refreshKey?: number;
    isError?: boolean;
    onRetry?: () => void;
    isLoading?: boolean;
    page?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

export default function AuthorsPage({
    authors, loadWorks, refreshKey = 0, isError, onRetry,
    isLoading = false, page = 1, totalPages = 1, onPageChange = () => {},
}: AuthorsPageProps) {
    const { t } = useLanguage();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [result, setResult] = useState<{ id: string; works: Book[] | null } | null>(null);
    const [attempt, setAttempt] = useState(0);
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!selectedId || !loadWorks) return;
        let cancelled = false;
        loadWorks(selectedId).then((works) => {
            if (!cancelled) setResult({ id: selectedId, works });
        });
        return () => { cancelled = true; };
    }, [selectedId, loadWorks, refreshKey, attempt]);

    const selected = authors.find((a) => a.id === selectedId) ?? null;
    const current = result && result.id === selectedId ? result : null;
    const worksLoading = !!selected && !current;
    const worksError = !!current && current.works === null;
    const works = current?.works ?? [];

    function changeAuthor() {
        setSelectedId(null);
        gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

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
                <p className="py-16 text-center text-sm text-[var(--muted)] mb-6">{t.common.loading}</p>
            ) : authors.length === 0 ? (
                <EmptyState
                    heading={t.authors.emptyAuthors}
                    description={t.authors.emptyAuthorsDesc}
                    icon={<Users className="h-6 w-6" />}
                    className="mb-6"
                />
            ) : (
                <>
                    <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
                        {authors.map((author) => (
                            <AuthorCard
                                key={author.id}
                                author={author}
                                selected={author.id === selectedId}
                                onSelect={() => setSelectedId(author.id)}
                            />
                        ))}
                    </div>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        prevLabel={t.common.prev}
                        nextLabel={t.common.next}
                    />
                    <div className="mb-6" />
                </>
            )}

            <Card>
                <CardHeader>
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                        {selected
                            ? interpolate(t.authors.completeWorksTitle, { name: selected.name })
                            : t.authors.selectAuthor}
                    </span>
                    {selected && (
                        <Button variant="ghost" size="sm" onClick={changeAuthor}>{t.authors.changeAuthor}</Button>
                    )}
                </CardHeader>

                {!selected ? (
                    <EmptyState
                        heading={t.authors.selectAuthor}
                        description={t.authors.selectAuthorDesc}
                        icon={<Users className="h-6 w-6" />}
                        className="py-10"
                    />
                ) : worksError ? (
                    <ErrorState
                        heading={t.common.errorHeading}
                        description={t.common.errorDescription}
                        retryLabel={t.common.retry}
                        onRetry={() => { setResult(null); setAttempt((a) => a + 1); }}
                        className="py-10"
                    />
                ) : worksLoading ? (
                    <p className="py-10 text-center text-sm text-[var(--muted)]">{t.common.loading}</p>
                ) : works.length === 0 ? (
                    <EmptyState
                        heading={t.authors.emptyWorks}
                        description={t.authors.emptyWorksDesc}
                        icon={<BookOpen className="h-6 w-6" />}
                        className="py-10"
                    />
                ) : (
                    <DataTable className="rounded-t-none border-0 shadow-none">
                        <DataTableHead>
                            <tr>
                                <Th>{t.authors.colTitle}</Th>
                                <Th>{t.authors.colYear}</Th>
                                <Th>{t.authors.colGenre}</Th>
                                <Th>{t.authors.colStatus}</Th>
                                <Th>{t.authors.colRating}</Th>
                            </tr>
                        </DataTableHead>
                        <DataTableBody>
                            {works.map((book) => (
                                <DataTableRow key={book.id}>
                                    <Td>
                                        <span className="font-medium text-[var(--foreground)]">{book.title}</span>
                                    </Td>
                                    <Td className="tabular-nums text-[var(--muted)]">{book.year}</Td>
                                    <Td><GenreTag genre={book.genre} /></Td>
                                    <Td><StatusBadge status={book.status} overdue={book.overdue} /></Td>
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
            </Card>
        </div>
    );
}

function AuthorCard({ author, selected, onSelect }: { author: Author; selected: boolean; onSelect: () => void }) {
    const { t } = useLanguage();
    return (
        <button type="button" onClick={onSelect} aria-pressed={selected} className="text-start cursor-pointer">
            <Card className={[
                "text-center p-5 hover:-translate-y-0.5 transition-all",
                selected ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/20" : "",
            ].join(" ")}>
                <CardBody className="flex flex-col items-center gap-2 p-0">
                    <Avatar name={author.name} size="lg" />
                    <div>
                        <p className="text-sm font-semibold text-[var(--foreground)] leading-tight">{author.name}</p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                            {interpolate(t.authors.booksInCollection, { count: String(author.bookCount) })}
                        </p>
                    </div>
                    {author.genre && <GenreTag genre={author.genre} />}
                </CardBody>
            </Card>
        </button>
    );
}
