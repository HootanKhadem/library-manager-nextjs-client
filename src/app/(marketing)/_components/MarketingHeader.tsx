import Link from 'next/link';
import {WyrmMark} from './WyrmMark';
import {ThemeToggle} from './ThemeToggle';

const LINKS = [
    {href: '/', label: 'Home'},
    {href: '/about', label: 'About'},
    {href: '/terms', label: 'Terms & data'},
];

export function MarketingHeader() {
    return (
        <header className="relative z-20 border-b border-[var(--bw-rib)]">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <WyrmMark className="h-7 w-7 transition-transform duration-300 group-hover:rotate-[8deg]"/>
                    <span className="text-[17px] font-bold tracking-[-0.02em] text-[var(--bw-ink)]">bookwrym</span>
                </Link>

                <nav aria-label="Primary" className="hidden items-center gap-8 sm:flex">
                    {LINKS.map(({href, label}) => (
                        <Link
                            key={href}
                            href={href}
                            className="relative text-[14px] font-medium text-[var(--bw-ink-muted)] transition-colors duration-200 hover:text-[var(--bw-ink)]"
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <ThemeToggle/>
                    <Link
                        href="/login"
                        className="rounded-full bg-[var(--bw-rose)] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[var(--bw-glow-shadow)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
                    >
                        Sign in
                    </Link>
                </div>
            </div>

            <nav
                aria-label="Primary"
                className="flex items-center gap-6 overflow-x-auto border-t border-[var(--bw-rib)] px-6 py-3 sm:hidden"
            >
                {LINKS.map(({href, label}) => (
                    <Link
                        key={href}
                        href={href}
                        className="whitespace-nowrap text-[13px] font-medium text-[var(--bw-ink-muted)] transition-colors duration-200 hover:text-[var(--bw-ink)]"
                    >
                        {label}
                    </Link>
                ))}
            </nav>
        </header>
    );
}
