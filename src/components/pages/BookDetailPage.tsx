"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImageOff } from "lucide-react";
import { BackendBook, Book, LendRecord } from "@/src/lib/types";
import { mapBackendBookToBook } from "@/src/lib/mappers";
import { useLanguage } from "@/src/lib/i18n/context";
import { useLibrary } from "@/src/contexts/LibraryContext";
import { Card, CardBody } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { StarRating } from "@/src/components/ui/StarRating";
import { GenreTag } from "@/src/components/ui/GenreTag";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { DataGrid, DataGridColumn } from "@/src/components/ui/DataGrid";

type T = ReturnType<typeof useLanguage>["t"];

const lendingColumns = (t: T): DataGridColumn<LendRecord>[] => [
    { id: "lentTo", header: t.bookDetail.colLentTo, sortable: true, sortValue: (r) => r.lentTo, cell: (r) => r.lentTo },
    { id: "dateOut", header: t.bookDetail.colDateOut, sortable: true, sortValue: (r) => r.dateOut, cell: (r) => r.dateOut },
    { id: "dateReturned", header: t.bookDetail.colDateReturned, sortable: true, sortValue: (r) => r.dateReturned, cell: (r) => r.dateReturned ?? "—" },
    { id: "condition", header: t.bookDetail.colCondition, sortable: true, sortValue: (r) => r.condition, cell: (r) => r.condition ?? "—" },
];

