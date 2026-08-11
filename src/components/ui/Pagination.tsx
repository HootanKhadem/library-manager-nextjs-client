"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    prevLabel: string;
    nextLabel: string;
}

function pageWindow(page: number, totalPages: number): (number | "ellipsis")[] {
    const spread = 2;
    const pages = new Set<number>([1, totalPages]);
    for (let p = page - spread; p <= page + spread; p++) {
        if (p >= 1 && p <= totalPages) pages.add(p);
    }
    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result: (number | "ellipsis")[] = [];
    let prev = 0;
    for (const p of sorted) {
        if (prev && p - prev > 1) result.push("ellipsis");
        result.push(p);
        prev = p;
    }
    return result;
}

export default function Pagination({ page, totalPages, onPageChange, prevLabel, nextLabel }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-1 mt-4">
            <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label={prevLabel}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--border-strong)] hover:text-[var(--foreground)] transition-colors"
            >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            {pageWindow(page, totalPages).map((entry, i) =>
                entry === "ellipsis" ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-[var(--muted)]">…</span>
                ) : (
                    <button
                        key={entry}
                        type="button"
                        onClick={() => onPageChange(entry)}
                        aria-current={entry === page ? "page" : undefined}
                        className={[
                            "h-8 min-w-8 px-2 rounded-lg text-xs font-medium transition-colors",
                            entry === page
                                ? "bg-[var(--accent)] text-white"
                                : "text-[var(--muted)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]",
                        ].join(" ")}
                    >
                        {entry}
                    </button>
                )
            )}

            <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label={nextLabel}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--border-strong)] hover:text-[var(--foreground)] transition-colors"
            >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
        </nav>
    );
}
