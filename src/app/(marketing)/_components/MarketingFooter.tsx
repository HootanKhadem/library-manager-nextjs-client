import Link from 'next/link';

export function MarketingFooter() {
    return (
        <footer className="relative border-t border-[var(--bw-rib)] bg-[var(--bw-bg-sunken)]">
            <div
                className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-10">
                <div>
                    <p className="text-[15px] font-bold tracking-[-0.02em] text-[var(--bw-ink)]">bookwrym</p>
                    <p className="mt-1 max-w-[34ch] text-[13px] leading-relaxed text-[var(--bw-ink-muted)]">
                        Your personal reading universe, organized.
                    </p>
                </div>

                <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3">
                    <Link href="/"
                          className="text-[13px] text-[var(--bw-ink-muted)] transition-colors hover:text-[var(--bw-ink)]">Home</Link>
                    <Link href="/about"
                          className="text-[13px] text-[var(--bw-ink-muted)] transition-colors hover:text-[var(--bw-ink)]">About</Link>
                    <Link href="/terms"
                          className="text-[13px] text-[var(--bw-ink-muted)] transition-colors hover:text-[var(--bw-ink)]">Terms
                        & data use</Link>
                    <Link href="/login"
                          className="text-[13px] text-[var(--bw-ink-muted)] transition-colors hover:text-[var(--bw-ink)]">Sign
                        in</Link>
                </nav>
            </div>

            <div className="border-t border-[var(--bw-rib)] px-6 py-5 sm:px-10">
                <p className="text-[12px] text-[var(--bw-ink-muted)]">
                    © {new Date().getFullYear()} bookwrym. Every entry, catalogued by hand.
                </p>
            </div>
        </footer>
    );
}
