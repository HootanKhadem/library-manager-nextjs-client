"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen } from "lucide-react";
import { ActiveLending } from "@/src/lib/types";
import { interpolate, useLanguage } from "@/src/lib/i18n/context";
import { PageHeader } from "@/src/components/ui/Topbar";
import { Card, CardBody, CardFooter } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Avatar } from "@/src/components/ui/Avatar";

export default function LentPage() {
    const { t } = useLanguage();
    const [showOverdueOnly, setShowOverdueOnly] = useState(false);
    const [lendings, setLendings] = useState<ActiveLending[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch("/api/lending/active");
            if (!res.ok) throw new Error("non-ok");
            const data: ActiveLending[] = await res.json();
            setLendings(data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const displayed = showOverdueOnly
        ? lendings.filter((l) => l.status === "OVERDUE")
        : lendings;

    return (
        <div data-testid="lent-page">
            <PageHeader
                title={t.lent.title}
                subtitle={interpolate(t.lent.subtitle, { count: String(lendings.length) })}
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

            {loading && <LentCardsSkeleton />}

            {error && (
                <ErrorState
                    heading={t.common.errorHeading}
                    description={t.common.errorDescription}
                    retryLabel={t.common.retry}
                    onRetry={load}
                />
            )}

            {!loading && !error && displayed.length === 0 && (
                <EmptyState
                    heading={showOverdueOnly ? t.lent.emptyOverdue : t.lent.emptyState}
                    icon={<BookOpen className="h-6 w-6" />}
                />
            )}

            {!loading && !error && displayed.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayed.map((lending) => (
                        <LendCard key={lending.id} lending={lending} onReturned={load} />
                    ))}
                </div>
            )}
        </div>
    );
}

function LendCard({ lending, onReturned }: { lending: ActiveLending; onReturned: () => void }) {
    const { t } = useLanguage();
    const isOverdue = lending.status === "OVERDUE";
    const [returning, setReturning] = useState(false);
    const [returnError, setReturnError] = useState(false);

    async function handleReturn() {
        setReturning(true);
        setReturnError(false);
        try {
            const res = await fetch(`/api/lending/${lending.id}/return`, { method: "PUT" });
            if (res.ok) {
                onReturned();
            } else {
                setReturnError(true);
            }
        } catch {
            setReturnError(true);
        } finally {
            setReturning(false);
        }
    }

    return (
        <Card className={isOverdue ? "border-[var(--destructive)]/40" : ""}>
            <CardBody className="pb-3">
                {isOverdue && (
                    <Badge variant="danger" className="mb-3">
                        {t.common.overdue}
                    </Badge>
                )}
                <p className="font-semibold text-sm text-[var(--foreground)] leading-tight">
                    {`Book #${lending.bookId}`}
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{t.common.dash}</p>

                <div className="mt-4 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                        <Avatar name="?" size="sm" />
                        <div>
                            <p className="text-xs font-medium text-[var(--foreground)]">{t.common.dash}</p>
                            <p className="text-[10px] text-[var(--muted)]">{t.lent.labelLentTo}</p>
                        </div>
                    </div>
                    <InfoRow label={t.lent.labelDateLent} value={lending.lentDate} />
                    <InfoRow
                        label={t.lent.labelDueBack}
                        value={lending.expectedReturnDate ?? t.common.dash}
                        danger={isOverdue}
                    />
                </div>

                {returnError && (
                    <p role="alert" className="mt-3 text-xs text-[var(--destructive)]">{t.common.errorHeading}</p>
                )}
            </CardBody>
            <CardFooter className="gap-2">
                <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={handleReturn} disabled={returning}>
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

function LentCardsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-[var(--border)] p-5">
                    <Skeleton className="h-4 w-3/4 mb-1.5" />
                    <Skeleton className="h-3 w-1/2 mb-4" />
                    <div className="space-y-2.5">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Skeleton className="h-7 flex-1 rounded-lg" />
                        <Skeleton className="h-7 flex-1 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}
