"use client";
/**
 * components/pages/DashboardPage.tsx
 *
 * Dashboard: KPI cards, recently-added books table, recent activity list.
 *
 * i18n: all labels come from t.dashboard. Activity items have their own
 * pre-rendered HTML text stored in data.ts for simplicity; in a real app
 * you would store structured data and use interpolate() to build the sentence
 * in the current language.
 */

import {Book} from "@/src/lib/types";
import {ACTIVITY_ITEMS, getLentBooks, getOverdueBooks} from "@/src/lib/data";
import Badge from "@/src/components/Badge";
import StarRating from "@/src/components/StarRating";
import GenreTag from "@/src/components/GenreTag";
import {useLanguage} from "@/src/lib/i18n/context";

interface DashboardPageProps {
    books: Book[];
    onBookClick: (book: Book) => void;
    onViewAll: () => void;
}

export default function DashboardPage({books, onBookClick, onViewAll}: DashboardPageProps) {
    const {t} = useLanguage();
    const lentCount = getLentBooks().length;
    const overdueCount = getOverdueBooks().length;
    const recentBooks = books.slice(0, 5);

    return (
        <div data-testid="dashboard-page">
            {/* Page header */}
            <div className="flex items-end justify-between mb-7 pb-5 border-b border-[rgba(61,28,2,0.1)]">
                <div>
                    <h2 className="font-playfair text-4xl font-black text-[#3d1c02] leading-none">
                        {t.dashboard.greeting}<br/>
                        <em>{t.dashboard.greetingName}</em>
                    </h2>
                    <p className="text-sm text-[#6b4c2a] mt-1.5 italic">
                        {t.dashboard.greetingSubtitle}
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-5 mb-8">
                <KpiCard
                    label={t.dashboard.kpiTotalBooks}
                    value={books.length}
                    sub={t.dashboard.kpiTotalSub}
                    icon="📚"
                    colorClass="from-[#3d1c02] to-[#c4742a]"
                />
                <KpiCard
                    label={t.dashboard.kpiLent}
                    value={lentCount}
                    sub={t.dashboard.kpiLentSub}
                    icon="🔖"
                    colorClass="from-[#c4742a] to-[#d4ae50]"
                />
                <KpiCard
                    label={t.dashboard.kpiOverdue}
                    value={overdueCount}
                    sub={t.dashboard.kpiOverdueSub}
                    icon="⏰"
                    colorClass="from-[#a03020] to-[#c4742a]"
                />
            </div>

            {/* Two-column lower section */}
            <div className="grid grid-cols-[2fr_1fr] gap-6">
                {/* Recently Added panel */}
                <div
                    className="bg-white border border-[rgba(61,28,2,0.1)] rounded-md shadow-[0_2px_12px_rgba(61,28,2,0.12)] overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-[rgba(61,28,2,0.08)]">
                        <div className="flex-1 font-playfair text-[1.05rem] font-bold text-[#3d1c02]">
                            {t.dashboard.recentlyAdded}
                        </div>
                        <button
                            onClick={onViewAll}
                            className="font-mono text-[0.65rem] tracking-[0.1em] uppercase text-[#c4742a] border border-[rgba(196,116,42,0.3)] rounded-sm px-2.5 py-1 hover:bg-[rgba(196,116,42,0.08)] transition-colors bg-transparent"
                        >
                            {t.dashboard.viewAll}
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[0.82rem]">
                            <thead>
                            <tr className="bg-[#f0ead8] border-b-2 border-[rgba(61,28,2,0.12)]">
                                <Th>{t.dashboard.colTitleAuthor}</Th>
                                <Th>{t.dashboard.colGenre}</Th>
                                <Th>{t.dashboard.colStatus}</Th>
                                <Th>{t.dashboard.colRating}</Th>
                            </tr>
                            </thead>
                            <tbody>
                            {recentBooks.map((book) => (
                                <tr
                                    key={book.id}
                                    onClick={() => onBookClick(book)}
                                    className="hover:bg-[rgba(245,240,232,0.7)] cursor-pointer transition-colors border-b border-[rgba(61,28,2,0.06)] last:border-b-0"
                                >
                                    <td className="px-4 py-2.5 align-middle">
                                        <div
                                            className="font-playfair font-bold text-[#3d1c02] text-[0.88rem]">{book.title}</div>
                                        <div className="italic text-[#6b4c2a] text-[0.78rem]">{book.author}</div>
                                    </td>
                                    <td className="px-4 py-2.5 align-middle"><GenreTag genre={book.genre}/></td>
                                    <td className="px-4 py-2.5 align-middle"><Badge status={book.status}/></td>
                                    <td className="px-4 py-2.5 align-middle">
                                        {book.rating ? <StarRating rating={book.rating}/> :
                                            <span className="text-[#6b4c2a]">—</span>}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Activity panel */}
                <div
                    className="bg-white border border-[rgba(61,28,2,0.1)] rounded-md shadow-[0_2px_12px_rgba(61,28,2,0.12)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[rgba(61,28,2,0.08)]">
                        <div className="font-playfair text-[1.05rem] font-bold text-[#3d1c02]">
                            {t.dashboard.recentActivity}
                        </div>
                    </div>
                    <ul>
                        {ACTIVITY_ITEMS.map((item) => (
                            <li
                                key={item.id}
                                className="flex gap-3.5 px-6 py-3.5 border-b border-[rgba(61,28,2,0.06)] last:border-b-0 items-start"
                            >
                <span
                    className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                        item.type === "lent" ? "bg-[#a03020]" :
                            item.type === "returned" ? "bg-[#4a6741]" : "bg-[#c4742a]"
                    }`}
                />
                                <div>
                                    {/* Activity text uses pre-built HTML for now.
                      For a production app, store structured {type, title, person}
                      data and call interpolate(t.dashboard.activityLent, {...})
                      to generate the sentence in the current language. */}
                                    <p
                                        className="text-[0.8rem] text-[#3d2b1a] leading-[1.5]"
                                        dangerouslySetInnerHTML={{__html: item.text}}
                                    />
                                    <p className="font-mono text-[0.6rem] text-[#6b4c2a] mt-0.5">{item.time}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

function KpiCard({
                     label, value, sub, icon, colorClass,
                 }: {
    label: string; value: number; sub: string; icon: string; colorClass: string;
}) {
    return (
        <div
            className="bg-white border border-[rgba(61,28,2,0.1)] rounded-md px-6 py-5 shadow-[0_2px_12px_rgba(61,28,2,0.12)] relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(61,28,2,0.12)] transition-all">
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${colorClass}`}/>
            <div className="font-mono text-[0.62rem] tracking-[0.18em] uppercase text-[#6b4c2a] mb-2">{label}</div>
            <div className="font-playfair text-[2.4rem] font-black text-[#3d1c02] leading-none">{value}</div>
            <div className="text-[0.75rem] text-[#6b4c2a] mt-1.5 italic">{sub}</div>
            <div className="absolute bottom-4 right-5 text-[2.5rem] opacity-[0.08]">{icon}</div>
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
