import {LanternGlyph} from '../_components/LanternGlyph';

export const metadata = {
    title: 'About — bookwrym',
    description: 'Why bookwrym exists and what it refuses to become.',
};

export default function AboutPage() {
    return (
        <>
            {/* ── Header ───────────────────────────────────────────── */}
            <section className="relative overflow-hidden px-6 pt-16 pb-20 sm:px-10 sm:pt-24 sm:pb-24">
                <div
                    className="pointer-events-none absolute -top-32 -left-32 h-[440px] w-[440px] rounded-full opacity-20 blur-[100px]"
                    style={{background: 'var(--bw-rose)'}}
                    aria-hidden="true"
                />
                <div className="relative mx-auto max-w-3xl">
                    <h1 className="text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-[var(--bw-ink)]">
                        A shelf is a private thing. We built bookwrym to keep it that way.
                    </h1>
                </div>
            </section>

            {/* ── Origin ───────────────────────────────────────────── */}
            <section className="border-t border-[var(--bw-rib)] px-6 py-20 sm:px-10 sm:py-24">
                <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.7fr_1.3fr]">
                    <h2 className="text-[clamp(1.4rem,2.4vw,1.9rem)] font-bold leading-tight tracking-[-0.02em] text-[var(--bw-ink)]">
                        Why we started
                    </h2>
                    <div className="max-w-[70ch] space-y-5 text-[16px] leading-relaxed text-[var(--bw-ink-muted)]">
                        <p>
                            Every reading app we tried wanted the same thing: a feed. Star ratings,
                            follower counts, a public shelf for strangers to scroll through. None
                            of it answered the question we actually had, which was smaller and far
                            more common — <em className="not-italic text-[var(--bw-ink)]">what do I own, who has it
                            right now, and when is it due back?</em>
                        </p>
                        <p>
                            So we built the tool we wanted: a personal catalogue, not a social
                            network. No reviews, no timelines, no algorithm deciding what you see
                            next. Just your collection, organized, with lending tracked the way a
                            good librarian would track it — quietly and precisely.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── What we believe ─────────────────────────────────── */}
            <section className="border-t border-[var(--bw-rib)] bg-[var(--bw-bg-raised)] px-6 py-20 sm:px-10 sm:py-24">
                <div className="mx-auto max-w-6xl">
                    <h2 className="max-w-[22ch] text-[clamp(1.4rem,2.4vw,1.9rem)] font-bold leading-tight tracking-[-0.02em] text-[var(--bw-ink)]">
                        What we believe
                    </h2>

                    <div className="mt-14 space-y-14">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                            <LanternGlyph state="lit" width={44} className="shrink-0"/>
                            <div className="max-w-[62ch]">
                                <h3 className="text-[16px] font-semibold text-[var(--bw-ink)]">Speed of capture
                                    wins.</h3>
                                <p className="mt-2 text-[15px] leading-relaxed text-[var(--bw-ink-muted)]">
                                    Adding a book — by barcode scan or by hand — should take seconds.
                                    A cataloguing tool that&apos;s slower than just remembering isn&apos;t
                                    worth using.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:pl-[3.25rem]">
                            <LanternGlyph state="folded" width={44} className="shrink-0"/>
                            <div className="max-w-[62ch]">
                                <h3 className="text-[16px] font-semibold text-[var(--bw-ink)]">Personal, never
                                    social.</h3>
                                <p className="mt-2 text-[15px] leading-relaxed text-[var(--bw-ink-muted)]">
                                    No feeds, reviews, or friends list. Your shelf is yours to
                                    browse, not something we optimize for other people to see.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                            <LanternGlyph state="lent" width={44} tethered className="shrink-0"/>
                            <div className="max-w-[62ch]">
                                <h3 className="text-[16px] font-semibold text-[var(--bw-ink)]">Lending is the hard part
                                    — so we track it closely.</h3>
                                <p className="mt-2 text-[15px] leading-relaxed text-[var(--bw-ink-muted)]">
                                    Due dates, overdue alerts, and a clear record of who borrowed
                                    what. The thing that actually gets a book lost is the thing we
                                    built first.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── The name ─────────────────────────────────────────── */}
            <section className="border-t border-[var(--bw-rib)] px-6 py-20 sm:px-10 sm:py-24">
                <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 sm:flex-row sm:items-center">
                    <LanternGlyph state="lit" width={40} className="shrink-0"/>
                    <p className="text-[16px] leading-relaxed text-[var(--bw-ink-muted)]">
                        <span className="font-semibold text-[var(--bw-ink)]">The name:</span> a
                        bookworm with a bit more mythology to it — the quiet, coiled creature
                        that lives inside a well-loved collection and knows exactly where
                        everything is. We liked that better than another word ending in
                        &ldquo;-ly&rdquo; or &ldquo;-ify.&rdquo;
                    </p>
                </div>
            </section>
        </>
    );
}
