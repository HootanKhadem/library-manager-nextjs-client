"use client";

import { BookOpen, Bookmark, AlertCircle } from "lucide-react";
import { Book } from "@/src/lib/types";
import { ACTIVITY_ITEMS, getLentBooks, getOverdueBooks } from "@/src/lib/data";
import { useLanguage } from "@/src/lib/i18n/context";
import { Card, CardHeader, CardBody } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { DataTable, DataTableHead, DataTableBody, DataTableRow, Th, Td } from "@/src/components/ui/DataTable";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { StarRating } from "@/src/components/ui/StarRating";
import { GenreTag } from "@/src/components/ui/GenreTag";
import { PageHeader } from "@/src/components/ui/Topbar";

interface DashboardPageProps {
    books: Book[];
    onBookClick: (book: Book) => void;
    onViewAll: () => void;
}

export default function DashboardPage({ books, onBookClick, onViewAll }: DashboardPageProps) {
    const { t } = useLanguage();
    const lentCount = getLentBooks().length;
    const overdueCount = getOverdueBooks().length;
    const recentBooks = books.slice(0, 5);

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
                    value={books.length}
                    sub={t.dashboard.kpiTotalSub}
                    icon={<BookOpen className="h-5 w-5" />}
                    accentColor="var(--accent)"
                />
                <KpiCard
                    label={t.dashboard.kpiLent}
                    value={lentCount}
                    sub={t.dashboard.kpiLentSub}
                    icon={<Bookmark className="h-5 w-5" />}
                    accentColor="var(--warning)"
                />
                <KpiCard
                    label={t.dashboard.kpiOverdue}
                    value={overdueCount}
                    sub={t.dashboard.kpiOverdueSub}
                    icon={<AlertCircle className="h-5 w-5" />}
                    accentColor="var(--destructive)"
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
                    {recentBooks.length === 0 ? (
                        <EmptyState
                            heading={t.common.noResults}
                            icon={<BookOpen className="h-6 w-6" />}
                            className="py-10"
                        />
                    ) : (
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
                                {recentBooks.map((book) => (
                                    <DataTableRow
                                        key={book.id}
                                        onClick={() => onBookClick(book)}
                                        className="cursor-pointer"
                                    >
                                        <Td>
                                            <p className="font-medium text-[var(--foreground)] leading-tight">{book.title}</p>
                                            <p className="text-xs text-[var(--muted)] mt-0.5">{book.author}</p>
                                        </Td>
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

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <span className="text-sm font-semibold text-[var(--foreground)]">
                            {t.dashboard.recentActivity}
                        </span>
                    </CardHeader>
                    <ul className="divide-y divide-[var(--border)]">
                        {ACTIVITY_ITEMS.map((item) => (
                            <li key={item.id} className="flex gap-3 px-5 py-3.5 items-start">
                                <span
                                    className={[
                                        "mt-1.5 h-2 w-2 rounded-full shrink-0",
                                        item.type === "lent"     ? "bg-[var(--warning)]"     :
                                        item.type === "returned" ? "bg-[var(--success)]"     :
                                                                   "bg-[var(--accent)]",
                                    ].join(" ")}
                                    aria-hidden="true"
                                />
                                <div>
                                    <p
                                        className="text-sm text-[var(--foreground)] leading-snug"
                                        dangerouslySetInnerHTML={{ __html: item.text }}
                                    />
                                    <p className="text-xs text-[var(--muted)] mt-0.5">{item.time}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
}

function KpiCard({
    label, value, sub, icon, accentColor,
}: {
    label: string; value: number; sub: string; icon: React.ReactNode; accentColor: string;
}) {
    return (
        <Card className="relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: accentColor }} />
            <CardBody className="pt-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
                        <p className="text-3xl font-bold text-[var(--foreground)] mt-1 leading-none">{value}</p>
                        <p className="text-xs text-[var(--muted)] mt-1.5">{sub}</p>
                    </div>
                    <span className="p-2 rounded-lg bg-stone-100 text-[var(--muted)]">{icon}</span>
                </div>
            </CardBody>
        </Card>
    );
}
