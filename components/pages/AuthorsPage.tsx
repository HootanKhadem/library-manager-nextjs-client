"use client";
/**
 * components/pages/AuthorsPage.tsx
 *
 * Author avatar grid + author works table (Borges).
 *
 * i18n: page title, subtitle, column headers, "Change Author" button, and the
 * "books in collection" count label all come from t.authors.
 * The subtitle uses interpolate() to inject the dynamic author count.
 * The "books in collection" card label uses interpolate() for the count.
 */

import {Author, Book} from "@/lib/types";
import Badge from "@/components/Badge";
import StarRating from "@/components/StarRating";
import GenreTag from "@/components/GenreTag";
import {interpolate, useLanguage} from "@/lib/i18n/context";

interface AuthorsPageProps {
    authors: Author[];
    borgesWorks: Book[];
}

export default function AuthorsPage({authors, borgesWorks}: AuthorsPageProps) {
    const {t} = useLanguage();

    return (
        <div data-testid="authors-page">
            <div
                className="flex items-end justify-between mb-7 pb-5 border-b border-[rgba(61,28,2,0.1)] flex-wrap gap-4">
                <div>
                    <h2 className="font-playfair text-4xl font-black text-[#3d1c02] leading-none">{t.authors.title}</h2>
                    <p className="text-sm text-[#6b4c2a] mt-1.5 italic">
                        {interpolate(t.authors.subtitle, {count: String(authors.length)})}
                    </p>
                </div>
            </div>

            {/* Author card grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5 mb-8">
                {authors.map((author) => (
                    <AuthorCard key={author.id} author={author}/>
                ))}
            </div>

            {/* Complete works panel (Borges) */}
            <div
                className="bg-white border border-[rgba(61,28,2,0.1)] rounded-md shadow-[0_2px_12px_rgba(61,28,2,0.12)] overflow-hidden mb-6">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[rgba(61,28,2,0.08)]">
                    <div className="flex-1 font-playfair text-[1.05rem] font-bold text-[#3d1c02]">
                        {t.authors.completeWorksTitle}
                    </div>
                    <button
                        className="font-mono text-[0.65rem] tracking-[0.1em] uppercase text-[#c4742a] border border-[rgba(196,116,42,0.3)] rounded-sm px-2.5 py-1 hover:bg-[rgba(196,116,42,0.08)] transition-colors bg-transparent">
                        {t.authors.changeAuthor}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[0.82rem]">
                        <thead>
                        <tr className="bg-[#f0ead8] border-b-2 border-[rgba(61,28,2,0.12)]">
                            <Th>{t.authors.colTitle}</Th>
                            <Th>{t.authors.colYear}</Th>
                            <Th>{t.authors.colGenre}</Th>
                            <Th>{t.authors.colStatus}</Th>
                            <Th>{t.authors.colRating}</Th>
                            <Th>{t.authors.colNotes}</Th>
                        </tr>
                        </thead>
                        <tbody>
                        {borgesWorks.map((book) => (
                            <tr key={book.id}
                                className="hover:bg-[rgba(245,240,232,0.7)] transition-colors border-b border-[rgba(61,28,2,0.06)] last:border-b-0">
                                <td className="px-4 py-2.5 align-middle">
                                    <div
                                        className="font-playfair font-bold text-[#3d1c02] text-[0.88rem]">{book.title}</div>
                                </td>
                                <td className="px-4 py-2.5 align-middle font-mono text-[0.75rem] text-[#3d2b1a]">{book.year}</td>
                                <td className="px-4 py-2.5 align-middle"><GenreTag genre={book.genre}/></td>
                                <td className="px-4 py-2.5 align-middle"><Badge status={book.status}/></td>
                                <td className="px-4 py-2.5 align-middle">
                                    {book.rating ? <StarRating rating={book.rating}/> :
                                        <span className="text-[#6b4c2a]">{t.common.dash}</span>}
                                </td>
                                <td className="px-4 py-2.5 align-middle italic text-[0.75rem] text-[#6b4c2a]">{book.notes ?? ""}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function AuthorCard({author}: { author: Author }) {
    const {t} = useLanguage();
    return (
        <div
            className="bg-white border border-[rgba(61,28,2,0.1)] rounded-md p-6 shadow-[0_2px_12px_rgba(61,28,2,0.12)] text-center cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(61,28,2,0.12)] transition-all">
            <div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5c2d0a] to-[#c4742a] flex items-center justify-center font-playfair text-2xl font-black text-[#f5f0e8] mx-auto mb-3.5 border-[3px] border-[#d4ae50] shadow-[0_4px_12px_rgba(61,28,2,0.2)]">
                {author.initials}
            </div>
            <div className="font-playfair text-[1rem] font-bold text-[#3d1c02] mb-1">{author.name}</div>
            {/* Use interpolate() to place the count inside the translated sentence */}
            <div className="font-mono text-[0.62rem] text-[#6b4c2a] tracking-[0.1em] uppercase">
                {interpolate(t.authors.booksInCollection, {count: String(author.bookCount)})}
            </div>
            <div className="mt-2.5">
                <GenreTag genre={author.genre}/>
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
