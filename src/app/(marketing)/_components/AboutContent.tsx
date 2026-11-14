'use client';

import {useLanguage} from '@/src/lib/i18n/context';
import {LanternGlyph} from './LanternGlyph';

export function AboutContent() {
    const {t} = useLanguage();
    const m = t.marketing;

    const beliefs = [
        {state: 'lit' as const, title: m.aboutB1Title, body: m.aboutB1Body, indent: false, tethered: false},
        {state: 'folded' as const, title: m.aboutB2Title, body: m.aboutB2Body, indent: true, tethered: false},
        {state: 'lent' as const, title: m.aboutB3Title, body: m.aboutB3Body, indent: false, tethered: true},
    ];

    return (
        <>
            {/* ── Header ───────────────────────────────────────────── */}
            <section className="relative overflow-hidden px-6 pt-16 pb-20 sm:px-10 sm:pt-24 sm:pb-24">
                <div
                    className="pointer-events-none absolute -top-32 -start-32 h-[440px] w-[440px] rounded-full opacity-20 blur-[100px]"
                    style={{background: 'var(--bw-rose)'}}
                    aria-hidden="true"
                />
                <div className="relative mx-auto max-w-3xl">
                    <h1 className="text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-[var(--bw-ink)]">
                        {m.aboutTitle}
                    </h1>
                </div>
            </section>

            {/* ── Origin ───────────────────────────────────────────── */}
            <section className="border-t border-[var(--bw-rib)] px-6 py-20 sm:px-10 sm:py-24">
                <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.7fr_1.3fr]">
                    <h2 className="text-[clamp(1.4rem,2.4vw,1.9rem)] font-bold leading-tight tracking-[-0.02em] text-[var(--bw-ink)]">
                        {m.aboutWhyTitle}
                    </h2>
                    <div className="max-w-[70ch] space-y-5 text-[16px] leading-relaxed text-[var(--bw-ink-muted)]">
                        <p>
                            {m.aboutP1Pre}{' '}
                            <em className="not-italic text-[var(--bw-ink)]">{m.aboutP1Em}</em>
                        </p>
                        <p>{m.aboutP2}</p>
                    </div>
                </div>
            </section>

            {/* ── What we believe ─────────────────────────────────── */}
            <section className="border-t border-[var(--bw-rib)] bg-[var(--bw-bg-raised)] px-6 py-20 sm:px-10 sm:py-24">
                <div className="mx-auto max-w-6xl">
                    <h2 className="max-w-[22ch] text-[clamp(1.4rem,2.4vw,1.9rem)] font-bold leading-tight tracking-[-0.02em] text-[var(--bw-ink)]">
                        {m.aboutBelieveTitle}
                    </h2>

                    <div className="mt-14 space-y-14">
                        {beliefs.map(({state, title, body, indent, tethered}) => (
                            <div
                                key={state}
                                className={`flex flex-col gap-6 sm:flex-row sm:items-start ${indent ? 'sm:ps-[3.25rem]' : ''}`}
                            >
                                <LanternGlyph state={state} width={44} tethered={tethered} className="shrink-0"/>
                                <div className="max-w-[62ch]">
                                    <h3 className="text-[16px] font-semibold text-[var(--bw-ink)]">{title}</h3>
                                    <p className="mt-2 text-[15px] leading-relaxed text-[var(--bw-ink-muted)]">{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── The name ─────────────────────────────────────────── */}
            <section className="border-t border-[var(--bw-rib)] px-6 py-20 sm:px-10 sm:py-24">
                <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 sm:flex-row sm:items-center">
                    <LanternGlyph state="lit" width={40} className="shrink-0"/>
                    <p className="text-[16px] leading-relaxed text-[var(--bw-ink-muted)]">
                        <span className="font-semibold text-[var(--bw-ink)]">{m.aboutNameLabel}</span>{' '}
                        {m.aboutNameBody}
                    </p>
                </div>
            </section>
        </>
    );
}
