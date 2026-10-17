# toumaar PWA — Design

## Goal

Make toumaar installable on supported devices. When offline, opening the app shows a branded reconnect page. Book and account data remain online-only.

## Decisions

- Use Next.js App Router `manifest.ts` and a small first-party service worker; no PWA dependency.
- Use existing rose/stone brand and open-book mark for install icons, including a maskable icon and Apple touch icon.
- Register the worker from the root layout in browsers that support service workers.
- Cache only the static offline page and its icon assets. For document navigations, try network first; on network failure, show the offline page.
- Never cache API responses, authenticated documents, RSC requests, or user book data. Mutations have no offline queue.
- Do not add push notifications or a custom install prompt.

## Components and data flow

`manifest.ts` supplies install metadata. `PwaRegistration.tsx` registers `/sw.js` after hydration. The worker preloads `/offline.html` and brand icons during installation. For navigation requests, it returns the live response; if network fails, it returns cached offline HTML. All other requests bypass the worker.

## Verification

Check manifest fields and icons; test worker navigation fallback and cache exclusions; run typecheck, lint, Jest, and production build. Browser install requires HTTPS in production (localhost works in development).
