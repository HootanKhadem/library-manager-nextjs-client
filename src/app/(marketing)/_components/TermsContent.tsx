'use client';

import Link from 'next/link';
import {useLanguage} from '@/src/lib/i18n/context';

const H2 = 'text-[19px] font-semibold text-[var(--bw-ink)]';
const BULLET = 'list-disc marker:text-[var(--bw-rose-dim)]';

export function TermsContent() {
    const {t} = useLanguage();
    const m = t.marketing;

    const sections = [
        {id: 'scope', label: m.termsS1Title},
        {id: 'account', label: m.termsS2Title},
        {id: 'data-we-collect', label: m.termsS3Title},
        {id: 'how-we-store-it', label: m.termsS4Title},
        {id: 'your-rights', label: m.termsS5Title},
        {id: 'changes', label: m.termsS6Title},
        {id: 'contact', label: m.termsS7Title},
    ];

    return (
        <section className="px-6 pt-16 pb-24 sm:px-10 sm:pt-24 sm:pb-32">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-[clamp(2.1rem,4.4vw,3.2rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[var(--bw-ink)]">
                    {m.termsTitle}
                </h1>
                <p className="mt-6 max-w-[68ch] text-[15px] leading-relaxed text-[var(--bw-ink-muted)]">
                    {m.termsIntro}
                </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-6xl gap-12 lg:grid-cols-[220px_1fr]">
                <nav aria-label={m.sectionsNav} className="hidden lg:block">
                    <ul className="sticky top-24 space-y-3 border-s border-[var(--bw-rib)] ps-5">
                        {sections.map(({id, label}) => (
                            <li key={id}>
                                <a
                                    href={`#${id}`}
                                    className="text-[13px] leading-snug text-[var(--bw-ink-muted)] transition-colors hover:text-[var(--bw-ink)]"
                                >
                                    {label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="max-w-[70ch] space-y-16 text-[15px] leading-relaxed text-[var(--bw-ink-muted)]">
                    <div id="scope" className="scroll-mt-24">
                        <h2 className={H2}>{m.termsS1Title}</h2>
                        <p className="mt-3">{m.termsS1Body}</p>
                    </div>

                    <div id="account" className="scroll-mt-24">
                        <h2 className={H2}>{m.termsS2Title}</h2>
                        <p className="mt-3">{m.termsS2Body}</p>
                    </div>

                    <div id="data-we-collect" className="scroll-mt-24">
                        <h2 className={H2}>{m.termsS3Title}</h2>
                        <p className="mt-3">{m.termsS3Intro}</p>
                        <ul className="mt-4 space-y-2.5 ps-5">
                            <li className={BULLET}>
                                <span className="text-[var(--bw-ink)]">{m.termsS3AccountLabel}</span> — {m.termsS3AccountBody}
                            </li>
                            <li className={BULLET}>
                                <span className="text-[var(--bw-ink)]">{m.termsS3CollectionLabel}</span> — {m.termsS3CollectionBody}
                            </li>
                            <li className={BULLET}>
                                <span className="text-[var(--bw-ink)]">{m.termsS3PrefsLabel}</span> — {m.termsS3PrefsBody}
                            </li>
                        </ul>
                        <p className="mt-4">{m.termsS3Outro}</p>
                    </div>

                    <div id="how-we-store-it" className="scroll-mt-24">
                        <h2 className={H2}>{m.termsS4Title}</h2>
                        <p className="mt-3">{m.termsS4Body}</p>
                    </div>

                    <div id="your-rights" className="scroll-mt-24">
                        <h2 className={H2}>{m.termsS5Title}</h2>
                        <p className="mt-3">{m.termsS5Body}</p>
                    </div>

                    <div id="changes" className="scroll-mt-24">
                        <h2 className={H2}>{m.termsS6Title}</h2>
                        <p className="mt-3">{m.termsS6Body}</p>
                        <p className="mt-3 text-[13px] text-[var(--bw-ink-muted)]/80">{m.termsS6Updated}</p>
                    </div>

                    <div id="contact" className="scroll-mt-24">
                        <h2 className={H2}>{m.termsS7Title}</h2>
                        <p className="mt-3">{m.termsS7Body}</p>
                        <p className="mt-6">
                            <Link href="/"
                                  className="text-[var(--bw-rose)] underline underline-offset-4 hover:text-[var(--bw-ink)]">
                                {m.termsBackHome}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
