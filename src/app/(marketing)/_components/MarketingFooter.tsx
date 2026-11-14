'use client';

import Link from 'next/link';
import {interpolate, useLanguage} from '@/src/lib/i18n/context';

const LINK_CLASS = 'text-[13px] text-[var(--bw-ink-muted)] transition-colors hover:text-[var(--bw-ink)]';

export function MarketingFooter() {
    const {t} = useLanguage();

    return (
        <footer className="relative border-t border-[var(--bw-rib)] bg-[var(--bw-bg-sunken)]">
            <div
                className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-10">
                <div>
                    <p className="text-[15px] font-bold tracking-[-0.02em] text-[var(--bw-ink)]">toumaar</p>
                    <p className="mt-1 max-w-[34ch] text-[13px] leading-relaxed text-[var(--bw-ink-muted)]">
                        {t.marketing.footerTagline}
                    </p>
                </div>

                <nav aria-label={t.marketing.footerNav} className="flex flex-wrap gap-x-8 gap-y-3">
                    <Link href="/" className={LINK_CLASS}>{t.marketing.navHome}</Link>
                    <Link href="/about" className={LINK_CLASS}>{t.marketing.navAbout}</Link>
                    <Link href="/terms" className={LINK_CLASS}>{t.marketing.footerTerms}</Link>
                    <Link href="/login" className={LINK_CLASS}>{t.marketing.signIn}</Link>
                </nav>
            </div>

            <div className="border-t border-[var(--bw-rib)] px-6 py-5 sm:px-10">
                <p className="text-[12px] text-[var(--bw-ink-muted)]">
                    {interpolate(t.marketing.footerCopyright, {year: String(new Date().getFullYear())})}
                </p>
            </div>
        </footer>
    );
}
