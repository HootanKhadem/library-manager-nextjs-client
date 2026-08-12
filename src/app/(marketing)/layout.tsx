import {Manrope} from 'next/font/google';
import {MarketingHeader} from './_components/MarketingHeader';
import {MarketingFooter} from './_components/MarketingFooter';

const manrope = Manrope({
    variable: '--font-manrope',
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '500', '600', '700', '800'],
});

const DIRECTION_CONTRACT = `
THESIS: bookwrym's shelf glows only where you've been — a lit paper lantern,
not a spreadsheet. Refuses the generic SaaS card-grid greeting.
OWN-WORLD: near-black stone ground (#1C1917) lit by rose-600 (#E11D48) — the
app shell's own accent, shared rather than a separate hue — as the only
saturated color; folded-washi lantern silhouettes as the recurring form, one
vermilion wyrm-seal mark, Manrope throughout, bamboo-rib hairline dividers.
Dark is the default (carries the "dark until read" thesis); a light theme
(stone-50 ground, same rose accent) is a confirmed opt-in via a header
toggle, persisted to localStorage, never the default.
STORY: visitor understands bookwrym as a fast, personal way to catalogue and
lend books; believes their shelf stays theirs, not a social feed; acts by
signing in to start cataloguing.
FIRST VIEWPORT: full-bleed dark hero, left-weighted oversized headline, a
cluster of folded-to-lit lantern shapes at right dramatizing
unread -> owned -> lent-out state, rose "Sign in" CTA glowing beneath the
headline.
FORM: challenger "Paper Lantern Study" (akari workshop world), dealt against
grounded direction "Astrolabe Observatory" — seed key 40030c33 — user-picked
over the roll via the decision page. Code-led (no image generation available
this session). Palette revised post-ship from an indigo/amber pairing to the
app's own rose/stone family, per user feedback; light theme added after that.
FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, and DESIGN.md.
`;

export default function MarketingLayout({children}: { children: React.ReactNode }) {
    return (
        <div className={`bw-world ${manrope.variable} min-h-screen`}>
            <div
                aria-hidden="true"
                dangerouslySetInnerHTML={{__html: `<!--\n${DIRECTION_CONTRACT}\n-->`}}
            />
            <MarketingHeader/>
            <main>{children}</main>
            <MarketingFooter/>
        </div>
    );
}
