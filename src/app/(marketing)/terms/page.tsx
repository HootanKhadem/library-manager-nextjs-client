import Link from 'next/link';

export const metadata = {
    title: 'Terms & data use — bookwrym',
    description: 'What bookwrym is, and what we do with your data and how we store it.',
};

const SECTIONS = [
    {id: 'scope', label: '1. What this covers'},
    {id: 'account', label: '2. Your account & access'},
    {id: 'data-we-collect', label: '3. What data we collect'},
    {id: 'how-we-store-it', label: '4. How we store it'},
    {id: 'your-rights', label: '5. Your rights'},
    {id: 'changes', label: '6. Changes to these terms'},
    {id: 'contact', label: '7. Contact'},
];

export default function TermsPage() {
    return (
        <section className="px-6 pt-16 pb-24 sm:px-10 sm:pt-24 sm:pb-32">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-[clamp(2.1rem,4.4vw,3.2rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[var(--bw-ink)]">
                    Terms & how we use your data
                </h1>
                <p className="mt-6 max-w-[68ch] text-[15px] leading-relaxed text-[var(--bw-ink-muted)]">
                    This page describes, in plain language, what bookwrym does with the
                    information you give it and how that information is stored. It&apos;s a
                    working draft — content will be reviewed and finalized before bookwrym
                    is used to manage real collections, and nothing here should be read as
                    legal advice or a certification of compliance with any specific law.
                </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-6xl gap-12 lg:grid-cols-[220px_1fr]">
                <nav aria-label="Sections" className="hidden lg:block">
                    <ul className="sticky top-24 space-y-3 border-l border-[var(--bw-rib)] pl-5">
                        {SECTIONS.map(({id, label}) => (
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
                        <h2 className="text-[19px] font-semibold text-[var(--bw-ink)]">1. What this covers</h2>
                        <p className="mt-3">
                            bookwrym is a personal library manager: you catalogue books you own,
                            track copies you&apos;ve lent to other people, and browse authors within
                            your own collection. It is not a social network — there is no public
                            profile, no follower list, and no way for other users to see your
                            shelf. These terms cover the account you create and the collection
                            data you enter.
                        </p>
                    </div>

                    <div id="account" className="scroll-mt-24">
                        <h2 className="text-[19px] font-semibold text-[var(--bw-ink)]">2. Your account & access</h2>
                        <p className="mt-3">
                            Accounts are set up by an administrator and signed into with an email
                            and password. When you sign in, we set a session cookie that isn&apos;t
                            readable by page scripts (an &ldquo;httpOnly&rdquo; cookie) to keep you
                            signed in; if you choose &ldquo;remember me,&rdquo; a small flag is saved
                            in your browser&apos;s local storage so your session can be restored on
                            return visits. Signing out, or that session expiring, clears both.
                        </p>
                    </div>

                    <div id="data-we-collect" className="scroll-mt-24">
                        <h2 className="text-[19px] font-semibold text-[var(--bw-ink)]">3. What data we collect</h2>
                        <p className="mt-3">We collect only what your account and your collection need to function:</p>
                        <ul className="mt-4 space-y-2.5 pl-5">
                            <li className="list-disc marker:text-[var(--bw-rose-dim)]">
                                <span className="text-[var(--bw-ink)]">Account details</span> — your email address and
                                password (stored hashed, never in plain text).
                            </li>
                            <li className="list-disc marker:text-[var(--bw-rose-dim)]">
                                <span className="text-[var(--bw-ink)]">Collection data</span> — the books, authors, and
                                lending records you add: titles, genres, cover images, and who a book is lent to along
                                with due dates.
                            </li>
                            <li className="list-disc marker:text-[var(--bw-rose-dim)]">
                                <span className="text-[var(--bw-ink)]">Preferences</span> — settings like your library
                                name, default loan duration, and date format.
                            </li>
                        </ul>
                        <p className="mt-4">
                            We don&apos;t collect data to build advertising profiles, and we don&apos;t
                            sell or share your collection data with third parties for marketing.
                        </p>
                    </div>

                    <div id="how-we-store-it" className="scroll-mt-24">
                        <h2 className="text-[19px] font-semibold text-[var(--bw-ink)]">4. How we store it</h2>
                        <p className="mt-3">
                            Your data lives on bookwrym&apos;s backend service, reached only through
                            our own servers — your browser never talks to it directly. Each
                            account&apos;s collection is isolated from every other account: there is
                            no shared or team view. We use industry-standard measures (encrypted
                            connections, hashed passwords, access-controlled infrastructure) to
                            protect it, and we&apos;ll publish specifics on hosting location and
                            retention here once they&apos;re finalized.
                        </p>
                    </div>

                    <div id="your-rights" className="scroll-mt-24">
                        <h2 className="text-[19px] font-semibold text-[var(--bw-ink)]">5. Your rights</h2>
                        <p className="mt-3">
                            You can export your collection at any time from Settings. You can ask
                            an administrator to correct inaccurate account details, or to delete
                            your account and the collection data tied to it. We aim to act on
                            deletion requests promptly and remove the underlying data rather than
                            just hiding it from view.
                        </p>
                    </div>

                    <div id="changes" className="scroll-mt-24">
                        <h2 className="text-[19px] font-semibold text-[var(--bw-ink)]">6. Changes to these terms</h2>
                        <p className="mt-3">
                            If this page changes in a way that affects how your data is used, we&apos;ll
                            update the date below and, where the change is significant, let signed-in
                            users know directly rather than relying on a silent edit here.
                        </p>
                        <p className="mt-3 text-[13px] text-[var(--bw-ink-muted)]/80">Last updated: draft, not yet
                            published.</p>
                    </div>

                    <div id="contact" className="scroll-mt-24">
                        <h2 className="text-[19px] font-semibold text-[var(--bw-ink)]">7. Contact</h2>
                        <p className="mt-3">
                            Questions about this page or your data can go to your library&apos;s
                            administrator. A dedicated contact address will be published here
                            alongside the finalized terms.
                        </p>
                        <p className="mt-6">
                            <Link href="/"
                                  className="text-[var(--bw-rose)] underline underline-offset-4 hover:text-[var(--bw-ink)]">
                                ← Back to home
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
