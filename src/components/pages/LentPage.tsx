"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Book } from "@/src/lib/types";
import { interpolate, useLanguage } from "@/src/lib/i18n/context";
import { PageHeader } from "@/src/components/ui/Topbar";
import { Card, CardBody, CardFooter } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Avatar } from "@/src/components/ui/Avatar";

interface LentPageProps {
    lentBooks: Book[];
}

export default function LentPage({ lentBooks }: LentPageProps) {
    const { t } = useLanguage();
    const [showOverdueOnly, setShowOverdueOnly] = useState(false);
    const displayed = showOverdueOnly ? lentBooks.filter((b) => b.overdue) : lentBooks;

    return (
        <div data-testid="lent-page">
            <PageHeader
                title={t.lent.title}
                subtitle={interpolate(t.lent.subtitle, { count: String(lentBooks.length) })}
                action={
                    <div className="flex items-center gap-2">
                        {[
                            { active: !showOverdueOnly, label: t.lent.filterAll, onClick: () => setShowOverdueOnly(false) },
                            { active: showOverdueOnly,  label: t.lent.filterOverdue, onClick: () => setShowOverdueOnly(true) },
                        ].map(({ active, label, onClick }) => (
                            <button
                                key={label}
                                onClick={onClick}
                                className={[
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                    active
                                        ? "bg-[var(--accent)] text-white"
                                        : "bg-transparent text-[var(--muted)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]",
                                ].join(" ")}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                }
            />

            {displayed.length === 0 ? (
                <EmptyState
                    heading={t.lent.emptyState}
                    icon={<BookOpen className="h-6 w-6" />}
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayed.map((book) => (
                        <LendCard key={book.id} book={book} />
                    ))}
                </div>
            )}
        </div>
    );
}

function LendCard({ book }: { book: Book }) {
    const { t } = useLanguage();
    const isOverdue = book.overdue === true;

    return (
        <Card className={isOverdue ? "border-[var(--destructive)]/40" : ""}>
            <CardBody className="pb-3">
                {isOverdue && (
                    <Badge variant="danger" className="mb-3">
                        {t.common.overdue}
                    </Badge>
                )}
                <p className="font-semibold text-sm text-[var(--foreground)] leading-tight">{book.title}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{book.author}</p>

                <div className="mt-4 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                        <Avatar name={book.lentTo ?? "?"} size="sm" />
                        <div>
                            <p className="text-xs font-medium text-[var(--foreground)]">{book.lentTo ?? t.common.dash}</p>
                            <p className="text-[10px] text-[var(--muted)]">{t.lent.labelLentTo}</p>
                        </div>
                    </div>
                    <InfoRow label={t.lent.labelDateLent} value={book.dateLent ?? t.common.dash} />
                    <InfoRow
                        label={t.lent.labelDueBack}
                        value={
                            isOverdue
                                ? interpolate(t.lent.overdueWarning, { date: book.dueBack ?? t.common.dash })
                                : (book.dueBack ?? t.common.dash)
                        }
                        danger={isOverdue}
                    />
                </div>
            </CardBody>
            <CardFooter className="gap-2">
                <Button variant="primary" size="sm" className="flex-1 justify-center">
                    {t.lent.markReturned}
                </Button>
                <Button variant="secondary" size="sm" className="flex-1 justify-center">
                    {t.lent.remind}
                </Button>
            </CardFooter>
        </Card>
    );
}

function InfoRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-[var(--muted)]">{label}</span>
            <span className={["text-xs font-medium", danger ? "text-[var(--destructive)]" : "text-[var(--foreground)]"].join(" ")}>
                {value}
            </span>
        </div>
    );
}
