"use client";
/**
 * components/pages/BooksPage.tsx
 *
 * Full book catalogue table with status filter buttons.
 *
 * i18n: column headers, filter labels, page title and subtitle all use t.books.
 * The filter buttons compare against the canonical BookStatus enum values
 * (English strings like "Owned", "Lent Out") which are internal identifiers —
 * only the displayed label is translated, the filter logic uses the raw value.
 * The subtitle uses interpolate() to inject the dynamic book count.
 */

import {useState} from "react";
import {Book, BookStatus} from "@/src/lib/types";
import Badge from "@/src/components/Badge";
import StarRating from "@/src/components/StarRating";
import GenreTag from "@/src/components/GenreTag";
import {interpolate, useLanguage} from "@/src/lib/i18n/context";

interface BooksPageProps {
    books: Book[];
    onBookClick: (book: Book) => void;
    onAddBook: () => void;
}

export default function BooksPage({books, onBookClick, onAddBook}: BooksPageProps) {
    const {t} = useLanguage();
    const [activeFilter, setActiveFilter] = useState<BookStatus | "All">("All");
    const filtered = activeFilter === "All" ? books : books.filter((b) => b.status === activeFilter);

    // Filter definitions: each has a value (used for filtering logic) and a
    // translated label (shown to the user). Adding a new filter means adding
    // an entry here and a corresponding translation key.
    const FILTERS: { value: BookStatus | "All"; label: string }[] = [
        {value: "All", label: t.books.filterAll},
        {value: "Owned", label: t.books.filterOwned},
        {value: "Lent Out", label: t.books.filterLentOut},
        {value: "Wishlist", label: t.books.filterWishlist},
    ];

    return (
        <div data-testid="books-page">
            <div
                className="flex items-end justify-between mb-7 pb-5 border-b border-[rgba(61,28,2,0.1)] flex-wrap gap-4">
                <div>
                    <h2 className="font-playfair text-4xl font-black text-[#3d1c02] leading-none">{t.books.title}</h2>
                    <p className="text-sm text-[#6b4c2a] mt-1.5 italic">
                        {interpolate(t.books.subtitle, {count: String(books.length)})}
                    </p>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                    {FILTERS.map(({value, label}) => (
                        <button
                            key={value}
                            onClick={() => setActiveFilter(value)}
                            className={`border rounded-sm px-3.5 py-1.5 font-mono text-[0.62rem] tracking-[0.1em] uppercase transition-all ${
                                activeFilter === value
                                    ? "bg-[#3d1c02] text-[#f5f0e8] border-[#3d1c02]"
                                    : "bg-transparent text-[#6b4c2a] border-[rgba(61,28,2,0.18)] hover:bg-[#3d1c02] hover:text-[#f5f0e8] hover:border-[#3d1c02]"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                    <button
                        onClick={onAddBook}
                        className="bg-transparent text-[#6b4c2a] border border-[rgba(61,28,2,0.18)] rounded-sm px-3.5 py-1.5 font-mono text-[0.62rem] tracking-[0.1em] uppercase hover:bg-[#3d1c02] hover:text-[#f5f0e8] hover:border-[#3d1c02] transition-all"
                    >
                        ＋ {t.common.add}
                    </button>
                </div>
            </div>

            <div
                className="bg-white border border-[rgba(61,28,2,0.1)] rounded-md shadow-[0_2px_12px_rgba(61,28,2,0.12)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[0.82rem]">
                        <thead>
                        <tr className="bg-[#f0ead8] border-b-2 border-[rgba(61,28,2,0.12)]">
                            <Th>{t.books.colNumber}</Th>
                            <Th>{t.books.colTitle}</Th>
                            <Th>{t.books.colAuthor}</Th>
                            <Th>{t.books.colYear}</Th>
                            <Th>{t.books.colGenre}</Th>
                            <Th>{t.books.colStatus}</Th>
                            <Th>{t.books.colLentTo}</Th>
                            <Th>{t.books.colRating}</Th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((book, i) => (
                            <tr
                                key={book.id}
                                onClick={() => onBookClick(book)}
                                className="hover:bg-[rgba(245,240,232,0.7)] cursor-pointer transition-colors border-b border-[rgba(61,28,2,0.06)] last:border-b-0"
                            >
                                <td className="px-4 py-2.5 text-[#6b4c2a] font-mono text-[0.7rem] align-middle">
                                    {String(i + 1).padStart(3, "0")}
                                </td>
                                <td className="px-4 py-2.5 align-middle">
                                    <div
                                        className="font-playfair font-bold text-[#3d1c02] text-[0.88rem]">{book.title}</div>
                                </td>
                                <td className="px-4 py-2.5 align-middle italic text-[#6b4c2a] text-[0.78rem]">{book.author}</td>
                                <td className="px-4 py-2.5 align-middle font-mono text-[0.75rem] text-[#3d2b1a]">{book.year}</td>
                                <td className="px-4 py-2.5 align-middle"><GenreTag genre={book.genre}/></td>
                                <td className="px-4 py-2.5 align-middle"><Badge status={book.status}/></td>
                                <td className="px-4 py-2.5 align-middle">
                                    {book.lentTo ? (
                                        <span
                                            className={`font-bold text-[0.8rem] ${book.overdue ? "text-[#a03020]" : "text-[#3d2b1a]"}`}>
                        {book.lentTo}
                                            {book.overdue && (
                                                <span className="text-[0.65rem] ms-1">({t.common.overdue})</span>
                                            )}
                      </span>
                                    ) : (
                                        <span className="text-[#6b4c2a]">{t.common.dash}</span>
                                    )}
                                </td>
                                <td className="px-4 py-2.5 align-middle">
                                    {book.rating ? <StarRating rating={book.rating}/> :
                                        <span className="text-[#6b4c2a]">{t.common.dash}</span>}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function Th({children}: { children: React.ReactNode }) {
    return (
        <th className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-[#6b4c2a] px-4 py-2.5 text-left font-normal whitespace-nowrap">
            {children}
        </th>
    );
}