export default function BookDetailPage({ id }: { id: string }) {
    const { t } = useLanguage();
    const router = useRouter();
    const { genres, dataVersion, setEditingBook, removeBookLocal, markBookLent } = useLibrary();
    const genreMap = useMemo(() => new Map(genres.map((g) => [g.id, g.name])), [genres]);

    const [book, setBook] = useState<Book | null>(null);
    const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
    const [members, setMembers] = useState<{ id: number; name: string }[]>([]);
    const [membersLoaded, setMembersLoaded] = useState(false);
    const [memberId, setMemberId] = useState("");
    const [lending, setLending] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/book/${id}`);
            if (res.status === 404) { setState("missing"); return; }
            if (!res.ok) { setState("error"); return; }
            const data: BackendBook | null = await res.json().catch(() => null);
            if (!data) { setState("error"); return; }
            setBook(mapBackendBookToBook(data, genreMap));
            setState("ready");
        } catch {
            setState("error");
        }
    }, [id, genreMap]);

    // dataVersion: refetch after an edit/lend made through the shared modals.
    useEffect(() => { load(); }, [load, dataVersion]);

    useEffect(() => {
        fetch("/api/member")
            .then((res) => (res.ok ? res.json() : []))
            .then(setMembers)
            .catch(() => setMembers([]))
            .finally(() => setMembersLoaded(true));
    }, []);

    async function handleLend() {
        if (!memberId || !book) return;
        setLending(true);
        setError(null);
        try {
            const res = await fetch("/api/lending", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookId: Number(book.id),
                    memberId: Number(memberId),
                    lentDate: new Date().toISOString().slice(0, 10),
                }),
            });
            if (res.ok) {
                setMemberId("");
                markBookLent(book.id);
            } else {
                setError(t.common.errorHeading);
            }
        } catch {
            setError(t.common.errorHeading);
        } finally {
            setLending(false);
        }
    }

    async function handleDelete() {
        if (!book) return;
        if (!confirmingDelete) {
            setConfirmingDelete(true);
            return;
        }
        setDeleting(true);
        setError(null);
        try {
            const res = await fetch(`/api/book/${book.id}`, { method: "DELETE" });
            if (res.ok) {
                removeBookLocal(book.id);
                router.replace("/books");
                return;
            }
            setError(res.status === 409 ? t.bookDetail.errorDeleteConflict : t.common.errorHeading);
        } catch {
            setError(t.common.errorHeading);
        }
        setConfirmingDelete(false);
        setDeleting(false);
    }

    const back = (
        <Link href="/books" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            {t.bookDetail.backToBooks}
        </Link>
    );

    if (state === "loading") {
        return <div data-testid="book-detail-page">{back}<p className="py-16 text-center text-sm text-[var(--muted)]">{t.common.loading}</p></div>;
    }
    if (state !== "ready" || !book) {
        return (
            <div data-testid="book-detail-page">
                {back}
                <ErrorState
                    heading={state === "missing" ? t.bookDetail.notFound : t.common.errorHeading}
                    description={state === "missing" ? "" : t.common.errorDescription}
                    retryLabel={t.common.retry}
                    onRetry={state === "missing" ? undefined : load}
                />
            </div>
        );
    }

    return (
        <div data-testid="book-detail-page">
            {back}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
                <div className="grid grid-cols-2 gap-3 content-start" aria-label={t.bookDetail.labelCovers}>
                    <Cover src={book.image} label={t.bookDetail.frontCover} empty={t.bookDetail.noCover} />
                    <Cover src={book.backImage} label={t.bookDetail.backCover} empty={t.bookDetail.noCover} />
                </div>

                <Card>
                    <CardBody className="p-6">
                        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{book.title}</h1>
                        <p className="mt-1 text-sm text-[var(--muted)]">{book.author}</p>

                        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                            <Meta label={t.bookDetail.labelStatus}><StatusBadge status={book.status} overdue={book.overdue} /></Meta>
                            <Meta label={t.bookDetail.labelGenre}><GenreTag genre={book.genre} /></Meta>
                            <Meta label={t.bookDetail.labelRating}>
                                {book.rating ? <StarRating value={book.rating} /> : <Dash />}
                            </Meta>
                            <Meta label={t.bookDetail.labelYear}>{book.year == null ? "—" : String(book.year)}</Meta>
                            <Meta label={t.bookDetail.labelPublisher}>{book.publisher}</Meta>
                            <Meta label={t.bookDetail.labelTranslator}>{book.translator}</Meta>
                            <Meta label={t.bookDetail.labelLanguage}>{book.language}</Meta>
                            <Meta label={t.bookDetail.labelIsbn} mono>{book.isbn}</Meta>
                            <Meta label={t.bookDetail.labelPages}>{book.pages !== undefined ? String(book.pages) : undefined}</Meta>
                            <Meta label={t.bookDetail.labelQuantity}>{book.quantity !== undefined ? String(book.quantity) : undefined}</Meta>
                        </dl>

                        {book.description && (
                            <p className="mt-6 border-s-2 border-[var(--accent)] ps-3 text-sm italic leading-relaxed text-[var(--foreground)]">
                                {book.description}
                            </p>
                        )}

                        <div className="mt-6">
                            <label htmlFor="book-notes" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                                {t.bookDetail.labelNotes}
                            </label>
                            <textarea
                                id="book-notes"
                                defaultValue={book.notes ?? ""}
                                placeholder={t.bookDetail.notesPlaceholder}
                                rows={3}
                                className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 hover:border-[var(--border-strong)]"
                            />
                        </div>

                        {members.length > 0 && (
                            <div className="mt-6">
                                <label htmlFor="lend-to-select" className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                                    {t.bookDetail.labelLendTo}
                                </label>
                                <select
                                    id="lend-to-select"
                                    value={memberId}
                                    onChange={(e) => setMemberId(e.target.value)}
                                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
                                >
                                    <option value="">{t.bookDetail.selectMember}</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {membersLoaded && members.length === 0 && (
                            <p className="mt-6 text-sm text-[var(--muted)]">{t.bookDetail.noMembers}</p>
                        )}

                        {error && <p role="alert" className="mt-4 text-sm text-[var(--destructive)]">{error}</p>}

                        <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                            <Button variant="primary" size="sm" onClick={handleLend} disabled={!memberId || lending}>{t.bookDetail.btnLend}</Button>
                            <Button variant="secondary" size="sm" onClick={() => setEditingBook(book)}>{t.bookDetail.btnEdit}</Button>
                            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting} loading={deleting}>
                                {confirmingDelete ? t.bookDetail.btnConfirmDelete : t.bookDetail.btnDelete}
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {book.lendingHistory && book.lendingHistory.length > 0 && (
                <div className="mt-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t.bookDetail.labelLendingHistory}</p>
                    <DataGrid
                        columns={lendingColumns(t)}
                        rows={book.lendingHistory}
                        rowKey={(_, i) => i}
                    />
                </div>
            )}
        </div>
    );
}

function Dash() {
    return <span className="text-sm text-[var(--muted)]">—</span>;
}

function Meta({ label, children, mono = false }: { label: string; children?: React.ReactNode; mono?: boolean }) {
    return (
        <div>
            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</dt>
            <dd className={["text-sm font-medium text-[var(--foreground)]", mono ? "font-mono text-xs" : ""].join(" ")}>
                {children || <Dash />}
            </dd>
        </div>
    );
}

function Cover({ src, label, empty }: { src?: string; label: string; empty: string }) {
    return (
        <figure className="m-0">
            <div className="flex aspect-[2/3] w-full items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]" style={{ boxShadow: "var(--shadow-card)" }}>
                {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={label} className="h-full w-full object-cover" />
                ) : (
                    <span className="flex flex-col items-center gap-1 text-xs text-[var(--muted-foreground)]">
                        <ImageOff className="h-5 w-5" aria-hidden="true" />
                        {empty}
                    </span>
                )}
            </div>
            <figcaption className="mt-1.5 text-center text-xs text-[var(--muted)]">{label}</figcaption>
        </figure>
    );
}
