"use client";
/**
 * components/pages/LentPage.tsx
 *
 * Cards showing all currently lent books with overdue highlighting.
 *
 * i18n: labels for "Lent To", "Date Lent", "Due Back", button texts and the
 * overdue warning string all come from t.lent. The overdue warning uses
 * interpolate() to inject the dynamic due-back date.
 * The subtitle uses interpolate() to inject the dynamic lent count.
 */

import {useState} from "react";
import {Book} from "@/lib/types";
import {interpolate, useLanguage} from "@/lib/i18n/context";

interface LentPageProps {
    lentBooks: Book[];
}

export default function LentPage({lentBooks}: LentPageProps) {
    const {t} = useLanguage();
    const [showOverdueOnly, setShowOverdueOnly] = useState(false);
    const displayed = showOverdueOnly ? lentBooks.filter((b) => b.overdue) : lentBooks;

    return (
        <div data-testid="lent-page">
            <div
                className="flex items-end justify-between mb-7 pb-5 border-b border-[rgba(61,28,2,0.1)] flex-wrap gap-4">
                <div>
                    <h2 className="font-playfair text-4xl font-black text-[#3d1c02] leading-none">{t.lent.title}</h2>
                    <p className="text-sm text-[#6b4c2a] mt-1.5 italic">
                        {interpolate(t.lent.subtitle, {count: String(lentBooks.length)})}
                    </p>
                </div>
                <div className="flex gap-2">
                    <FilterBtn active={!showOverdueOnly} onClick={() => setShowOverdueOnly(false)}>
                        {t.lent.filterAll}
                    </FilterBtn>
                    <FilterBtn active={showOverdueOnly} onClick={() => setShowOverdueOnly(true)}>
                        {t.lent.filterOverdue}
                    </FilterBtn>
                </div>
            </div>

            {displayed.length === 0 ? (
                <div className="text-center py-12 text-[#6b4c2a]">
                    <div className="text-5xl mb-4 opacity-40">📚</div>
                    <p className="italic text-sm">{t.lent.emptyState}</p>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 mt-6">
                    {displayed.map((book) => (
                        <LendCard key={book.id} book={book}/>
                    ))}
                </div>
            )}
        </div>
    );
}

function LendCard({book}: { book: Book }) {
    const {t} = useLanguage();
    const isOverdue = book.overdue === true;

    return (
        <div
            className="bg-white border border-[rgba(61,28,2,0.1)] rounded-md shadow-[0_2px_12px_rgba(61,28,2,0.12)] overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(61,28,2,0.12)] transition-all">
            <div
                className={`px-5 py-5 relative ${
                    isOverdue
                        ? "bg-gradient-to-br from-[#7a1a0a] to-[#4d1010]"
                        : "bg-gradient-to-br from-[#5c2d0a] to-[#3d1c02]"
                }`}
            >
                <div className="absolute bottom-3 right-4 text-4xl opacity-20">📖</div>
                <div className="font-playfair text-[1rem] font-bold text-[#f5f0e8] leading-tight">{book.title}</div>
                <div className="italic text-[rgba(245,240,232,0.6)] text-[0.75rem] mt-1">{book.author}</div>
            </div>
            <div className="px-5 py-4">
                <LendRow label={t.lent.labelLentTo} value={book.lentTo ?? t.common.dash}/>
                <LendRow label={t.lent.labelDateLent} value={book.dateLent ?? t.common.dash}/>
                <LendRow
                    label={t.lent.labelDueBack}
                    value={
                        isOverdue
                            ? interpolate(t.lent.overdueWarning, {date: book.dueBack ?? t.common.dash})
                            : (book.dueBack ?? t.common.dash)
                    }
                    overdue={isOverdue}
                />
            </div>
            <div className="border-t border-[rgba(61,28,2,0.07)] px-5 py-2.5 flex gap-2">
                <button
                    className="flex-1 py-1.5 px-2.5 rounded-sm font-mono text-[0.65rem] tracking-[0.08em] uppercase bg-[#3d1c02] text-[#f5f0e8] hover:bg-[#5c2d0a] transition-colors">
                    {t.lent.markReturned}
                </button>
                <button
                    className="flex-1 py-1.5 px-2.5 rounded-sm font-mono text-[0.65rem] tracking-[0.08em] uppercase bg-transparent text-[#6b4c2a] border border-[rgba(61,28,2,0.15)] hover:bg-[#ede5d5] transition-colors">
                    {t.lent.remind}
                </button>
            </div>
        </div>
    );
}

function LendRow({label, value, overdue}: { label: string; value: string; overdue?: boolean }) {
    return (
        <div className="flex justify-between mb-2 text-[0.78rem]">
            <span className="font-mono text-[#6b4c2a] text-[0.65rem] tracking-[0.1em] uppercase">{label}</span>
            <span className={`font-bold ${overdue ? "text-[#a03020]" : "text-[#3d2b1a]"}`}>{value}</span>
        </div>
    );
}

function FilterBtn({active, onClick, children}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`border rounded-sm px-3.5 py-1.5 font-mono text-[0.62rem] tracking-[0.1em] uppercase transition-all ${
                active
                    ? "bg-[#3d1c02] text-[#f5f0e8] border-[#3d1c02]"
                    : "bg-transparent text-[#6b4c2a] border-[rgba(61,28,2,0.18)] hover:bg-[#3d1c02] hover:text-[#f5f0e8] hover:border-[#3d1c02]"
            }`}
        >
            {children}
        </button>
    );
}
