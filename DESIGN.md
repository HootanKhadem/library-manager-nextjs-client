---
name: bookwrym — Paper Lantern Study
description: Marketing surface visual system — folded washi lanterns glowing rose against a dark stone ground, dark until read, lit once owned.
colors:
  lantern-rose: "#E11D48"
  rose-dim: "#BE123C"
  ember: "#B3372B"
  wyrm-vermilion: "#C24A32"
  stone-room: "#1C1917"
  stone-raised: "#292524"
  stone-sunken: "#0C0A09"
  starlight-ink: "#FAFAF9"
  ink-muted: "#A8A29E"
  bamboo-rib: "rgba(250, 250, 249, 0.12)"
  on-accent: "#FFFFFF"
typography:
  display:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 6vw, 5rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.3
  lead:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    letterSpacing: "normal"
  label-lg:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    letterSpacing: "normal"
  caption:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "normal"
rounded:
  pill: "9999px"
  icon-circle: "9999px"
  focus-ring: "2px"
spacing:
  section-y-sm: "5rem"
  section-y-lg: "7rem"
  container-max: "72rem"
components:
  button-primary:
    backgroundColor: "{colors.lantern-rose}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  nav-link:
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
---

# Design System: bookwrym — Paper Lantern Study

## Overview

**Creative North Star: "The Paper Lantern Study"**

This DESIGN.md governs one surface only: the marketing route group at `src/app/(marketing)/` (`/`, `/about`, `/terms`) —
bookwrym's Persuade-mode entry point. It shares its accent and ground family with the app shell (dashboard/login/sidebar
under `src/app/(app)/` and `src/app/login/`) rather than running a separate hue: both worlds now key off the same
rose-600 accent and stone neutrals defined in the root `globals.css` (`--accent`, `--sidebar-bg`, etc.) — the marketing
surface reuses that palette on a dark, lantern-lit stage instead of the app shell's light one. Nothing in this file
describes the app shell's layout or components, only this surface's own composition built on the shared color family.

The Paper Lantern Study renders bookwrym's core idea — a shelf that stays dark until you've actually read something,
then glows only where you've been — as an akari-workshop world: folded washi-paper lanterns held in a near-black stone
room, lit one warm rose at a time. The system is built on restraint by omission: one saturated color against a
near-black ground, one brand seal used exactly once per view, one recurring silhouette (the folded hexagonal lantern)
doing all the illustrative work instead of a library of icons or photography. The palette was revised once after the
initial ship: the first pass used an indigo/amber pairing unrelated to the rest of the product, which read as a second,
disconnected brand; it was replaced with the app's own rose-600 accent over stone-900/950 neutrals so the marketing
surface and the app shell read as one product in two lighting conditions, not two products.

The system explicitly refuses the generic SaaS card-grid greeting: there are no bordered/shadowed cards, no stock icon
set, and no eyebrow labels sitting above headlines. Depth comes from tonal layering (three stone planes) and soft
ambient rose bloom, never from drop shadows on content blocks. Motion is likewise restrained: below-the-fold sections on
`/` fade and rise into place once as the visitor scrolls to them (never replayed), and the ambient glow orbs behind the
hero and closing CTA breathe slowly — small, purposeful moments rather than a shipped particle system.

**Key Characteristics:**

- Near-black stone ground with exactly one saturated accent (rose-600, shared with the app shell), never a flat color
  wash
- The folded-to-lit lantern silhouette is the sole recurring illustrative form — no icon library
- One vermilion seal mark per view, header only; overdue state uses a separate ember token
- Manrope throughout — a single grotesque family, no serif/display pairing
- No shadowed/bordered content cards; depth is tonal (bg / bg-raised / bg-sunken) plus soft blurred rose bloom
- Below-the-fold sections on `/` reveal once on scroll-into-view; ambient glow orbs breathe continuously — the system's
  only motion beyond button/link hover
- `/terms` runs a plainer two-column docs layout inside the same world — comprehension over expression for that one
  Read-mode page

## Colors

The palette is a dark, nearly monochrome stone field lit by exactly one saturated accent — the same rose the app shell
already uses for its own accent — plus two single-purpose warm reds reserved for state and seal.

### Primary

