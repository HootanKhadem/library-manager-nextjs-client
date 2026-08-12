# Empty & Error States — Design Spec

**Date:** 2026-06-16
**Status:** Approved

---

## Overview

Add empty states, skeleton loading states, and error states (with retry) to every page. Wire the Dashboard and Lent pages to real backend API endpoints. Books and Authors pages keep static data but gain proper empty/error UI ready for future endpoints.

---

## Scope

### Pages in scope

| Page | Data source | Loading skeleton | Error state | Empty state |
|---|---|---|---|---|
| Dashboard — KPI cards (3) | Real API (3 endpoints) | Per-card skeleton | Inline error + retry | N/A (shows 0) |
| Dashboard — Recently Added | Real API | Table row skeletons | Inline error + retry | EmptyState (no books) |
| Dashboard — Recent Activity | Real API | List item skeletons | Inline error + retry | EmptyState (no activity) |
| Lent page | Real API | Card grid skeletons | Full-page error + retry | EmptyState (none lent) |
| Books page | Static data | N/A | ErrorState props (ready) | Contextual empty per filter |
| Authors page | Static data | N/A | ErrorState props (ready) | EmptyState (no authors) |

### Out of scope

- Settings page (no API data)
- Auth flows
- Modal components
- Add/edit book flows

---

## New UI Components

### `ErrorState`

Matches `EmptyState` signature. Red icon circle, heading, optional description, retry button.

```tsx
interface ErrorStateProps {
  heading?: string;          // default: "Something went wrong"
  description?: string;      // default: "Could not reach the server. Check your connection and try again."
  onRetry?: () => void;
  className?: string;
}
```

Visual: `var(--destructive)` tinted circle icon (`WifiOff` or `AlertTriangle`), same layout as `EmptyState`.

### `Skeleton`

Thin animated shimmer primitive.

```tsx
// <Skeleton className="h-4 w-32" /> — consumer controls dimensions
function Skeleton({ className }: { className?: string })
```

CSS: shimmer keyframe animation, `bg-stone-100` base, matches app neutral palette.

### Section-specific skeletons (co-located with pages, not shared)

- `KpiCardSkeleton` — 3-line placeholder matching KpiCard layout
- `RecentlyAddedSkeleton` — 4 table row placeholders
- `ActivitySkeleton` — 4 list item placeholders with dot + two lines
- `LentCardSkeleton` — card grid placeholder matching `LendCard`

---

## New Next.js Route Handlers

All handlers live in `src/app/api/`. They:
1. Forward the `access_token` cookie as `Authorization: Bearer <token>`
2. Proxy to `process.env.API_BASE_URL/<path>`
3. Return the backend response as-is on success
4. Return `503` with `{ message }` on network failure
5. Propagate non-2xx status codes from backend unchanged

### Routes

| Next.js route | Proxies to |
|---|---|
| `GET /api/dashboard/stats/books` | `GET /dashboard/stats/books` |
| `GET /api/dashboard/stats/lent-out` | `GET /dashboard/stats/lent-out` |
| `GET /api/dashboard/stats/overdue` | `GET /dashboard/stats/overdue` |
| `GET /api/dashboard/recently-added` | `GET /dashboard/recently-added?limit=5` |
| `GET /api/dashboard/recent-activity` | `GET /dashboard/recent-activity?limit=5` |
| `GET /api/lending/active` | `GET /api/lending/active` |

Token extraction: read `access_token` from `request.cookies`.

---

## Dashboard Data Fetching

`DashboardPage` becomes a client component that fires **5 independent fetches in parallel** on mount. Each section has its own `{ data, loading, error }` state tuple.

```tsx
// Pseudocode — actual hook pattern
const [bookStats, setBookStats] = useState<BookStatsState>({ data: null, loading: true, error: false });
// × 5 for each section
```

On retry: re-run the individual section's fetch only (not all 5).

### KPI card error variant

When a stat fails: card shows `AlertCircle` icon + "Failed to load" text + compact "Retry" button inline. Card border gets `border-[var(--destructive)]/40`. Other cards unaffected.

### Recently Added / Recent Activity error variant

Full `ErrorState` inside the card body, replacing the table/list.

---

## Lent Page Data Fetching

`LentPage` fetches `GET /api/lending/active` on mount.

Backend returns `Lending[]` shape:
```json
{ "id": 1, "bookId": 5, "memberId": 3, "lentDate": "...", "expectedReturnDate": "...", "status": "ACTIVE" }
```

Frontend maps to display shape. Fields not present in API response (book title, author, member name) are shown as `—` until backend enriches the endpoint.

States:
- Loading → `LentCardSkeleton` grid (4 skeleton cards)
- Error → full-page `ErrorState` with retry
- Empty → existing `EmptyState` (already present)
- Data → existing `LendCard` grid

---

## Empty State Copy (i18n)

New keys added to `common.errors` and per-page namespaces in both `en.ts` and `fa.ts`:

