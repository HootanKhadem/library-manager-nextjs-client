"use client";
/**
 * components/BookDetailModal.tsx
 *
 * Full-detail modal for a single book.
 *
 * i18n: every meta label, section heading, button text and placeholder comes
 * from t.bookDetail. The modal also uses t.common for the dash fallback.
 * Keyboard Escape closes the modal — this works regardless of language/direction.
 */

import {useEffect} from "react";
import {Book} from "@/lib/types";
import Badge from "@/components/Badge";
import StarRating from "@/components/StarRating";
import GenreTag from "@/components/GenreTag";
import {useLanguage} from "@/lib/i18n/context";

interface BookDetailModalProps {
    book: Book | null;
    onClose: () => void;
}

export default function BookDetailModal({book, onClose}: BookDetailModalProps) {
    const {t} = useLanguage();

    // Close on Escape key — language-agnostic
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    if (!book) return null;

    return (
        <div
            className="fixed inset-0 bg-[rgba(26,15,0,0.6)] z-[200] flex items-center justify-center backdrop-blur-sm animate-fadeIn"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            data-testid="book-detail-modal"
        >
            <div
                className="bg-[#f5f0e8] border border-[rgba(61,28,2,0.15)] rounded-lg w-[min(660px,95vw)] max-h-[88vh] overflow-y-auto shadow-[0_24px_80px_rgba(0,0,0,0.4)] animate-slideUp">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#5c2d0a] to-[#3d1c02] px-8 py-7 relative">
                    <h2 id="modal-title"
                        className="font-playfair text-2xl font-bold italic text-[#f5f0e8] leading-tight">
                        {book.title}
                    </h2>
                    <p className="text-[rgba(245,240,232,0.65)] text-sm mt-1">
                        {book.author} · {book.year}
                    </p>
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-[rgba(245,240,232,0.15)] border border-[rgba(245,240,232,0.2)] text-[#f5f0e8] hover:bg-[rgba(245,240,232,0.25)] transition-colors"
                        aria-label={t.common.close}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 py-7">
                    {/* Meta grid — labels come from t.bookDetail */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <MetaItem label={t.bookDetail.labelStatus}>
                            <Badge status={book.status}/>
                        </MetaItem>
                        <MetaItem label={t.bookDetail.labelGenre}>
                            <GenreTag genre={book.genre}/>
                        </MetaItem>
                        <MetaItem label={t.bookDetail.labelRating}>
                            {book.rating ? <StarRating rating={book.rating}/> :
                                <span className="text-sm text-[#6b4c2a]">{t.common.dash}</span>}
                        </MetaItem>
                        {book.publisher && (
                            <MetaItem label={t.bookDetail.labelPublisher}>
                                <span className="text-sm font-bold text-[#3d2b1a]">{book.publisher}</span>
                            </MetaItem>
                        )}
                        {book.isbn && (
                            <MetaItem label={t.bookDetail.labelIsbn}>
                                <span className="font-mono text-[0.75rem] font-bold text-[#3d2b1a]">{book.isbn}</span>
                            </MetaItem>
                        )}
                        {book.pages && (
                            <MetaItem label={t.bookDetail.labelPages}>
                                <span className="text-sm font-bold text-[#3d2b1a]">{book.pages}</span>
                            </MetaItem>
                        )}
                    </div>

                    <div className="h-px bg-[rgba(61,28,2,0.1)] my-5"/>

                    {book.description && (
                        <>
                            <SectionLabel>{t.bookDetail.labelDescription}</SectionLabel>
                            <p className="text-sm text-[#3d2b1a] leading-[1.8] italic border-s-[3px] border-[#c4742a] ps-4 mb-5">
                                {book.description}
                            </p>
                        </>
                    )}

                    {/* Notes textarea — placeholder is translated */}
                    <SectionLabel>{t.bookDetail.labelNotes}</SectionLabel>
                    <textarea
                        defaultValue={book.notes ?? ""}
                        placeholder={t.bookDetail.notesPlaceholder}
                        className="w-full bg-[#ede5d5] border border-[rgba(61,28,2,0.15)] rounded px-3 py-3 font-serif text-[0.82rem] text-[#1a0f00] resize-y min-h-[100px] outline-none focus:border-[#c4742a] focus:shadow-[0_0_0_3px_rgba(196,116,42,0.1)] leading-[1.7] transition-all"
                        aria-label={t.bookDetail.labelNotes}
                    />

                    {book.lendingHistory && book.lendingHistory.length > 0 && (
                        <>
                            <div className="h-4"/>
                            <SectionLabel>{t.bookDetail.labelLendingHistory}</SectionLabel>
                            <table className="w-full text-sm mt-2 border-collapse">
                                <thead>
                                <tr className="bg-[#f0ead8] border-b-2 border-[rgba(61,28,2,0.12)]">
                                    <Th>{t.bookDetail.colLentTo}</Th>
                                    <Th>{t.bookDetail.colDateOut}</Th>
                                    <Th>{t.bookDetail.colDateReturned}</Th>
                                    <Th>{t.bookDetail.colCondition}</Th>
                                </tr>
                                </thead>
                                <tbody>
                                {book.lendingHistory.map((record, i) => (
                                    <tr key={i}>
                                        <Td>{record.lentTo}</Td>
                                        <Td>{record.dateOut}</Td>
                                        <Td>{record.dateReturned ?? t.common.dash}</Td>
                                        <Td>{record.condition ?? t.common.dash}</Td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-[rgba(61,28,2,0.1)] flex gap-2.5 justify-end">
                    <button
                        className="px-5 py-2 rounded font-mono text-[0.7rem] tracking-[0.08em] uppercase cursor-pointer bg-[rgba(160,48,32,0.1)] text-[#a03020] border border-[rgba(160,48,32,0.25)] hover:bg-[rgba(160,48,32,0.18)] transition-colors">
                        {t.bookDetail.btnDelete}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded font-mono text-[0.7rem] tracking-[0.08em] uppercase cursor-pointer bg-transparent text-[#6b4c2a] border border-[rgba(61,28,2,0.18)] hover:bg-[#ede5d5] transition-colors"
                    >
                        {t.bookDetail.btnClose}
                    </button>
                    <button
                        className="px-5 py-2 rounded font-mono text-[0.7rem] tracking-[0.08em] uppercase cursor-pointer bg-[#3d1c02] text-[#f5f0e8] hover:bg-[#5c2d0a] hover:shadow-[0_4px_14px_rgba(61,28,2,0.25)] hover:-translate-y-px transition-all">
                        {t.bookDetail.btnLend}
                    </button>
                </div>
            </div>
        </div>
    );
}

function MetaItem({label, children}: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="font-mono text-[0.58rem] tracking-[0.18em] uppercase text-[#6b4c2a] mb-1">{label}</div>
            <div>{children}</div>
        </div>
    );
}

function SectionLabel({children}: { children: React.ReactNode }) {
    return (
        <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#6b4c2a] mb-2.5">{children}</div>
    );
}

function Th({children}: { children: React.ReactNode }) {
    return (
        <th className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-[#6b4c2a] px-4 py-2.5 text-left font-normal">
            {children}
        </th>
    );
}

function Td({children}: { children: React.ReactNode }) {
    return (
        <td className="px-4 py-2.5 border-b border-[rgba(61,28,2,0.06)] text-[#3d2b1a] text-[0.83rem] align-middle">
            {children}
        </td>
    );
}