- **Lantern Rose** (`#E11D48`, rose-600 — identical to the app shell's `--accent`): the lantern's own light. Used for
  the primary CTA background, the "lit" and "lent" lantern glyph states, hover/underline accents, and the ambient
  blurred-orb bloom behind hero and closing-CTA sections. This is the only color that should read as "glowing."
- **Rose Dim** (`#BE123C`, rose-700 — identical to the app shell's `--accent-hover`): rose at rest — unlit rib strokes
  on the folded lantern state, the scrollbar thumb, list markers on the terms page. The muted sibling of Lantern Rose,
  not a separate accent.

### Secondary

- **Ember** (`#B3372B`): reserved exclusively for the "overdue" lantern state (fill + pulse glow). Deliberately a
  distinct hue from both Lantern Rose and the seal vermilion so a book's urgency state is never visually confused with
  the brand accent or the brand mark.

### Tertiary

- **Wyrm Vermilion** (`#C24A32`): the brand seal color, used only inside `WyrmMark` — the coiled-wyrm-in-a-circle mark
  in the header. Appears exactly once per rendered view. Never used for buttons, links, or state.

### Neutral

- **Stone Room** (`#1C1917`, stone-900 — identical to the app shell's `--sidebar-bg`): the base ground for the entire
  world (`--bw-bg`), applied to `.bw-world` at the layout root.
- **Stone Raised** (`#292524`, stone-800): one plane forward — used for the "how it glows" and "what we believe"
  sections to separate them from the base ground without a border or shadow.
- **Stone Sunken** (`#0C0A09`, stone-950): the deepest recess — footer background.
- **Starlight Ink** (`#FAFAF9`, stone-50 — identical to the app shell's `--background`, inverted for use as text on a
  dark ground): primary text color.
- **Ink Muted** (`#A8A29E`, stone-400 — identical to the app shell's `--muted-foreground`): body copy, nav links at
  rest, footer text.
- **Bamboo Rib** (`rgba(250, 250, 249, 0.12)`): the hairline divider color used for section borders, header/footer
  borders, the tether line on hanging lanterns, and the terms-page TOC rail — Starlight Ink at low opacity.
- **On Accent** (`#FFFFFF`): text color for content sitting on a Lantern Rose fill (button labels, selected text) —
  plain white for the contrast a saturated rose background needs.

### Light Theme (opt-in)

Dark is the default and carries the system's "dark until read" thesis; light is a confirmed alternate, toggled via the
header's sun/moon button (`ThemeToggle`) and persisted to `localStorage` (`bookwrym-theme`). Toggling sets
`data-theme="light"` on the `.bw-world` root, which swaps only the neutral ground/ink tokens — Lantern Rose, Rose Dim,
Ember, and Wyrm Vermilion are identical in both themes, so the brand accent never shifts underfoot.

- **Stone Room (light)** (`#FAFAF9`, stone-50) replaces Stone Room as the base ground.
- **Stone Raised (light)** (`#F5F5F4`, stone-100) replaces Stone Raised.
- **Stone Sunken (light)** (`#E7E5E4`, stone-200) replaces Stone Sunken.
- **Starlight Ink (light)** (`#1C1917`, stone-900) replaces Starlight Ink — dark text on the light ground.
- **Ink Muted (light)** (`#78716C`, stone-500) replaces Ink Muted.
- **Bamboo Rib (light)** (`rgba(28, 25, 23, 0.12)`) replaces Bamboo Rib — Starlight Ink (light)'s dark tone at the same
  low opacity, inverted from the dark theme's light-tinted hairline.
- The Glow Shadow's opacity is reduced slightly in light theme (`rgba(225, 29, 72, 0.22)` vs. `0.32`) since a saturated
  shadow reads heavier against a light ground.

### Named Rules

**The One Vermilion Rule.** The wyrm seal (`#C24A32`) renders exactly once per view, in the header only. It never
doubles as a link color, button color, or state indicator.

**The Ember Distinction Rule.** The overdue lantern state uses `--bw-ember` (`#B3372B`), a color deliberately distinct
from both the primary accent and the seal — a state signal is never allowed to borrow the brand accent's or the brand
mark's color.

**The Restrained Wash Rule.** Rose is a light source, not a background. It appears as accents, glyph fills, and soft
blurred bloom — never as a flat panel or section background.

**The One Product Rule.** This surface's accent and neutrals are the app shell's own rose-600/stone-900 family, not an
independent palette. A future color change to either world should be evaluated for the other.

**The Accent-Never-Shifts Rule.** Lantern Rose, Rose Dim, Ember, and Wyrm Vermilion do not change between the dark and
light themes — only the neutral ground and ink tokens invert. The brand color is constant; only the room's lighting
changes.

## Typography

**Display/Body/Label Font:** Manrope (self-hosted via `next/font/google`, weights 400–800), with
`ui-sans-serif, system-ui, sans-serif` fallback. No secondary family.

**Character:** A single confident grotesque doing every job — hero display, body copy, and small labels are all Manrope
at different weights, which keeps the world quiet and lets the rose glow and lantern silhouette carry the personality
instead of a display/body font pairing.

### Hierarchy

- **Display** (weight 800, `clamp(2.6rem, 6vw, 5rem)`, line-height 0.98, tracking -0.03em): the hero H1 only (`/`).
  Left-weighted, max-width 16ch.
- **Headline** (weight 700, `clamp(1.6rem, 2.8vw, 2.4rem)`, line-height tight, tracking -0.02em): section H2s on `/` and
  the `/about` page-header H1 uses a slightly larger variant (`clamp(2.2rem, 5vw, 3.6rem)`, weight 800). Closing-CTA H2
  goes up to `clamp(1.8rem, 3.6vw, 3rem)` weight 800.
- **Title** (weight 600, 19px): `/terms` numbered section headings.
- **Lead** (weight 600, 17px, line-height 1.4): the header wordmark and the hero's intro paragraph — text that needs to
  read heavier than body copy without becoming a heading.
- **Body** (weight 400, 16px, line-height 1.6): primary paragraph copy, measured to 62–70ch (hero copy 52ch is the one
  deliberate exception, kept short for scan speed).
- **Body Small** (weight 400, 15px, line-height 1.6): secondary/muted paragraph copy — About's "what we believe" item
  text, the footer tagline, terms intro and section paragraphs.
- **Label** (weight 500, 13px): nav links (mobile), footer nav links, terms TOC entries and contact link.
- **Label Large** (weight 500, 14px): nav links (desktop), the "See how it works" secondary CTA, primary/secondary
  button text.
- **Caption** (weight 400, 12px): footer copyright line only — the smallest text in the system, used exactly once per
  view.

### Named Rules

**The One Family Rule.** Manrope covers every role at every size; weight and size carry the hierarchy, never a
font-family switch.

## Layout

Content is centered in a `max-w-6xl` (72rem) container with `px-6`/`sm:px-10` gutters; the `/about` and `/terms` intro
blocks narrow further to `max-w-3xl` for a tighter reading column. Sections stack vertically, each separated by a
`border-t` hairline in Bamboo Rib rather than by whitespace alone — the rib is a structural divider, not decoration.
Vertical section rhythm is generous and consistent: `py-20`/`sm:py-24` to `sm:py-32` depending on section weight (hero
and closing CTA get the most air).

The hero and "capture speed" sections use asymmetric two-column grids (`lg:grid-cols-[1.1fr_0.9fr]`, `lg:grid-cols-2`)
with content left-weighted and illustration right-weighted, matching the direction contract's "left-weighted oversized
headline" viewport. The "how it glows" mechanism section runs a 4-up responsive grid (`sm:grid-cols-2 lg:grid-cols-4`)
with a deliberate offset stagger (every second item pushed down `2.5rem`) so the four lantern states read as a
hand-arranged cluster, not a rigid grid.

`/terms` breaks from the single-column narrative pattern used on `/` and `/about`: it runs a docs-style two-column
layout (`lg:grid-cols-[220px_1fr]`) with a sticky anchor table-of-contents rail on the left and prose on the right. This
is a deliberate, confirmed exception — `/terms` is a Read-mode page nested inside an otherwise Persuade-mode surface,
and comprehension takes priority over expression there.

## Elevation & Depth

The system is flat by default and uses tonal layering, not box-shadow cards, to separate content: three fixed stone
planes (Stone Room → Stone Raised → Stone Sunken) stand in for elevation steps. The only shadow in the system is a soft,
warm ambient glow reserved for the rose CTA button; large blurred rose "orbs" (radial gradients at very low opacity,
`blur-[100–110px]`) sit behind hero and closing-CTA sections to suggest lantern-light bloom without ever rendering as a
hard-edged shape. Those orbs, and the hero cluster's lit/lent lanterns, breathe on a slow independent loop
(`animate-orb-pulse` / `animate-lantern-breathe`) — the system's only continuous motion, meant to read as light, not as
UI activity.

### Shadow Vocabulary

- **Glow shadow** (`box-shadow: 0 8px 32px -4px rgba(225, 29, 72, 0.32), 0 2px 8px rgba(0,0,0,0.4)`): applied only to
  the rose pill CTA button (header "Sign in" and both in-page "Sign in to your library" CTAs). Reads as light escaping
  the lantern, not as a structural elevation cue.

### Named Rules

**The No-Card Rule.** Content never sits inside a bordered or shadowed card. Sections are separated by hairline dividers
and background-plane shifts only.

**The Glow-Is-Earned Rule.** The rose glow shadow is reserved for the primary CTA. It is not a generic hover treatment
for arbitrary elements.

**The Light-Not-UI Rule.** Ambient motion (the background bloom's `orbPulse` and the hero lanterns' `lanternBreathe`)
reads as a physical light source breathing, not as a loading state or an attention-grabbing UI effect — both stay slow
(5–7s loops) and low-amplitude, and are disabled under `prefers-reduced-motion: reduce`.

## Shapes

Corners are either fully round or absent — there is no small/medium radius step in between. Interactive pill shapes
(`rounded-full`) are used for every button/CTA and for the one circular icon container on the "capture speed" section
(`h-56 w-56`, `rounded-full` with a hairline border). Everything else — sections, text blocks, nav — is edge-to-edge
with no radius and no border box; the only borders in the system are the 1px Bamboo Rib hairlines used as horizontal
section dividers, never as a box outline around content.

The signature recurring silhouette is the folded hexagonal lantern body (see LanternGlyph below) — a six-point vertical
column shape that stands in for every piece of illustrative content on the surface instead of a conventional icon set.

## Components

### Buttons

- **Shape:** fully pill (`border-radius: 9999px`).
- **Primary:** Lantern Rose background, white text (On Accent) for contrast against the rose, `px-7 py-3.5`
  (hero/closing CTA) or `px-5 py-2.5` (header), Glow Shadow applied at all times, not just on hover.
- **Hover / Focus:** scale transform only (`hover:scale-[1.03] active:scale-[0.98]`, 200ms) — no color shift on hover.
  Focus-visible adds a 2px Lantern Rose outline with 3px offset
  (`.bw-world a:focus-visible, .bw-world button:focus-visible`), themed explicitly because the default browser focus
  ring is illegible against the stone ground.
- **Secondary / Ghost:** text links in Ink Muted with an underline in Bamboo Rib, brightening to Starlight Ink on hover
  ("See how it works", footer/nav links, terms "back to home").

### Cards / Containers

There is no card component in this system — see the No-Card Rule under Elevation & Depth. Content that might elsewhere
be a card (the four lantern-state entries, the "what we believe" items) is laid out as plain flex/grid items with icon +
heading + copy, no background, border, or shadow of their own.

### Navigation

- **Header:** WyrmMark + wordmark on the left, horizontal link row centered/right on desktop (`gap-8`, 14px medium, Ink
  Muted → Starlight Ink on hover, no underline at rest or on hover — the No-Line Rule below), then the ThemeToggle icon
  button, then the rose pill "Sign in" CTA on the far right. Below `sm`, the link row drops to a horizontal scrollable
  strip under a hairline border instead of a hamburger menu.
- **Footer:** three-tier stack (brand + tagline, link nav, copyright), set against Indigo Sunken to read as the deepest
  plane, hairline-divided from the content above and between its own tiers.

### Signature Component: LanternGlyph

The folded-paper-lantern SVG glyph (`src/app/(marketing)/_components/LanternGlyph.tsx`) is the system's one illustrative
primitive, replacing a conventional icon library everywhere on the surface. It renders a folded hexagonal-column
silhouette in four states, each with distinct color, gradient, and motion treatment:

- **folded** — Stone Raised fill with a 1.2px Bamboo Rib outline, no gradient, no glow, 0.9 opacity: the unread/wishlist
  state. The outline is deliberate — folded's fill sits only one plane off the page background, so without it the shape
  would nearly disappear in light theme.
- **lit** — Lantern Rose fill with a light-to-dim rose gradient, glow filter on, full opacity: the owned state.
- **lent** — Rose Dim fill with an inverted rose-to-maroon gradient, glow filter on, 0.85 opacity, optional dashed
  tether line to a hanging ring: the lent-out state.
- **overdue** — Ember fill, glow filter on, pulsing opacity animation (`animate-lantern-pulse`, 2.4s): the urgent state,
  deliberately never sharing the accent's or the seal's color.

Glow is rendered via an SVG `feGaussianBlur` + `feMerge` filter, unique per instance via `useId()` so repeated states on
one page (e.g. four lanterns in the hero cluster) never collide on filter/gradient IDs. An optional
`animate-lantern-breathe` (5s translate+scale loop) is used on the hero cluster's lit/lent lanterns for ambient life;
both animations are disabled under `prefers-reduced-motion: reduce`. Narrative ordering is significant: wherever
multiple states appear together, they read folded → lit → lent → overdue, mirroring a book's real lifecycle.

### Signature Component: WyrmMark

A coiled-wyrm-in-a-circle seal mark (`src/app/(marketing)/_components/WyrmMark.tsx`), rendered once per view in the
header only, always in Wyrm Vermilion outline with a small filled eye dot. It is the system's sole non-lantern mark and
the only permitted use of vermilion.

### Signature Component: Reveal

A scroll-triggered entrance wrapper (`src/app/(marketing)/_components/Reveal.tsx`) used on every below-the-fold block on
`/` (never on the hero — the first viewport is always immediately visible). Default state is `opacity: 0` +
`translateY(18px)`; an `IntersectionObserver` flips it to visible (`data-reveal="in"`, styled in `globals.css`) the
first time the element crosses 20% into view, then disconnects — the transition never replays. Accepts a `delay` prop
(ms) so a group of siblings, like the four "how it glows" lanterns, can stagger by 100ms each instead of arriving in
unison. If the observer never fires (e.g. an unusual viewport/compositor state), a 2-second fallback timer force-reveals
the content — this component can slow content's arrival, never suppress it permanently.

### Signature Component: ThemeToggle

A sun/moon icon button (`src/app/(marketing)/_components/ThemeToggle.tsx`) in the header, right of the nav links and
left of the "Sign in" CTA. Shows a moon (indicating "switch to light") in dark theme and a sun (indicating "switch to
dark") in light theme — the icon names the theme a click will produce, not the current one. On click it sets/removes
`data-theme="light"` on the `.bw-world` root and writes the choice to `localStorage`. On mount it reads that stored
value and, if `"light"`, applies it — dark is what the server always renders first, so a returning light-theme visitor
sees one brief frame of dark before the client-side read applies; there is no cookie-based server read to prevent this,
a known and accepted tradeoff rather than an oversight.

## Do's and Don'ts

### Do:

- **Do** treat Lantern Rose as a light source: CTAs, glyph "lit"/"lent" states, and soft blurred bloom only — never a
  section background.
- **Do** keep the wyrm seal to exactly one instance per view, in the header.
- **Do** use the folded → lit → lent → overdue ordering whenever multiple lantern states appear together.
- **Do** separate sections with Bamboo Rib hairlines and stone tonal-plane shifts rather than shadows or card borders.
- **Do** theme focus-visible and the scrollbar explicitly within `.bw-world` — the default browser treatments are
  illegible against the stone ground.
- **Do** keep `/terms` in its plainer two-column docs layout; it is a confirmed, intentional exception for a Read-mode
  page.
- **Do** keep this surface's accent and neutrals matched to the app shell's rose-600/stone-900 family — a follow-up
  request explicitly corrected an earlier indigo/amber pairing for reading as a disconnected second brand.
- **Do** reveal below-the-fold content on `/` once via `Reveal`, staggering sibling groups by ~100ms; never replay an
  entrance on scroll-back.
- **Do** keep Lantern Rose, Rose Dim, Ember, and Wyrm Vermilion identical across both themes — only neutrals invert.
- **Do** keep dark as the default theme; light is opt-in via the header toggle only, never triggered by system
  `prefers-color-scheme`.

### Don't:

- **Don't** introduce a second saturated accent color beyond Lantern Rose. Ember and Vermilion are single-purpose
  exceptions (overdue state; brand seal), not a growing palette.
- **Don't** put content in a bordered or shadowed card. This world has no card component.
- **Don't** reuse Wyrm Vermilion for anything other than the header seal, including links, buttons, or state colors.
- **Don't** underline nav links at rest or on hover; brightness change (Ink Muted → Starlight Ink) is the only hover
  signal for text nav.
- **Don't** stack a label/kicker above a headline. The build shipped one during development and it was removed in finish
  review; this system has no eyebrow-label convention and none should be introduced.
- **Don't** wrap the hero in a scroll-reveal. The first viewport must always be immediately visible; `Reveal` is for
  below-the-fold content only.