```ts
common: {
  // existing keys ...
  errorHeading: "Something went wrong",
  errorDescription: "Could not reach the server. Check your connection and try again.",
  retry: "Try again",
}

dashboard: {
  // existing keys ...
  kpiErrorShort: "Failed to load",
  recentlyAddedEmpty: "No books added yet",
  recentlyAddedEmptyDesc: "Books you add to your library will appear here.",
  activityEmpty: "No recent activity",
  activityEmptyDesc: "Activity appears when you lend or return books.",
}

lent: {
  // existing keys ...
  emptyOverdue: "No overdue books",   // for overdue filter empty
}

books: {
  // existing keys ...
  emptyFiltered: "No books match this filter",
  emptyFilteredDesc: "Try a different status filter.",
  emptyAll: "Your library is empty",
  emptyAllDesc: "Add your first book to get started.",
}

authors: {
  // existing keys ...
  emptyAuthors: "No authors yet",
  emptyAuthorsDesc: "Authors appear automatically as you add books.",
  emptyWorks: "No works found",
  emptyWorksDesc: "No books by this author in your collection.",
}
```

---

## Acceptance Criteria

### Functional

- [ ] Dashboard loads with skeleton placeholders on first render
- [ ] Each KPI card resolves independently; one failure does not block others
- [ ] Failed KPI card shows inline error + retry; successful cards show data
- [ ] Recently Added and Recent Activity sections show skeleton → data or error
- [ ] Retry button on any section re-fetches only that section
- [ ] Lent page shows skeleton grid while loading
- [ ] Lent page shows full-page error state with retry on API failure
- [ ] Books page (filtered, no results) shows contextual empty state copy
- [ ] Books page (all, no books) shows "Your library is empty" with Add CTA
- [ ] Authors page shows empty state when no authors present
- [ ] Authors page — Complete Works table shows empty state when no works
- [ ] All error states are visually consistent (same `ErrorState` component)
- [ ] All empty states are visually consistent (same `EmptyState` component)

### Unit Tests

- [ ] `ErrorState` renders heading, description, and retry button; calls `onRetry` on click
- [ ] `Skeleton` renders with correct class
- [ ] `KpiCardSkeleton`, `RecentlyAddedSkeleton`, `ActivitySkeleton`, `LentCardSkeleton` render without errors
- [ ] Each dashboard route handler: returns proxied response on success; returns 503 on network failure; returns 401 when backend returns 401
- [ ] `DashboardPage`: shows skeletons on load; shows data when all fetches resolve; shows `ErrorState` per section when individual fetch fails; retry re-fetches only that section
- [ ] `LentPage`: shows skeletons while loading; shows error state on failure; shows empty state when response is empty array; shows cards when data present
- [ ] `BooksPage`: shows "Your library is empty" when books prop is empty; shows "No books match this filter" when filter yields no results
- [ ] `AuthorsPage`: shows empty state when authors prop is empty; shows empty state in works table when borgesWorks prop is empty
- [ ] All existing page tests continue to pass

### Visual

- [ ] Skeleton shimmer animation matches stone neutral palette
- [ ] Error state icon circle uses `var(--destructive)` tint — matches existing destructive color usage
- [ ] Empty state icon circle uses `bg-stone-100` — matches existing `EmptyState` component
- [ ] Retry button uses existing `Button` component (`variant="secondary"`, `size="sm"`)
- [ ] No layout shift between skeleton and loaded state

---

## Files Changed

**New files:**
- `src/components/ui/ErrorState.tsx`
- `src/components/ui/Skeleton.tsx`
- `src/app/api/dashboard/stats/books/route.ts`
- `src/app/api/dashboard/stats/lent-out/route.ts`
- `src/app/api/dashboard/stats/overdue/route.ts`
- `src/app/api/dashboard/recently-added/route.ts`
- `src/app/api/dashboard/recent-activity/route.ts`
- `src/app/api/lending/active/route.ts`
- `src/__tests__/ui/ErrorState.test.tsx`
- `src/__tests__/ui/Skeleton.test.tsx`
- `src/__tests__/api/dashboard/` (5 route tests)
- `src/__tests__/api/lending/active.route.test.ts`

**Modified files:**
- `src/components/ui/index.ts` — export ErrorState, Skeleton
- `src/components/pages/DashboardPage.tsx` — add fetch hooks, skeleton, error states
- `src/components/pages/LentPage.tsx` — add fetch hook, skeleton, error state
- `src/components/pages/BooksPage.tsx` — improve empty state copy, add isError/onRetry props
- `src/components/pages/AuthorsPage.tsx` — add empty states, isError/onRetry props
- `src/lib/i18n/translations/en.ts` — new keys
- `src/lib/i18n/translations/fa.ts` — new keys
- `src/lib/i18n/types.ts` — new key types
- `src/__tests__/DashboardPage.test.tsx` — new test cases
- `src/__tests__/LentPage.test.tsx` — new test cases
- `src/__tests__/BooksPage.test.tsx` — new test cases
