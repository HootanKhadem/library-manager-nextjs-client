'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {useAuth} from '@/src/contexts/AuthContext';
import {useLanguage} from '@/src/lib/i18n/context';
import {LanternGlyph} from './_components/LanternGlyph';
import {Reveal} from './_components/Reveal';

export default function HomePage() {
    const {isAuthenticated, hydrated} = useAuth();
    const router = useRouter();
    const {t} = useLanguage();
    const m = t.marketing;

    useEffect(() => {
        if (hydrated && isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [hydrated, isAuthenticated, router]);

    if (!hydrated || isAuthenticated) return null;

    const GLOW_STATES = [
        {state: 'folded' as const, title: m.stateWishlistTitle, copy: m.stateWishlistCopy},
        {state: 'lit' as const, title: m.stateOwnedTitle, copy: m.stateOwnedCopy},
        {state: 'lent' as const, title: m.stateLentTitle, copy: m.stateLentCopy},
        {state: 'overdue' as const, title: m.stateOverdueTitle, copy: m.stateOverdueCopy},
    ];

    return (
        <>
            {/* ── Hero ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden px-6 pt-16 pb-24 sm:px-10 sm:pt-24 sm:pb-32">
                <div
                    className="pointer-events-none absolute -top-40 -end-40 h-[520px] w-[520px] rounded-full opacity-25 blur-[100px] animate-orb-pulse"
                    style={{background: 'var(--bw-rose)'}}
                    aria-hidden="true"
                />

                <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
                    <div>
                        <h1 className="max-w-[16ch] text-[clamp(2.6rem,6vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-[var(--bw-ink)]">
                            {m.homeHeroTitle}
                        </h1>
                        <p className="mt-7 max-w-[52ch] text-[17px] leading-relaxed text-[var(--bw-ink-muted)]">
                            {m.homeHeroBody}
                        </p>

                        <div className="mt-10 flex flex-wrap items-center gap-5">
                            <Link
                                href="/login"
                                className="rounded-full bg-[var(--bw-rose)] px-7 py-3.5 text-[14px] font-semibold text-white shadow-[var(--bw-glow-shadow)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
                            >
                                {m.homeCtaSignIn}
                            </Link>
                            <a
                                href="#how-it-glows"
                                className="text-[14px] font-medium text-[var(--bw-ink-muted)] underline decoration-[var(--bw-rib)] underline-offset-4 transition-colors hover:text-[var(--bw-ink)]"
                            >
                                {m.homeCtaHow}
                            </a>
                        </div>
                    </div>

                    <div className="relative flex items-end justify-center gap-6 sm:gap-8" aria-hidden="true">
                        <LanternGlyph state="folded" width={44} className="translate-y-4 opacity-80"/>
                        <LanternGlyph state="lit" width={78} className="animate-lantern-breathe"/>
                        <LanternGlyph state="lent" width={56} tethered
                                      className="animate-lantern-breathe [animation-delay:-1.4s]"/>
                        <LanternGlyph state="overdue" width={50} tethered className="translate-y-3"/>
                    </div>
                </div>
            </section>

            {/* ── Why it exists ───────────────────────────────────── */}
            <section className="border-t border-[var(--bw-rib)] px-6 py-20 sm:px-10 sm:py-28">
                <Reveal className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.7fr_1.3fr]">
                    <h2 className="text-[clamp(1.6rem,2.8vw,2.4rem)] font-bold leading-tight tracking-[-0.02em] text-[var(--bw-ink)]">
                        {m.homeWhyTitle}
                    </h2>
                    <div className="max-w-[70ch] space-y-5 text-[16px] leading-relaxed text-[var(--bw-ink-muted)]">
                        <p>{m.homeWhyP1}</p>
                        <p>{m.homeWhyP2}</p>
                    </div>
                </Reveal>
            </section>

            {/* ── How it glows (mechanism) ────────────────────────── */}
            <section id="how-it-glows"
                     className="border-t border-[var(--bw-rib)] bg-[var(--bw-bg-raised)] px-6 py-20 sm:px-10 sm:py-28">
                <div className="mx-auto max-w-6xl">
                    <Reveal>
                        <h2 className="max-w-[24ch] text-[clamp(1.6rem,2.8vw,2.4rem)] font-bold leading-tight tracking-[-0.02em] text-[var(--bw-ink)]">
                            {m.homeHowTitle}
                        </h2>
                    </Reveal>

                    <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
                        {GLOW_STATES.map(({state, title, copy}, i) => (
                            <Reveal
                                key={state}
                                delay={i * 100}
                                className="group flex flex-col items-start"
                                style={{marginTop: i % 2 === 1 ? '2.5rem' : 0}}
                            >
                                <LanternGlyph
                                    state={state}
                                    width={56}
                                    className="mb-6 transition-transform duration-300 ease-out group-hover:-translate-y-1.5"
                                />
                                <h3 className="text-[15px] font-semibold text-[var(--bw-ink)]">{title}</h3>
                                <p className="mt-2 text-[14px] leading-relaxed text-[var(--bw-ink-muted)]">{copy}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Capture speed ────────────────────────────────────── */}
            <section className="border-t border-[var(--bw-rib)] px-6 py-20 sm:px-10 sm:py-28">
                <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
                    <Reveal>
                        <h2 className="text-[clamp(1.6rem,2.8vw,2.4rem)] font-bold leading-tight tracking-[-0.02em] text-[var(--bw-ink)]">
                            {m.homeCaptureTitle}
                        </h2>
                        <p className="mt-5 max-w-[52ch] text-[16px] leading-relaxed text-[var(--bw-ink-muted)]">
                            {m.homeCaptureBody}
                        </p>
                    </Reveal>
                    <Reveal delay={150} className="flex justify-center lg:justify-end">
                        <div
                            className="relative flex h-56 w-56 items-center justify-center rounded-full border border-[var(--bw-rib)]">
                            <div
                                className="absolute inset-6 rounded-full opacity-40 blur-2xl animate-orb-pulse"
                                style={{background: 'var(--bw-rose)'}}
                                aria-hidden="true"
                            />
                            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" className="relative"
                                 aria-hidden="true">
                                <rect x="3" y="5" width="18" height="14" rx="2" stroke="var(--bw-rose)"
                                      strokeWidth="1.6"/>
                                <line x1="6" y1="8" x2="6" y2="16" stroke="var(--bw-ink)" strokeWidth="1.4"/>
                                <line x1="9" y1="8" x2="9" y2="16" stroke="var(--bw-ink)" strokeWidth="0.9"/>
                                <line x1="11.5" y1="8" x2="11.5" y2="16" stroke="var(--bw-ink)" strokeWidth="1.8"/>
                                <line x1="14" y1="8" x2="14" y2="16" stroke="var(--bw-ink)" strokeWidth="0.9"/>
                                <line x1="17" y1="8" x2="17" y2="16" stroke="var(--bw-ink)" strokeWidth="1.4"/>
                            </svg>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ── Closing CTA ──────────────────────────────────────── */}
            <section
                className="relative overflow-hidden border-t border-[var(--bw-rib)] px-6 py-24 text-center sm:px-10 sm:py-32">
                <div
                    className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-[420px] w-[420px] -translate-y-1/2 rounded-full opacity-20 blur-[110px] animate-orb-pulse"
                    style={{background: 'var(--bw-rose)'}}
                    aria-hidden="true"
                />
                <Reveal className="relative mx-auto max-w-2xl">
                    <h2 className="text-[clamp(1.8rem,3.6vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[var(--bw-ink)]">
                        {m.homeClosingTitle}
                    </h2>
                    <p className="mt-5 text-[16px] leading-relaxed text-[var(--bw-ink-muted)]">
                        {m.homeClosingBody}
                    </p>
                    <Link
                        href="/login"
                        className="mt-9 inline-block rounded-full bg-[var(--bw-rose)] px-8 py-3.5 text-[14px] font-semibold text-white shadow-[var(--bw-glow-shadow)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
                    >
                        {m.homeCtaSignIn}
                    </Link>
                </Reveal>
            </section>
        </>
    );
}
