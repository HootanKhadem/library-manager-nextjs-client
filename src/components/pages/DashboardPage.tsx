"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Bookmark, AlertCircle, Activity } from "lucide-react";
import {
    BookStats, LentOutStats, OverdueStats, DashboardBook, ActivityEntry,
} from "@/src/lib/types";
import { useLanguage } from "@/src/lib/i18n/context";
import { Card, CardHeader, CardBody } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { DataTable, DataTableHead, DataTableBody, DataTableRow, Th, Td } from "@/src/components/ui/DataTable";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { StarRating } from "@/src/components/ui/StarRating";
import { GenreTag } from "@/src/components/ui/GenreTag";
import { PageHeader } from "@/src/components/ui/Topbar";

interface SectionState<T> {
    data: T | null;
    loading: boolean;
    error: boolean;
}

function initialState<T>(): SectionState<T> {
    return { data: null, loading: true, error: false };
}

interface DashboardPageProps {
    onViewAll: () => void;
}

async function fetchSection<T>(
    url: string,
    setState: React.Dispatch<React.SetStateAction<SectionState<T>>>
) {
    setState({ data: null, loading: true, error: false });
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("non-ok");
        const data: T = await res.json();
        setState({ data, loading: false, error: false });
    } catch {
        setState({ data: null, loading: false, error: true });
    }
}

