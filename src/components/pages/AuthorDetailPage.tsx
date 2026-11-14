"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, GitMerge } from "lucide-react";
import { MergeAuthorsDrawer } from "@/src/components/MergeAuthorsDrawer";
import { Button } from "@/src/components/ui/Button";
import { BackendAuthor, BackendBook, Book } from "@/src/lib/types";
import { mapBackendBookToBook } from "@/src/lib/mappers";
import { interpolate, useLanguage } from "@/src/lib/i18n/context";
import { useLibrary } from "@/src/contexts/LibraryContext";
import { Avatar } from "@/src/components/ui/Avatar";
import { Card, CardHeader } from "@/src/components/ui/Card";
import { DataGrid, DataGridColumn } from "@/src/components/ui/DataGrid";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { StarRating } from "@/src/components/ui/StarRating";
import { GenreTag } from "@/src/components/ui/GenreTag";

type T = ReturnType<typeof useLanguage>["t"];

// Sorted in the browser: the works list is not paginated.
const workColumns = (t: T): DataGridColumn<Book>[] => [
    {
        id: "title", header: t.authors.colTitle, sortable: true, sortValue: (b) => b.title,
        cell: (b) => (
            <Link href={`/books/${b.id}`} className="font-medium text-[var(--foreground)] hover:text-[var(--accent)]">
                {b.title}
            </Link>
        ),
    },
    { id: "language", header: t.authors.colLanguage, sortable: true, sortValue: (b) => b.language, className: "text-[var(--muted)]", cell: (b) => b.language ?? "—" },
    { id: "year", header: t.authors.colYear, sortable: true, sortValue: (b) => b.year, className: "tabular-nums text-[var(--muted)]", cell: (b) => b.year ?? "—" },
    { id: "genre", header: t.authors.colGenre, sortable: true, sortValue: (b) => b.genre, cell: (b) => <GenreTag genre={b.genre} /> },
    { id: "status", header: t.authors.colStatus, sortable: true, sortValue: (b) => b.status, cell: (b) => <StatusBadge status={b.status} overdue={b.overdue} /> },
    {
        id: "rating", header: t.authors.colRating, sortable: true, sortValue: (b) => b.rating,
        cell: (b) => b.rating ? <StarRating value={b.rating} /> : <span className="text-[var(--muted-foreground)]">—</span>,
    },
];

export default function AuthorDetailPage({ id }: { id: string }) {
    const { t } = useLanguage();
    const { genres, dataVersion, refetchAuthors, refetchBooks } = useLibrary();
    const [mergeOpen, setMergeOpen] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const genreMap = useMemo(() => new Map(genres.map((g) => [g.id, g.name])), [genres]);

    const [result, setResult] = useState<
        { state: "missing" | "error" } | { state: "ready"; author: BackendAuthor; works: Book[] } | null
    >(null);
    const [attempt, setAttempt] = useState(0);

    const fetchAll = useCallback(async () => {
        try {
            const [aRes, bRes] = await Promise.all([fetch(`/api/author/${id}`), fetch(`/api/author/${id}/books`)]);
            if (aRes.status === 404) return { state: "missing" as const };
            if (!aRes.ok || !bRes.ok) return { state: "error" as const };
            const a: BackendAuthor | null = await aRes.json().catch(() => null);
            const b: BackendBook[] | null = await bRes.json().catch(() => null);
            if (!a || !Array.isArray(b)) return { state: "error" as const };
            return { state: "ready" as const, author: a, works: b.map((x) => mapBackendBookToBook(x, genreMap)) };
        } catch {
            return { state: "error" as const };
        }
    }, [id, genreMap]);

    // dataVersion: reload after books are added/edited/deleted elsewhere in the app.
    useEffect(() => {
        let cancelled = false;
        fetchAll().then((r) => { if (!cancelled) setResult(r); });
        return () => { cancelled = true; };
    }, [fetchAll, dataVersion, attempt]);

    const state = result?.state ?? "loading";
    const author = result?.state === "ready" ? result.author : null;
    const works = result?.state === "ready" ? result.works : [];
    const load = () => { setResult(null); setAttempt((a) => a + 1); };

    const handleMerged = ({ count, name }: { count: number; name: string }) => {
        setMergeOpen(false);
        setNotice(interpolate(t.authors.mergeSuccess, { count: String(count), name }));
        setAttempt((a) => a + 1); // reload this author and its works (no loading flash)
        refetchAuthors();
        refetchBooks();
    };

    const back = (
        <Link href="/authors" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            {t.authors.backToAuthors}
        </Link>
    );

    if (state === "loading") {
        return <div data-testid="author-detail-page">{back}<p className="py-16 text-center text-sm text-[var(--muted)]">{t.common.loading}</p></div>;
    }
    if (state !== "ready" || !author) {
        return (
            <div data-testid="author-detail-page">
                {back}
                <ErrorState
                    heading={state === "missing" ? t.authors.notFound : t.common.errorHeading}
                    description={state === "missing" ? "" : t.common.errorDescription}
                    retryLabel={t.common.retry}
                    onRetry={state === "missing" ? undefined : load}
                />
            </div>
        );
    }

    const rated = works.filter((w) => w.rating);
    const avgRating = rated.length ? (rated.reduce((s, w) => s + (w.rating ?? 0), 0) / rated.length).toFixed(1) : "—";
    const lentOut = works.filter((w) => w.status === "Lent Out").length;

    return (
        <div data-testid="author-detail-page">
            {back}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Avatar name={author.name} size="lg" className="!h-16 !w-16 !text-xl" />
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{author.name}</h1>
                        <p className="mt-0.5 text-sm text-[var(--muted)]">
                            {interpolate(t.authors.booksInCollection, { count: String(works.length) })}
                        </p>
                    </div>
                </div>
                <Button variant="secondary" onClick={() => { setNotice(null); setMergeOpen(true); }}>
                    <GitMerge className="h-4 w-4" aria-hidden="true" />
                    {t.authors.mergeButton}
                </Button>
            </div>

            {notice && (
                <p role="status" className="mb-6 rounded-xl border border-[var(--success)] bg-green-50 px-4 py-2.5 text-sm font-medium text-[var(--success)]">
                    {notice}
                </p>
            )}

            <MergeAuthorsDrawer author={author} open={mergeOpen} onClose={() => setMergeOpen(false)} onMerged={handleMerged} />

            <dl className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label={t.authors.statBooks} value={String(works.length)} />
                <Stat label={t.authors.statOwned} value={String(works.filter((w) => w.status === "Owned").length)} />
                <Stat label={t.authors.statLentOut} value={String(lentOut)} />
                <Stat label={t.authors.statAvgRating} value={avgRating} />
            </dl>

            <Card>
                <CardHeader>
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                        {interpolate(t.authors.completeWorksTitle, { name: author.name })}
                    </span>
                </CardHeader>
                {works.length === 0 ? (
                    <EmptyState
                        heading={t.authors.emptyWorks}
                        description={t.authors.emptyWorksDesc}
                        icon={<BookOpen className="h-6 w-6" />}
                        className="py-10"
                    />
                ) : (
                    <DataGrid
                        className="rounded-t-none border-0 shadow-none"
                        columns={workColumns(t)}
                        rows={works}
                        rowKey={(b) => b.id}
                    />
                )}
            </Card>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <Card className="px-5 py-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</dt>
            <dd className="mt-1 text-2xl font-bold text-[var(--foreground)]">{value}</dd>
        </Card>
    );
}
