# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Multi-tenant librarian tool: many user accounts, each with own personal book library. Admin role manages user accounts
(`/api/admin/users`). Individual users log in and manage their own collection — cataloguing, lending, authors.

## Product Purpose

bookwrym — personal library management app. Lets a user track their book collection (owned, lent out, wishlist), manage
lending to friends/family with due dates and overdue tracking, catalogue authors, and get a dashboard overview (KPIs,
recent activity). Success = fast, accurate personal cataloguing with minimal friction.

## Positioning

Fast personal cataloguing is the core mechanism — quick add via barcode/ISBN scan (`@zxing/browser`,
`react-barcode-scanner`) plus a clean, uncluttered personal collection view. Not a social reading network (no
reviews/feeds/friends timeline like Goodreads); not a spreadsheet. Speed of capture + clarity of collection view over
social or discovery features.

## Operating Context

- Client-only Next.js app (App Router). All data comes from a separate backend API service (own repo, not this one)
  reached via `API_BASE_URL`; Next.js route handlers under `src/app/api/**` proxy to it and attach `access_token` from
  httpOnly cookies.
- Auth: email/password login, httpOnly cookie session, remember-me via localStorage flag, global `librax:unauthorized`
  event on 401 to force logout UI state.
- i18n supported (`LanguageProvider`/`LanguageSwitcher`).
- Core workflows: add/edit/delete book (barcode scan or manual), lend a book to a person, mark returned,
  browse/filter/search books (All/Owned/Lent Out/Wishlist), browse authors, view dashboard KPIs, configure settings
  (library name, loan duration, date format, export).

## Capabilities and Constraints

- Backend is a separate, already-built application — this repo is the client only. Treat backend API contract as
  fixed/external; do not invent backend behavior, only what the proxy routes and existing API calls confirm.
- Admin user management exists (`/api/admin/users`) but full admin UI/permissions model is not yet explored — treat as
  undecided/open until confirmed.
- Responsive/mobile-friendly with collapsible sidebar (existing requirement, per README).

## Brand Commitments

- Product name: **bookwrym** (renamed from Librax 2026-08-12; app-internal identifiers like the `librax_session` storage
  key and `librax:unauthorized` event stay as-is, not user-facing).
- App chrome (dashboard/login/sidebar) keeps its existing rose-600-on-stone Operate-mode look; logo mark: open-book icon
  in rose-600 square, paired with wordmark.
- Existing tagline (login page): "Your personal reading universe, organized."
- Marketing surface (`/`, `/about`, `/terms`) runs its own Persuade-mode visual world, chosen 2026-08-12: **Paper
  Lantern Study** — folded washi-paper lanterns glowing warm amber against a dark indigo ground; dark until read, lit
  once owned. See DESIGN.md sidecar for the marketing surface once documented.

## Evidence on Hand

- No user testimonials, case studies, or press. Do not fabricate.
- Real backend integration is in progress/complete per `docs/superpowers/plans/2026-08-05-backend-api-integration.md`
  and `docs/superpowers/plans/2026-08-11-book-author-crud-wiring.md`.

## Product Principles

- Capture speed wins: adding a book (scan or manual) must stay fast and low-friction.
- Personal, not social: no feed/reviews/social graph scope creep.
- Client trusts backend as source of truth; this app never assumes backend behavior beyond what's confirmed.
- Multi-tenant by account, single-tenant by experience: each user's UI feels like their own private library, not a
  shared/team tool.