export default function DashboardPage({ onViewAll }: DashboardPageProps) {
    const { t } = useLanguage();

    const [bookStats, setBookStats] = useState<SectionState<BookStats>>(initialState());
    const [lentStats, setLentStats] = useState<SectionState<LentOutStats>>(initialState());
    const [overdueStats, setOverdueStats] = useState<SectionState<OverdueStats>>(initialState());
    const [recentBooks, setRecentBooks] = useState<SectionState<DashboardBook[]>>(initialState());
    const [activity, setActivity] = useState<SectionState<ActivityEntry[]>>(initialState());

    const loadBookStats = useCallback(
        () => fetchSection<BookStats>("/api/dashboard/stats/books", setBookStats), []
    );
    const loadLentStats = useCallback(
        () => fetchSection<LentOutStats>("/api/dashboard/stats/lent-out", setLentStats), []
    );
    const loadOverdueStats = useCallback(
        () => fetchSection<OverdueStats>("/api/dashboard/stats/overdue", setOverdueStats), []
    );
    const loadRecentBooks = useCallback(
        () => fetchSection<DashboardBook[]>("/api/dashboard/recently-added", setRecentBooks), []
    );
    const loadActivity = useCallback(
        () => fetchSection<ActivityEntry[]>("/api/dashboard/recent-activity", setActivity), []
    );

    useEffect(() => {
        loadBookStats();
        loadLentStats();
        loadOverdueStats();
        loadRecentBooks();
        loadActivity();
    }, [loadBookStats, loadLentStats, loadOverdueStats, loadRecentBooks, loadActivity]);

    return (
        <div data-testid="dashboard-page">
            <PageHeader
                title={`${t.dashboard.greeting} ${t.dashboard.greetingName}`}
                subtitle={t.dashboard.greetingSubtitle}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <KpiCard
                    label={t.dashboard.kpiTotalBooks}
                    value={bookStats.data?.totalBooks}
                    sub={bookStats.data ? `${bookStats.data.addedThisMonth} added this month` : t.dashboard.kpiTotalSub}
                    icon={<BookOpen className="h-5 w-5" />}
                    accentColor="var(--accent)"
                    loading={bookStats.loading}
                    error={bookStats.error}
                    onRetry={loadBookStats}
                    errorLabel={t.dashboard.kpiErrorShort}
                    retryLabel={t.common.retry}
                />
                <KpiCard
                    label={t.dashboard.kpiLent}
                    value={lentStats.data?.totalLentOut}
                    sub={lentStats.data ? `Across ${lentStats.data.uniqueLendees} people` : t.dashboard.kpiLentSub}
                    icon={<Bookmark className="h-5 w-5" />}
                    accentColor="var(--warning)"
                    loading={lentStats.loading}
                    error={lentStats.error}
                    onRetry={loadLentStats}
                    errorLabel={t.dashboard.kpiErrorShort}
                    retryLabel={t.common.retry}
                />
                <KpiCard
                    label={t.dashboard.kpiOverdue}
                    value={overdueStats.data?.totalOverdue}
                    sub={t.dashboard.kpiOverdueSub}
                    icon={<AlertCircle className="h-5 w-5" />}
                    accentColor="var(--destructive)"
                    loading={overdueStats.loading}
                    error={overdueStats.error}
                    onRetry={loadOverdueStats}
                    errorLabel={t.dashboard.kpiErrorShort}
                    retryLabel={t.common.retry}
                />
            </div>

            {/* Lower section */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
                {/* Recently Added */}
                <Card>
                    <CardHeader>
                        <span className="text-sm font-semibold text-[var(--foreground)]">
                            {t.dashboard.recentlyAdded}
                        </span>
                        <Button variant="ghost" size="sm" onClick={onViewAll}>
                            {t.dashboard.viewAll}
                        </Button>
                    </CardHeader>

                    {recentBooks.loading && <RecentlyAddedSkeleton />}

                    {recentBooks.error && (
                        <ErrorState
                            heading={t.common.errorHeading}
                            description={t.common.errorDescription}
                            retryLabel={t.common.retry}
                            onRetry={loadRecentBooks}
                            className="py-10"
                        />
                    )}

                    {!recentBooks.loading && !recentBooks.error && recentBooks.data?.length === 0 && (
                        <EmptyState
                            heading={t.dashboard.recentlyAddedEmpty}
                            description={t.dashboard.recentlyAddedEmptyDesc}
                            icon={<BookOpen className="h-6 w-6" />}
                            className="py-10"
                        />
                    )}

                    {!recentBooks.loading && !recentBooks.error && recentBooks.data && recentBooks.data.length > 0 && (
                        <DataTable className="rounded-t-none border-0 shadow-none">
                            <DataTableHead>
                                <tr>
                                    <Th>{t.dashboard.colTitleAuthor}</Th>
                                    <Th>{t.dashboard.colGenre}</Th>
                                    <Th>{t.dashboard.colStatus}</Th>
                                    <Th>{t.dashboard.colRating}</Th>
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {recentBooks.data.map((book) => (
                                    <DataTableRow key={book.id}>
                                        <Td>
                                            <p className="font-medium text-[var(--foreground)] leading-tight">{book.name}</p>
                                            <p className="text-xs text-[var(--muted)] mt-0.5">{book.author}</p>
                                        </Td>
                                        <Td>{book.genre ? <GenreTag genre={book.genre} /> : <span className="text-[var(--muted-foreground)]">—</span>}</Td>
                                        <Td>
                                            {book.status ? (
                                                <StatusBadge
                                                    status={book.status === "LENT_OUT" ? "Lent Out" : "Owned"}
                                                    overdue={false}
                                                />
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
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <span className="text-sm font-semibold text-[var(--foreground)]">
                            {t.dashboard.recentActivity}
                        </span>
                    </CardHeader>

                    {activity.loading && <ActivitySkeleton />}

                    {activity.error && (
                        <ErrorState
                            heading={t.common.errorHeading}
                            description={t.common.errorDescription}
                            retryLabel={t.common.retry}
                            onRetry={loadActivity}
                            className="py-10"
                        />
                    )}

                    {!activity.loading && !activity.error && activity.data?.length === 0 && (
                        <EmptyState
                            heading={t.dashboard.activityEmpty}
                            description={t.dashboard.activityEmptyDesc}
                            icon={<Activity className="h-6 w-6" />}
                            className="py-10"
                        />
                    )}

                    {!activity.loading && !activity.error && activity.data && activity.data.length > 0 && (
                        <ul className="divide-y divide-[var(--border)]">
                            {activity.data.map((item) => (
                                <li key={item.id} className="flex gap-3 px-5 py-3.5 items-start">
                                    <span
                                        className={[
                                            "mt-1.5 h-2 w-2 rounded-full shrink-0",
                                            item.action === "LENT"     ? "bg-[var(--warning)]"  :
                                            item.action === "RETURNED" ? "bg-[var(--success)]"  :
                                                                          "bg-[var(--accent)]",
                                        ].join(" ")}
                                        aria-hidden="true"
                                    />
                                    <div>
                                        <p className="text-sm text-[var(--foreground)] leading-snug">
                                            {formatActivity(item)}
                                        </p>
                                        <p className="text-xs text-[var(--muted)] mt-0.5">
                                            {item.occurredAt ? new Date(item.occurredAt).toLocaleDateString() : "—"}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    );
}

function formatActivity(item: ActivityEntry): string {
    if (item.action === "LENT") return `Lent ${item.bookName ?? "a book"} to ${item.memberName ?? "someone"}`;
    if (item.action === "RETURNED") return `${item.memberName ?? "Someone"} returned ${item.bookName ?? "a book"}`;
    if (item.action === "ADDED") return `Added ${item.bookName ?? "a book"} to collection`;
    if (item.action === "REMOVED") return `Removed ${item.bookName ?? "a book"} from collection`;
    return `Updated ${item.bookName ?? "a book"}`;
}

function KpiCard({
    label, value, sub, icon, accentColor, loading, error, onRetry, errorLabel, retryLabel,
}: {
    label: string;
    value: number | undefined;
    sub: string;
    icon: React.ReactNode;
    accentColor: string;
    loading: boolean;
    error: boolean;
    onRetry: () => void;
    errorLabel: string;
    retryLabel: string;
}) {
    return (
        <Card className={["relative overflow-hidden", error ? "border-[var(--destructive)]/40" : ""].join(" ")}>
            <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: accentColor }} />
            <CardBody className="pt-5">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
                        {loading && (
                            <>
                                <Skeleton className="h-8 w-12 mt-1 mb-1.5" />
                                <Skeleton className="h-3 w-28" />
                            </>
                        )}
                        {error && (
                            <div className="mt-1">
                                <div className="flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 text-[var(--destructive)]" aria-hidden="true" />
                                    <p className="text-xs text-[var(--destructive)]">{errorLabel}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={onRetry} className="mt-1 h-6 px-2 text-[10px]">
                                    {retryLabel}
                                </Button>
                            </div>
                        )}
                        {!loading && !error && (
                            <>
                                <p className="text-3xl font-bold text-[var(--foreground)] mt-1 leading-none">
                                    {value ?? 0}
                                </p>
                                <p className="text-xs text-[var(--muted)] mt-1.5">{sub}</p>
                            </>
                        )}
                    </div>
                    <span className="p-2 rounded-lg bg-stone-100 text-[var(--muted)]">{icon}</span>
                </div>
            </CardBody>
        </Card>
    );
}

function RecentlyAddedSkeleton() {
    return (
        <div className="divide-y divide-[var(--border)]">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1">
                        <Skeleton className="h-3.5 w-40 mb-1.5" />
                        <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-3.5 w-20" />
                </div>
            ))}
        </div>
    );
}

function ActivitySkeleton() {
    return (
        <ul className="divide-y divide-[var(--border)]">
            {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex gap-3 px-5 py-3.5 items-start">
                    <Skeleton className="mt-1.5 h-2 w-2 rounded-full shrink-0" />
                    <div className="flex-1">
                        <Skeleton className="h-3.5 w-full mb-1.5" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </li>
            ))}
        </ul>
    );
}
