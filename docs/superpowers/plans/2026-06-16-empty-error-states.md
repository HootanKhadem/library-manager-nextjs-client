# Empty & Error States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add skeleton loading, contextual empty states, and error states with retry to every page; wire Dashboard and Lent pages to real backend API endpoints.

**Architecture:** Dashboard page fires 5 independent client-side fetches on mount (one per section), each with its own loading/error/data state so failures are isolated. Lent page fetches from `/api/lending/active`. All new Next.js route handlers proxy to `API_BASE_URL` using the `access_token` cookie as a Bearer token, matching the auth route pattern. Books and Authors pages keep static data but receive proper empty/error UI ready for future endpoints.

**Tech Stack:** Next.js 14 App Router, React hooks (`useState`, `useEffect`, `useCallback`), TypeScript, Tailwind CSS, Lucide icons, Jest + React Testing Library

---

## File Map

**New files:**
- `src/components/ui/Skeleton.tsx` — shimmer primitive
- `src/components/ui/ErrorState.tsx` — error display with retry button
- `src/app/api/dashboard/stats/books/route.ts`
- `src/app/api/dashboard/stats/lent-out/route.ts`
- `src/app/api/dashboard/stats/overdue/route.ts`
- `src/app/api/dashboard/recently-added/route.ts`
- `src/app/api/dashboard/recent-activity/route.ts`
- `src/app/api/lending/active/route.ts`
- `src/__tests__/ui/Skeleton.test.tsx`
- `src/__tests__/ui/ErrorState.test.tsx`
- `src/__tests__/api/dashboard/stats-books.route.test.ts`
- `src/__tests__/api/dashboard/stats-lent-out.route.test.ts`
- `src/__tests__/api/dashboard/stats-overdue.route.test.ts`
- `src/__tests__/api/dashboard/recently-added.route.test.ts`
- `src/__tests__/api/dashboard/recent-activity.route.test.ts`
- `src/__tests__/api/lending/active.route.test.ts`

**Modified files:**
- `src/lib/types.ts` — add `BookStats`, `LentOutStats`, `OverdueStats`, `DashboardBook`, `ActivityEntry`, `ActiveLending`
- `src/lib/i18n/types.ts` — add new translation keys
- `src/lib/i18n/translations/en.ts` — add translations
- `src/lib/i18n/translations/fa.ts` — add translations
- `src/components/ui/index.ts` — export `Skeleton`, `ErrorState`
- `src/components/pages/DashboardPage.tsx` — full refactor: 5 fetch hooks, skeletons, error states, remove `books` prop
- `src/app/(app)/dashboard/page.tsx` — remove `books`/`filtered` props (DashboardPage self-fetches)
- `src/components/pages/LentPage.tsx` — add fetch hook, skeleton grid, error state, adapt to `ActiveLending[]`
- `src/app/(app)/lent/page.tsx` — remove static data fetch (LentPage self-fetches)
- `src/components/pages/BooksPage.tsx` — contextual empty states, add `isError`/`onRetry` props
- `src/components/pages/AuthorsPage.tsx` — add empty states, add `isError`/`onRetry` props
- `src/__tests__/DashboardPage.test.tsx` — rewrite for fetch-based component
- `src/__tests__/LentPage.test.tsx` — rewrite for fetch-based component
- `src/__tests__/BooksPage.test.tsx` — add new test cases

---

## Task 1: Add types for API responses

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add API response types**

Open `src/lib/types.ts` and append after the last existing export:

```ts
// ── Dashboard API response types ────────────────────────────────────────────

export interface BookStats {
    totalBooks: number;
    addedThisMonth: number;
}

export interface LentOutStats {
    totalLentOut: number;
    uniqueLendees: number;
}

export interface OverdueStats {
    totalOverdue: number;
}

export interface DashboardBook {
    id: number;
    name: string;
    author: string;
    genre: string | null;
    status: string | null;
    rating: number | null;
}

export interface ActivityEntry {
    id: number;
    action: "LENT" | "RETURNED" | "ADDED" | "REMOVED" | "UPDATED";
    bookName: string | null;
    memberName: string | null;
    occurredAt: string | null;
}

// ── Lending API response type ────────────────────────────────────────────────

export interface ActiveLending {
    id: number;
    bookId: number;
    memberId: number;
    userId: number | null;
    lentDate: string;
    expectedReturnDate: string | null;
    actualReturnDate: string | null;
    status: "ACTIVE" | "OVERDUE" | "RETURNED";
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add API response types for dashboard and lending"
```

---

## Task 2: Add i18n keys

**Files:**
- Modify: `src/lib/i18n/types.ts`
- Modify: `src/lib/i18n/translations/en.ts`
- Modify: `src/lib/i18n/translations/fa.ts`

- [ ] **Step 1: Add key shapes to `types.ts`**

In `src/lib/i18n/types.ts`, update each interface section:

```ts
// In common:
common: {
    search: string;
    searchPlaceholder: string;
    close: string;
    cancel: string;
    save: string;
    reset: string;
    delete: string;
    add: string;
    all: string;
    loading: string;
    noResults: string;
    overdue: string;
    dash: string;
    // ── NEW ──
    errorHeading: string;
    errorDescription: string;
    retry: string;
};

// In dashboard — append after existing colRating, activityReturned:
dashboard: {
    // ... existing keys ...
    activityReturned: string;
    // ── NEW ──
    kpiErrorShort: string;
    recentlyAddedEmpty: string;
    recentlyAddedEmptyDesc: string;
    activityEmpty: string;
    activityEmptyDesc: string;
};

// In lent — append after existing emptyState:
lent: {
    // ... existing keys ...
    emptyState: string;
    // ── NEW ──
    emptyOverdue: string;
};

// In books — append after existing colRating:
books: {
    // ... existing keys ...
    colRating: string;
    // ── NEW ──
    emptyFiltered: string;
    emptyFilteredDesc: string;
    emptyAll: string;
    emptyAllDesc: string;
};

// In authors — append after existing colNotes:
authors: {
    // ... existing keys ...
    colNotes: string;
    // ── NEW ──
    emptyAuthors: string;
    emptyAuthorsDesc: string;
    emptyWorks: string;
    emptyWorksDesc: string;
};
```

- [ ] **Step 2: Add English translations**

In `src/lib/i18n/translations/en.ts`, add to `common`:

```ts
errorHeading: "Something went wrong",
errorDescription: "Could not reach the server. Check your connection and try again.",
retry: "Try again",
```

Add to `dashboard`:

```ts
kpiErrorShort: "Failed to load",
recentlyAddedEmpty: "No books added yet",
recentlyAddedEmptyDesc: "Books you add to your library will appear here.",
activityEmpty: "No recent activity",
activityEmptyDesc: "Activity appears when you lend or return books.",
```

Add to `lent`:

```ts
emptyOverdue: "No overdue books",
```

Add to `books`:

```ts
emptyFiltered: "No books match this filter",
emptyFilteredDesc: "Try a different status filter.",
emptyAll: "Your library is empty",
emptyAllDesc: "Add your first book to get started.",
```

Add to `authors`:

```ts
emptyAuthors: "No authors yet",
emptyAuthorsDesc: "Authors appear automatically as you add books.",
emptyWorks: "No works found",
emptyWorksDesc: "No books by this author in your collection.",
```

- [ ] **Step 3: Add Persian translations**

In `src/lib/i18n/translations/fa.ts`, add to `common`:

```ts
errorHeading: "مشکلی پیش آمد",
errorDescription: "اتصال به سرور ممکن نشد. اتصال اینترنت خود را بررسی و دوباره تلاش کنید.",
retry: "تلاش مجدد",
```

Add to `dashboard`:

```ts
kpiErrorShort: "بارگذاری ناموفق",
recentlyAddedEmpty: "هنوز کتابی اضافه نشده",
recentlyAddedEmptyDesc: "کتاب‌هایی که اضافه می‌کنید اینجا نمایش داده می‌شوند.",
activityEmpty: "فعالیت اخیری وجود ندارد",
activityEmptyDesc: "فعالیت‌ها پس از امانت یا بازگشت کتاب نمایش داده می‌شوند.",
```

Add to `lent`:

```ts
emptyOverdue: "هیچ کتاب دیرکردی وجود ندارد",
```

Add to `books`:

```ts
emptyFiltered: "کتابی با این فیلتر یافت نشد",
emptyFilteredDesc: "فیلتر وضعیت دیگری را امتحان کنید.",
emptyAll: "کتابخانه شما خالی است",
emptyAllDesc: "اولین کتاب خود را اضافه کنید.",
```

Add to `authors`:

```ts
emptyAuthors: "هنوز نویسنده‌ای ثبت نشده",
emptyAuthorsDesc: "نویسندگان با افزودن کتاب‌ها به‌طور خودکار نمایش داده می‌شوند.",
emptyWorks: "اثری یافت نشد",
emptyWorksDesc: "هیچ کتابی از این نویسنده در مجموعه شما وجود ندارد.",
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (both `en.ts` and `fa.ts` must satisfy the updated `Translations` interface).

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/types.ts src/lib/i18n/translations/en.ts src/lib/i18n/translations/fa.ts
git commit -m "feat(i18n): add error, empty state, and retry translation keys"
```

---

## Task 3: Skeleton component

**Files:**
- Create: `src/components/ui/Skeleton.tsx`
- Create: `src/__tests__/ui/Skeleton.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/ui/Skeleton.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { Skeleton } from "@/src/components/ui/Skeleton";

describe("Skeleton", () => {
    it("renders a div with animate-pulse class", () => {
        const { container } = render(<Skeleton />);
        const el = container.firstChild as HTMLElement;
        expect(el.tagName).toBe("DIV");
        expect(el).toHaveClass("animate-pulse");
    });

    it("applies extra className alongside base classes", () => {
        const { container } = render(<Skeleton className="h-4 w-32" />);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass("h-4", "w-32", "animate-pulse");
    });

    it("has aria-hidden to hide from screen readers", () => {
        const { container } = render(<Skeleton />);
        expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/ui/Skeleton.test.tsx --no-coverage
```

Expected: FAIL — `Skeleton` not found.

- [ ] **Step 3: Implement Skeleton**

Create `src/components/ui/Skeleton.tsx`:

```tsx
interface SkeletonProps {
    className?: string;
}

function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div
            aria-hidden="true"
            className={["animate-pulse rounded bg-stone-100", className].join(" ")}
        />
    );
}

export { Skeleton };
export type { SkeletonProps };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/ui/Skeleton.test.tsx --no-coverage
```

Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Skeleton.tsx src/__tests__/ui/Skeleton.test.tsx
git commit -m "feat(ui): add Skeleton shimmer component"
```

---

## Task 4: ErrorState component

**Files:**
- Create: `src/components/ui/ErrorState.tsx`
- Create: `src/__tests__/ui/ErrorState.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/ui/ErrorState.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorState } from "@/src/components/ui/ErrorState";

describe("ErrorState", () => {
    it("renders default heading when none provided", () => {
        render(<ErrorState />);
        expect(screen.getByRole("heading")).toHaveTextContent("Something went wrong");
    });

    it("renders custom heading", () => {
        render(<ErrorState heading="Failed to load books" />);
        expect(screen.getByRole("heading")).toHaveTextContent("Failed to load books");
    });

    it("renders description when provided", () => {
        render(<ErrorState description="Network error occurred." />);
        expect(screen.getByText("Network error occurred.")).toBeInTheDocument();
    });

    it("does not render description when omitted", () => {
        const { container } = render(<ErrorState heading="Error" />);
        expect(container.querySelectorAll("p").length).toBe(0);
    });

    it("renders retry button when onRetry provided", () => {
        render(<ErrorState onRetry={() => {}} />);
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("does not render retry button when onRetry omitted", () => {
        render(<ErrorState />);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("calls onRetry when retry button clicked", () => {
        const onRetry = jest.fn();
        render(<ErrorState onRetry={onRetry} retryLabel="Retry" />);
        fireEvent.click(screen.getByRole("button"));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("uses retryLabel prop as button text", () => {
        render(<ErrorState onRetry={() => {}} retryLabel="Reload" />);
        expect(screen.getByRole("button")).toHaveTextContent("Reload");
    });

    it("applies extra className", () => {
        const { container } = render(<ErrorState className="py-10" />);
        expect(container.firstChild).toHaveClass("py-10");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/ui/ErrorState.test.tsx --no-coverage
```

Expected: FAIL — `ErrorState` not found.

- [ ] **Step 3: Implement ErrorState**

Create `src/components/ui/ErrorState.tsx`:

```tsx
import { WifiOff } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

interface ErrorStateProps {
    heading?: string;
    description?: string;
    retryLabel?: string;
    onRetry?: () => void;
    className?: string;
}

function ErrorState({
    heading = "Something went wrong",
    description,
    retryLabel = "Try again",
    onRetry,
    className = "",
}: ErrorStateProps) {
    return (
        <div
            className={[
                "flex flex-col items-center justify-center gap-3 py-16 text-center",
                className,
            ].join(" ")}
        >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[var(--destructive)]">
                <WifiOff className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">{heading}</h3>
                {description && (
                    <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
                )}
            </div>
            {onRetry && (
                <div className="mt-1">
                    <Button variant="secondary" size="sm" onClick={onRetry}>
                        {retryLabel}
                    </Button>
                </div>
            )}
        </div>
    );
}

export { ErrorState };
export type { ErrorStateProps };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/ui/ErrorState.test.tsx --no-coverage
```

Expected: PASS — 9 tests.

- [ ] **Step 5: Export from ui/index.ts**

Open `src/components/ui/index.ts` and add:

```ts
export { Skeleton } from "./Skeleton";
export type { SkeletonProps } from "./Skeleton";
export { ErrorState } from "./ErrorState";
export type { ErrorStateProps } from "./ErrorState";
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/ErrorState.tsx src/__tests__/ui/ErrorState.test.tsx src/components/ui/index.ts
git commit -m "feat(ui): add ErrorState component with retry button"
```

---

## Task 5: Dashboard stats/books route handler

**Files:**
- Create: `src/app/api/dashboard/stats/books/route.ts`
- Create: `src/__tests__/api/dashboard/stats-books.route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/dashboard/stats-books.route.test.ts`:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/dashboard/stats/books/route";

function makeReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/dashboard/stats/books", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/dashboard/stats/books", () => {
    beforeEach(() => {
        process.env.API_BASE_URL = "http://backend";
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq());
        expect(res.status).toBe(401);
    });

    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ totalBooks: 12, addedThisMonth: 3 }),
        });
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ totalBooks: 12, addedThisMonth: 3 });
    });

    it("sends Authorization: Bearer header to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ totalBooks: 0, addedThisMonth: 0 }),
        });
        await GET(makeReq("my-token"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Authorization).toBe("Bearer my-token");
    });

    it("returns 503 when backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.message).toMatch(/unable to reach/i);
    });

    it("propagates non-200 status from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ message: "Unauthorized" }),
        });
        const res = await GET(makeReq("bad-tok"));
        expect(res.status).toBe(401);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/api/dashboard/stats-books.route.test.ts --no-coverage
```

Expected: FAIL — route file not found.

- [ ] **Step 3: Implement the route**

Create `src/app/api/dashboard/stats/books/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/dashboard/stats/books`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json(
            { message: "Unable to reach the server. Please try again." },
            { status: 503 }
        );
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/api/dashboard/stats-books.route.test.ts --no-coverage
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/dashboard/stats/books/route.ts src/__tests__/api/dashboard/stats-books.route.test.ts
git commit -m "feat(api): add GET /api/dashboard/stats/books proxy route"
```

---

## Task 6: Dashboard stats/lent-out route handler

**Files:**
- Create: `src/app/api/dashboard/stats/lent-out/route.ts`
- Create: `src/__tests__/api/dashboard/stats-lent-out.route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/dashboard/stats-lent-out.route.test.ts`:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/dashboard/stats/lent-out/route";

function makeReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/dashboard/stats/lent-out", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/dashboard/stats/lent-out", () => {
    beforeEach(() => {
        process.env.API_BASE_URL = "http://backend";
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq());
        expect(res.status).toBe(401);
    });

    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ totalLentOut: 5, uniqueLendees: 3 }),
        });
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ totalLentOut: 5, uniqueLendees: 3 });
    });

    it("sends Authorization: Bearer header to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ totalLentOut: 0, uniqueLendees: 0 }),
        });
        await GET(makeReq("my-token"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Authorization).toBe("Bearer my-token");
    });

    it("returns 503 when backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.message).toMatch(/unable to reach/i);
    });

    it("propagates non-200 status from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ message: "Unauthorized" }),
        });
        const res = await GET(makeReq("bad-tok"));
        expect(res.status).toBe(401);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/api/dashboard/stats-lent-out.route.test.ts --no-coverage
```

Expected: FAIL — route file not found.

- [ ] **Step 3: Implement the route**

Create `src/app/api/dashboard/stats/lent-out/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/dashboard/stats/lent-out`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json(
            { message: "Unable to reach the server. Please try again." },
            { status: 503 }
        );
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/api/dashboard/stats-lent-out.route.test.ts --no-coverage
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/dashboard/stats/lent-out/route.ts src/__tests__/api/dashboard/stats-lent-out.route.test.ts
git commit -m "feat(api): add GET /api/dashboard/stats/lent-out proxy route"
```

---

## Task 7: Dashboard stats/overdue route handler

**Files:**
- Create: `src/app/api/dashboard/stats/overdue/route.ts`
- Create: `src/__tests__/api/dashboard/stats-overdue.route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/dashboard/stats-overdue.route.test.ts`:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/dashboard/stats/overdue/route";

function makeReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/dashboard/stats/overdue", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/dashboard/stats/overdue", () => {
    beforeEach(() => {
        process.env.API_BASE_URL = "http://backend";
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq());
        expect(res.status).toBe(401);
    });

    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ totalOverdue: 2 }),
        });
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ totalOverdue: 2 });
    });

    it("sends Authorization: Bearer header to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ totalOverdue: 0 }),
        });
        await GET(makeReq("my-token"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Authorization).toBe("Bearer my-token");
    });

    it("returns 503 when backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.message).toMatch(/unable to reach/i);
    });

    it("propagates non-200 status from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ message: "Unauthorized" }),
        });
        const res = await GET(makeReq("bad-tok"));
        expect(res.status).toBe(401);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/api/dashboard/stats-overdue.route.test.ts --no-coverage
```

Expected: FAIL — route file not found.

- [ ] **Step 3: Implement the route**

Create `src/app/api/dashboard/stats/overdue/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/dashboard/stats/overdue`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json(
            { message: "Unable to reach the server. Please try again." },
            { status: 503 }
        );
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/api/dashboard/stats-overdue.route.test.ts --no-coverage
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/dashboard/stats/overdue/route.ts src/__tests__/api/dashboard/stats-overdue.route.test.ts
git commit -m "feat(api): add GET /api/dashboard/stats/overdue proxy route"
```

---

## Task 8: Dashboard recently-added route handler

**Files:**
- Create: `src/app/api/dashboard/recently-added/route.ts`
- Create: `src/__tests__/api/dashboard/recently-added.route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/dashboard/recently-added.route.test.ts`:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/dashboard/recently-added/route";

const MOCK_BOOKS = [
    { id: 1, name: "Dune", author: "Herbert", genre: "Sci-Fi", status: "OWNED", rating: 5 },
];

function makeReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/dashboard/recently-added", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/dashboard/recently-added", () => {
    beforeEach(() => {
        process.env.API_BASE_URL = "http://backend";
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq());
        expect(res.status).toBe(401);
    });

    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve(MOCK_BOOKS),
        });
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(MOCK_BOOKS);
    });

    it("forwards limit=5 query param to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
        });
        await GET(makeReq("tok"));
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("limit=5");
    });

    it("sends Authorization: Bearer header to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
        });
        await GET(makeReq("my-token"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Authorization).toBe("Bearer my-token");
    });

    it("returns 503 when backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.message).toMatch(/unable to reach/i);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/api/dashboard/recently-added.route.test.ts --no-coverage
```

Expected: FAIL — route file not found.

- [ ] **Step 3: Implement the route**

Create `src/app/api/dashboard/recently-added/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let res: Response;
    try {
        res = await fetch(
            `${process.env.API_BASE_URL}/dashboard/recently-added?limit=5`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
    } catch {
        return NextResponse.json(
            { message: "Unable to reach the server. Please try again." },
            { status: 503 }
        );
    }

    const data = await res.json().catch(() => []);
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/api/dashboard/recently-added.route.test.ts --no-coverage
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/dashboard/recently-added/route.ts src/__tests__/api/dashboard/recently-added.route.test.ts
git commit -m "feat(api): add GET /api/dashboard/recently-added proxy route"
```

---

## Task 9: Dashboard recent-activity route handler

**Files:**
- Create: `src/app/api/dashboard/recent-activity/route.ts`
- Create: `src/__tests__/api/dashboard/recent-activity.route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/dashboard/recent-activity.route.test.ts`:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/dashboard/recent-activity/route";

const MOCK_ACTIVITY = [
    { id: 1, action: "LENT", bookName: "Dune", memberName: "Jane", occurredAt: "2026-06-01T10:00:00" },
];

function makeReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/dashboard/recent-activity", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/dashboard/recent-activity", () => {
    beforeEach(() => {
        process.env.API_BASE_URL = "http://backend";
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq());
        expect(res.status).toBe(401);
    });

    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve(MOCK_ACTIVITY),
        });
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(MOCK_ACTIVITY);
    });

    it("forwards limit=5 query param to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
        });
        await GET(makeReq("tok"));
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("limit=5");
    });

    it("sends Authorization: Bearer header to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
        });
        await GET(makeReq("my-token"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Authorization).toBe("Bearer my-token");
    });

    it("returns 503 when backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.message).toMatch(/unable to reach/i);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/api/dashboard/recent-activity.route.test.ts --no-coverage
```

Expected: FAIL — route file not found.

- [ ] **Step 3: Implement the route**

Create `src/app/api/dashboard/recent-activity/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let res: Response;
    try {
        res = await fetch(
            `${process.env.API_BASE_URL}/dashboard/recent-activity?limit=5`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
    } catch {
        return NextResponse.json(
            { message: "Unable to reach the server. Please try again." },
            { status: 503 }
        );
    }

    const data = await res.json().catch(() => []);
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/api/dashboard/recent-activity.route.test.ts --no-coverage
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/dashboard/recent-activity/route.ts src/__tests__/api/dashboard/recent-activity.route.test.ts
git commit -m "feat(api): add GET /api/dashboard/recent-activity proxy route"
```

---

## Task 10: Lending active route handler

**Files:**
- Create: `src/app/api/lending/active/route.ts`
- Create: `src/__tests__/api/lending/active.route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/lending/active.route.test.ts`:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/lending/active/route";

const MOCK_LENDINGS = [
    {
        id: 1, bookId: 5, memberId: 3, userId: 42,
        lentDate: "2026-06-01", expectedReturnDate: "2026-07-01",
        actualReturnDate: null, status: "ACTIVE",
    },
];

function makeReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/lending/active", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/lending/active", () => {
    beforeEach(() => {
        process.env.API_BASE_URL = "http://backend";
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq());
        expect(res.status).toBe(401);
    });

    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve(MOCK_LENDINGS),
        });
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(MOCK_LENDINGS);
    });

    it("sends Authorization: Bearer header to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
        });
        await GET(makeReq("my-token"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Authorization).toBe("Bearer my-token");
    });

    it("returns 503 when backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.message).toMatch(/unable to reach/i);
    });

    it("propagates non-200 status from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ message: "Unauthorized" }),
        });
        const res = await GET(makeReq("bad-tok"));
        expect(res.status).toBe(401);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/api/lending/active.route.test.ts --no-coverage
```

Expected: FAIL — route file not found.

- [ ] **Step 3: Implement the route**

Create `src/app/api/lending/active/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/lending/active`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json(
            { message: "Unable to reach the server. Please try again." },
            { status: 503 }
        );
    }

    const data = await res.json().catch(() => []);
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/api/lending/active.route.test.ts --no-coverage
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/lending/active/route.ts src/__tests__/api/lending/active.route.test.ts
git commit -m "feat(api): add GET /api/lending/active proxy route"
```

---

## Task 11: DashboardPage refactor

**Files:**
- Modify: `src/components/pages/DashboardPage.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/__tests__/DashboardPage.test.tsx`

- [ ] **Step 1: Write new DashboardPage tests**

Replace the contents of `src/__tests__/DashboardPage.test.tsx` with:

```tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import DashboardPage from "@/src/components/pages/DashboardPage";

const MOCK_BOOK_STATS = { totalBooks: 10, addedThisMonth: 2 };
const MOCK_LENT_STATS = { totalLentOut: 3, uniqueLendees: 2 };
const MOCK_OVERDUE_STATS = { totalOverdue: 1 };
const MOCK_RECENT_BOOKS = [
    { id: 1, name: "Dune", author: "Herbert", genre: "Sci-Fi", status: "OWNED", rating: 5 },
];
const MOCK_ACTIVITY = [
    { id: 1, action: "ADDED", bookName: "Dune", memberName: null, occurredAt: "2026-06-01T10:00:00" },
];

function mockFetch(responses: Record<string, unknown>) {
    global.fetch = jest.fn((url: string) => {
        const key = Object.keys(responses).find((k) => url.includes(k));
        if (key) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(responses[key]),
            });
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    }) as jest.Mock;
}

function allSuccessResponses() {
    mockFetch({
        "stats/books": MOCK_BOOK_STATS,
        "stats/lent-out": MOCK_LENT_STATS,
        "stats/overdue": MOCK_OVERDUE_STATS,
        "recently-added": MOCK_RECENT_BOOKS,
        "recent-activity": MOCK_ACTIVITY,
    });
}

describe("DashboardPage", () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("renders page without crashing", () => {
        allSuccessResponses();
        render(<DashboardPage onViewAll={jest.fn()} />);
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    });

    it("shows book count after stats/books resolves", async () => {
        allSuccessResponses();
        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("10")).toBeInTheDocument();
        });
    });

    it("shows lent count after stats/lent-out resolves", async () => {
        allSuccessResponses();
        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("3")).toBeInTheDocument();
        });
    });

    it("shows overdue count after stats/overdue resolves", async () => {
        allSuccessResponses();
        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("1")).toBeInTheDocument();
        });
    });

    it("shows recently added book after recently-added resolves", async () => {
        allSuccessResponses();
        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("Dune")).toBeInTheDocument();
        });
    });

    it("shows activity entry after recent-activity resolves", async () => {
        allSuccessResponses();
        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText(/Dune/)).toBeInTheDocument();
        });
    });

    it("shows error state for stats/books when that fetch fails", async () => {
        global.fetch = jest.fn((url: string) => {
            if (url.includes("stats/books")) return Promise.reject(new Error("fail"));
            if (url.includes("stats/lent-out")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_LENT_STATS) });
            if (url.includes("stats/overdue")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_OVERDUE_STATS) });
            if (url.includes("recently-added")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_RECENT_BOOKS) });
            if (url.includes("recent-activity")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_ACTIVITY) });
            return Promise.reject(new Error("unexpected"));
        }) as jest.Mock;

        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getAllByText(/Failed to load/).length).toBeGreaterThan(0);
        });
        expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("shows error state for recently-added when that fetch fails", async () => {
        global.fetch = jest.fn((url: string) => {
            if (url.includes("recently-added")) return Promise.reject(new Error("fail"));
            if (url.includes("stats/books")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_BOOK_STATS) });
            if (url.includes("stats/lent-out")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_LENT_STATS) });
            if (url.includes("stats/overdue")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_OVERDUE_STATS) });
            if (url.includes("recent-activity")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_ACTIVITY) });
            return Promise.reject(new Error("unexpected"));
        }) as jest.Mock;

        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        });
        expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("shows retry button for recently-added error and re-fetches on click", async () => {
        let callCount = 0;
        global.fetch = jest.fn((url: string) => {
            if (url.includes("recently-added")) {
                callCount++;
                if (callCount === 1) return Promise.reject(new Error("fail"));
                return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_RECENT_BOOKS) });
            }
            if (url.includes("stats/books")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_BOOK_STATS) });
            if (url.includes("stats/lent-out")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_LENT_STATS) });
            if (url.includes("stats/overdue")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_OVERDUE_STATS) });
            if (url.includes("recent-activity")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_ACTIVITY) });
            return Promise.reject(new Error("unexpected"));
        }) as jest.Mock;

        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole("button", { name: /try again/i }));
        await waitFor(() => {
            expect(screen.getByText("Dune")).toBeInTheDocument();
        });
    });

    it("shows empty state when recently-added returns empty array", async () => {
        mockFetch({
            "stats/books": MOCK_BOOK_STATS,
            "stats/lent-out": MOCK_LENT_STATS,
            "stats/overdue": MOCK_OVERDUE_STATS,
            "recently-added": [],
            "recent-activity": MOCK_ACTIVITY,
        });
        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("No books added yet")).toBeInTheDocument();
        });
    });

    it("shows empty state when recent-activity returns empty array", async () => {
        mockFetch({
            "stats/books": MOCK_BOOK_STATS,
            "stats/lent-out": MOCK_LENT_STATS,
            "stats/overdue": MOCK_OVERDUE_STATS,
            "recently-added": MOCK_RECENT_BOOKS,
            "recent-activity": [],
        });
        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("No recent activity")).toBeInTheDocument();
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/DashboardPage.test.tsx --no-coverage
```

Expected: FAIL — tests reference a `DashboardPage` that still takes `books` prop.

- [ ] **Step 3: Rewrite DashboardPage**

Replace the full contents of `src/components/pages/DashboardPage.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Bookmark, AlertCircle, Activity } from "lucide-react";
import {
    BookStats, LentOutStats, OverdueStats, DashboardBook, ActivityEntry,
} from "@/src/lib/types";
import { useLanguage } from "@/src/lib/i18n/context";
import { Card, CardHeader, CardBody } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { DataTable, DataTableHead, DataTableBody, DataTableRow, Th, Td } from "@/src/components/ui/DataTable";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { StarRating } from "@/src/components/ui/StarRating";
import { GenreTag } from "@/src/components/ui/GenreTag";
import { PageHeader } from "@/src/components/ui/Topbar";

interface SectionState<T> {
    data: T | null;
    loading: boolean;
    error: boolean;
}

function initialState<T>(): SectionState<T> {
    return { data: null, loading: true, error: false };
}

interface DashboardPageProps {
    onViewAll: () => void;
}

async function fetchSection<T>(
    url: string,
    setState: React.Dispatch<React.SetStateAction<SectionState<T>>>
) {
    setState({ data: null, loading: true, error: false });
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("non-ok");
        const data: T = await res.json();
        setState({ data, loading: false, error: false });
    } catch {
        setState({ data: null, loading: false, error: true });
    }
}

export default function DashboardPage({ onViewAll }: DashboardPageProps) {
    const { t } = useLanguage();

    const [bookStats, setBookStats] = useState<SectionState<BookStats>>(initialState());
    const [lentStats, setLentStats] = useState<SectionState<LentOutStats>>(initialState());
    const [overdueStats, setOverdueStats] = useState<SectionState<OverdueStats>>(initialState());
    const [recentBooks, setRecentBooks] = useState<SectionState<DashboardBook[]>>(initialState());
    const [activity, setActivity] = useState<SectionState<ActivityEntry[]>>(initialState());

    const loadBookStats = useCallback(
        () => fetchSection<BookStats>("/api/dashboard/stats/books", setBookStats), []
    );
    const loadLentStats = useCallback(
        () => fetchSection<LentOutStats>("/api/dashboard/stats/lent-out", setLentStats), []
    );
    const loadOverdueStats = useCallback(
        () => fetchSection<OverdueStats>("/api/dashboard/stats/overdue", setOverdueStats), []
    );
    const loadRecentBooks = useCallback(
        () => fetchSection<DashboardBook[]>("/api/dashboard/recently-added", setRecentBooks), []
    );
    const loadActivity = useCallback(
        () => fetchSection<ActivityEntry[]>("/api/dashboard/recent-activity", setActivity), []
    );

    useEffect(() => {
        loadBookStats();
        loadLentStats();
        loadOverdueStats();
        loadRecentBooks();
        loadActivity();
    }, [loadBookStats, loadLentStats, loadOverdueStats, loadRecentBooks, loadActivity]);

    return (
        <div data-testid="dashboard-page">
            <PageHeader
                title={`${t.dashboard.greeting} ${t.dashboard.greetingName}`}
                subtitle={t.dashboard.greetingSubtitle}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <KpiCard
                    label={t.dashboard.kpiTotalBooks}
                    value={bookStats.data?.totalBooks}
                    sub={bookStats.data ? `${bookStats.data.addedThisMonth} added this month` : t.dashboard.kpiTotalSub}
                    icon={<BookOpen className="h-5 w-5" />}
                    accentColor="var(--accent)"
                    loading={bookStats.loading}
                    error={bookStats.error}
                    onRetry={loadBookStats}
                    errorLabel={t.dashboard.kpiErrorShort}
                    retryLabel={t.common.retry}
                />
                <KpiCard
                    label={t.dashboard.kpiLent}
                    value={lentStats.data?.totalLentOut}
                    sub={lentStats.data ? `Across ${lentStats.data.uniqueLendees} people` : t.dashboard.kpiLentSub}
                    icon={<Bookmark className="h-5 w-5" />}
                    accentColor="var(--warning)"
                    loading={lentStats.loading}
                    error={lentStats.error}
                    onRetry={loadLentStats}
                    errorLabel={t.dashboard.kpiErrorShort}
                    retryLabel={t.common.retry}
                />
                <KpiCard
                    label={t.dashboard.kpiOverdue}
                    value={overdueStats.data?.totalOverdue}
                    sub={t.dashboard.kpiOverdueSub}
                    icon={<AlertCircle className="h-5 w-5" />}
                    accentColor="var(--destructive)"
                    loading={overdueStats.loading}
                    error={overdueStats.error}
                    onRetry={loadOverdueStats}
                    errorLabel={t.dashboard.kpiErrorShort}
                    retryLabel={t.common.retry}
                />
            </div>

            {/* Lower section */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
                {/* Recently Added */}
                <Card>
                    <CardHeader>
                        <span className="text-sm font-semibold text-[var(--foreground)]">
                            {t.dashboard.recentlyAdded}
                        </span>
                        <Button variant="ghost" size="sm" onClick={onViewAll}>
                            {t.dashboard.viewAll}
                        </Button>
                    </CardHeader>

                    {recentBooks.loading && <RecentlyAddedSkeleton />}

                    {recentBooks.error && (
                        <ErrorState
                            heading={t.common.errorHeading}
                            description={t.common.errorDescription}
                            retryLabel={t.common.retry}
                            onRetry={loadRecentBooks}
                            className="py-10"
                        />
                    )}

                    {!recentBooks.loading && !recentBooks.error && recentBooks.data?.length === 0 && (
                        <EmptyState
                            heading={t.dashboard.recentlyAddedEmpty}
                            description={t.dashboard.recentlyAddedEmptyDesc}
                            icon={<BookOpen className="h-6 w-6" />}
                            className="py-10"
                        />
                    )}

                    {!recentBooks.loading && !recentBooks.error && recentBooks.data && recentBooks.data.length > 0 && (
                        <DataTable className="rounded-t-none border-0 shadow-none">
                            <DataTableHead>
                                <tr>
                                    <Th>{t.dashboard.colTitleAuthor}</Th>
                                    <Th>{t.dashboard.colGenre}</Th>
                                    <Th>{t.dashboard.colStatus}</Th>
                                    <Th>{t.dashboard.colRating}</Th>
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {recentBooks.data.map((book) => (
                                    <DataTableRow key={book.id}>
                                        <Td>
                                            <p className="font-medium text-[var(--foreground)] leading-tight">{book.name}</p>
                                            <p className="text-xs text-[var(--muted)] mt-0.5">{book.author}</p>
                                        </Td>
                                        <Td>{book.genre ? <GenreTag genre={book.genre} /> : <span className="text-[var(--muted-foreground)]">—</span>}</Td>
                                        <Td>
                                            {book.status ? (
                                                <StatusBadge
                                                    status={book.status === "LENT_OUT" ? "Lent Out" : "Owned"}
                                                    overdue={false}
                                                />
                                            ) : (
                                                <span className="text-[var(--muted-foreground)]">—</span>
                                            )}
                                        </Td>
                                        <Td>
                                            {book.rating
                                                ? <StarRating value={book.rating} />
                                                : <span className="text-[var(--muted-foreground)]">—</span>
                                            }
                                        </Td>
                                    </DataTableRow>
                                ))}
                            </DataTableBody>
                        </DataTable>
                    )}
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <span className="text-sm font-semibold text-[var(--foreground)]">
                            {t.dashboard.recentActivity}
                        </span>
                    </CardHeader>

                    {activity.loading && <ActivitySkeleton />}

                    {activity.error && (
                        <ErrorState
                            heading={t.common.errorHeading}
                            description={t.common.errorDescription}
                            retryLabel={t.common.retry}
                            onRetry={loadActivity}
                            className="py-10"
                        />
                    )}

                    {!activity.loading && !activity.error && activity.data?.length === 0 && (
                        <EmptyState
                            heading={t.dashboard.activityEmpty}
                            description={t.dashboard.activityEmptyDesc}
                            icon={<Activity className="h-6 w-6" />}
                            className="py-10"
                        />
                    )}

                    {!activity.loading && !activity.error && activity.data && activity.data.length > 0 && (
                        <ul className="divide-y divide-[var(--border)]">
                            {activity.data.map((item) => (
                                <li key={item.id} className="flex gap-3 px-5 py-3.5 items-start">
                                    <span
                                        className={[
                                            "mt-1.5 h-2 w-2 rounded-full shrink-0",
                                            item.action === "LENT"     ? "bg-[var(--warning)]"  :
                                            item.action === "RETURNED" ? "bg-[var(--success)]"  :
                                                                          "bg-[var(--accent)]",
                                        ].join(" ")}
                                        aria-hidden="true"
                                    />
                                    <div>
                                        <p className="text-sm text-[var(--foreground)] leading-snug">
                                            {formatActivity(item)}
                                        </p>
                                        <p className="text-xs text-[var(--muted)] mt-0.5">
                                            {item.occurredAt ? new Date(item.occurredAt).toLocaleDateString() : "—"}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    );
}

function formatActivity(item: ActivityEntry): string {
    if (item.action === "LENT") return `Lent ${item.bookName ?? "a book"} to ${item.memberName ?? "someone"}`;
    if (item.action === "RETURNED") return `${item.memberName ?? "Someone"} returned ${item.bookName ?? "a book"}`;
    if (item.action === "ADDED") return `Added ${item.bookName ?? "a book"} to collection`;
    if (item.action === "REMOVED") return `Removed ${item.bookName ?? "a book"} from collection`;
    return `Updated ${item.bookName ?? "a book"}`;
}

function KpiCard({
    label, value, sub, icon, accentColor, loading, error, onRetry, errorLabel, retryLabel,
}: {
    label: string;
    value: number | undefined;
    sub: string;
    icon: React.ReactNode;
    accentColor: string;
    loading: boolean;
    error: boolean;
    onRetry: () => void;
    errorLabel: string;
    retryLabel: string;
}) {
    return (
        <Card className={["relative overflow-hidden", error ? "border-[var(--destructive)]/40" : ""].join(" ")}>
            <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: accentColor }} />
            <CardBody className="pt-5">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
                        {loading && (
                            <>
                                <Skeleton className="h-8 w-12 mt-1 mb-1.5" />
                                <Skeleton className="h-3 w-28" />
                            </>
                        )}
                        {error && (
                            <div className="mt-1">
                                <div className="flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 text-[var(--destructive)]" aria-hidden="true" />
                                    <p className="text-xs text-[var(--destructive)]">{errorLabel}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={onRetry} className="mt-1 h-6 px-2 text-[10px]">
                                    {retryLabel}
                                </Button>
                            </div>
                        )}
                        {!loading && !error && (
                            <>
                                <p className="text-3xl font-bold text-[var(--foreground)] mt-1 leading-none">
                                    {value ?? 0}
                                </p>
                                <p className="text-xs text-[var(--muted)] mt-1.5">{sub}</p>
                            </>
                        )}
                    </div>
                    <span className="p-2 rounded-lg bg-stone-100 text-[var(--muted)]">{icon}</span>
                </div>
            </CardBody>
        </Card>
    );
}

function RecentlyAddedSkeleton() {
    return (
        <div className="divide-y divide-[var(--border)]">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1">
                        <Skeleton className="h-3.5 w-40 mb-1.5" />
                        <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-3.5 w-20" />
                </div>
            ))}
        </div>
    );
}

function ActivitySkeleton() {
    return (
        <ul className="divide-y divide-[var(--border)]">
            {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex gap-3 px-5 py-3.5 items-start">
                    <Skeleton className="mt-1.5 h-2 w-2 rounded-full shrink-0" />
                    <div className="flex-1">
                        <Skeleton className="h-3.5 w-full mb-1.5" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </li>
            ))}
        </ul>
    );
}
```

- [ ] **Step 4: Update DashboardRoute to remove books prop**

Replace `src/app/(app)/dashboard/page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import DashboardPage from "@/src/components/pages/DashboardPage";

export default function DashboardRoute() {
    const router = useRouter();
    return <DashboardPage onViewAll={() => router.push("/books")} />;
}
```

- [ ] **Step 5: Run tests**

```bash
npx jest src/__tests__/DashboardPage.test.tsx --no-coverage
```

Expected: PASS — all tests green.

- [ ] **Step 6: Run full test suite to check for regressions**

```bash
npx jest --no-coverage
```

Expected: all tests pass (the old DashboardPage tests that relied on `books` prop are now replaced).

- [ ] **Step 7: Commit**

```bash
git add src/components/pages/DashboardPage.tsx src/app/(app)/dashboard/page.tsx src/__tests__/DashboardPage.test.tsx
git commit -m "feat(dashboard): add real API fetches, skeleton loading, and per-section error states"
```

---

## Task 12: LentPage refactor

**Files:**
- Modify: `src/components/pages/LentPage.tsx`
- Modify: `src/app/(app)/lent/page.tsx`
- Modify: `src/__tests__/LentPage.test.tsx`

- [ ] **Step 1: Write new LentPage tests**

Replace the contents of `src/__tests__/LentPage.test.tsx`:

```tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import LentPage from "@/src/components/pages/LentPage";

const MOCK_LENDINGS = [
    {
        id: 1, bookId: 5, memberId: 3, userId: 42,
        lentDate: "2026-06-01", expectedReturnDate: "2026-07-01",
        actualReturnDate: null, status: "ACTIVE" as const,
    },
    {
        id: 2, bookId: 7, memberId: 4, userId: 42,
        lentDate: "2026-04-01", expectedReturnDate: "2026-05-01",
        actualReturnDate: null, status: "OVERDUE" as const,
    },
];

function mockFetch(response: unknown, ok = true) {
    global.fetch = jest.fn().mockResolvedValue({
        ok,
        json: () => Promise.resolve(response),
    });
}

function mockFetchReject() {
    global.fetch = jest.fn().mockRejectedValue(new Error("fetch failed"));
}

describe("LentPage", () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("renders page without crashing", () => {
        mockFetch(MOCK_LENDINGS);
        render(<LentPage />);
        expect(screen.getByTestId("lent-page")).toBeInTheDocument();
    });

    it("shows skeleton cards while loading", () => {
        global.fetch = jest.fn(() => new Promise(() => {}));
        render(<LentPage />);
        expect(screen.getAllByRole("generic").some((el) => el.classList.contains("animate-pulse"))).toBe(true);
    });

    it("shows lending cards after fetch resolves", async () => {
        mockFetch(MOCK_LENDINGS);
        render(<LentPage />);
        await waitFor(() => {
            expect(screen.getByText("Book #5")).toBeInTheDocument();
        });
    });

    it("marks overdue lendings correctly", async () => {
        mockFetch(MOCK_LENDINGS);
        render(<LentPage />);
        await waitFor(() => {
            expect(screen.getByText(/overdue/i)).toBeInTheDocument();
        });
    });

    it("shows error state when fetch fails", async () => {
        mockFetchReject();
        render(<LentPage />);
        await waitFor(() => {
            expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        });
    });

    it("shows retry button on error", async () => {
        mockFetchReject();
        render(<LentPage />);
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
        });
    });

    it("re-fetches when retry button clicked", async () => {
        let calls = 0;
        global.fetch = jest.fn(() => {
            calls++;
            if (calls === 1) return Promise.reject(new Error("fail"));
            return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_LENDINGS) });
        });
        render(<LentPage />);
        await waitFor(() => screen.getByRole("button", { name: /try again/i }));
        fireEvent.click(screen.getByRole("button", { name: /try again/i }));
        await waitFor(() => {
            expect(screen.getByText("Book #5")).toBeInTheDocument();
        });
    });

    it("shows empty state when no lendings returned", async () => {
        mockFetch([]);
        render(<LentPage />);
        await waitFor(() => {
            expect(screen.getByText("No books are currently lent out.")).toBeInTheDocument();
        });
    });

    it("shows overdue-specific empty state when overdue filter active and no overdue items", async () => {
        mockFetch([MOCK_LENDINGS[0]]);
        render(<LentPage />);
        await waitFor(() => screen.getByText("Book #5"));
        fireEvent.click(screen.getByText(/overdue only/i));
        await waitFor(() => {
            expect(screen.getByText("No overdue books")).toBeInTheDocument();
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/LentPage.test.tsx --no-coverage
```

Expected: FAIL — component still takes `lentBooks` prop.

- [ ] **Step 3: Rewrite LentPage**

Replace the full contents of `src/components/pages/LentPage.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen } from "lucide-react";
import { ActiveLending } from "@/src/lib/types";
import { interpolate, useLanguage } from "@/src/lib/i18n/context";
import { PageHeader } from "@/src/components/ui/Topbar";
import { Card, CardBody, CardFooter } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Avatar } from "@/src/components/ui/Avatar";

export default function LentPage() {
    const { t } = useLanguage();
    const [showOverdueOnly, setShowOverdueOnly] = useState(false);
    const [lendings, setLendings] = useState<ActiveLending[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch("/api/lending/active");
            if (!res.ok) throw new Error("non-ok");
            const data: ActiveLending[] = await res.json();
            setLendings(data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const displayed = showOverdueOnly
        ? lendings.filter((l) => l.status === "OVERDUE")
        : lendings;

    return (
        <div data-testid="lent-page">
            <PageHeader
                title={t.lent.title}
                subtitle={interpolate(t.lent.subtitle, { count: String(lendings.length) })}
                action={
                    <div className="flex items-center gap-2">
                        {[
                            { active: !showOverdueOnly, label: t.lent.filterAll, onClick: () => setShowOverdueOnly(false) },
                            { active: showOverdueOnly,  label: t.lent.filterOverdue, onClick: () => setShowOverdueOnly(true) },
                        ].map(({ active, label, onClick }) => (
                            <button
                                key={label}
                                onClick={onClick}
                                className={[
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                    active
                                        ? "bg-[var(--accent)] text-white"
                                        : "bg-transparent text-[var(--muted)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]",
                                ].join(" ")}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                }
            />

            {loading && <LentCardsSkeleton />}

            {error && (
                <ErrorState
                    heading={t.common.errorHeading}
                    description={t.common.errorDescription}
                    retryLabel={t.common.retry}
                    onRetry={load}
                />
            )}

            {!loading && !error && displayed.length === 0 && (
                <EmptyState
                    heading={showOverdueOnly ? t.lent.emptyOverdue : t.lent.emptyState}
                    icon={<BookOpen className="h-6 w-6" />}
                />
            )}

            {!loading && !error && displayed.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayed.map((lending) => (
                        <LendCard key={lending.id} lending={lending} />
                    ))}
                </div>
            )}
        </div>
    );
}

function LendCard({ lending }: { lending: ActiveLending }) {
    const { t } = useLanguage();
    const isOverdue = lending.status === "OVERDUE";

    return (
        <Card className={isOverdue ? "border-[var(--destructive)]/40" : ""}>
            <CardBody className="pb-3">
                {isOverdue && (
                    <Badge variant="danger" className="mb-3">
                        {t.common.overdue}
                    </Badge>
                )}
                <p className="font-semibold text-sm text-[var(--foreground)] leading-tight">
                    {`Book #${lending.bookId}`}
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{t.common.dash}</p>

                <div className="mt-4 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                        <Avatar name="?" size="sm" />
                        <div>
                            <p className="text-xs font-medium text-[var(--foreground)]">{t.common.dash}</p>
                            <p className="text-[10px] text-[var(--muted)]">{t.lent.labelLentTo}</p>
                        </div>
                    </div>
                    <InfoRow label={t.lent.labelDateLent} value={lending.lentDate} />
                    <InfoRow
                        label={t.lent.labelDueBack}
                        value={lending.expectedReturnDate ?? t.common.dash}
                        danger={isOverdue}
                    />
                </div>
            </CardBody>
            <CardFooter className="gap-2">
                <Button variant="primary" size="sm" className="flex-1 justify-center">
                    {t.lent.markReturned}
                </Button>
                <Button variant="secondary" size="sm" className="flex-1 justify-center">
                    {t.lent.remind}
                </Button>
            </CardFooter>
        </Card>
    );
}

function InfoRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-[var(--muted)]">{label}</span>
            <span className={["text-xs font-medium", danger ? "text-[var(--destructive)]" : "text-[var(--foreground)]"].join(" ")}>
                {value}
            </span>
        </div>
    );
}

function LentCardsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border border-[var(--border)] p-5">
                    <Skeleton className="h-4 w-3/4 mb-1.5" />
                    <Skeleton className="h-3 w-1/2 mb-4" />
                    <div className="space-y-2.5">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Skeleton className="h-7 flex-1 rounded-lg" />
                        <Skeleton className="h-7 flex-1 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}
```

- [ ] **Step 4: Update LentRoute to remove static data fetch**

Replace `src/app/(app)/lent/page.tsx`:

```tsx
"use client";

import LentPage from "@/src/components/pages/LentPage";

export default function LentRoute() {
    return <LentPage />;
}
```

- [ ] **Step 5: Run LentPage tests**

```bash
npx jest src/__tests__/LentPage.test.tsx --no-coverage
```

Expected: PASS — all tests green.

- [ ] **Step 6: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/pages/LentPage.tsx src/app/(app)/lent/page.tsx src/__tests__/LentPage.test.tsx
git commit -m "feat(lent): fetch active lendings from API with skeleton loading and error state"
```

---

## Task 13: BooksPage improvements

**Files:**
- Modify: `src/components/pages/BooksPage.tsx`
- Modify: `src/__tests__/BooksPage.test.tsx`

- [ ] **Step 1: Write new BooksPage tests**

Open `src/__tests__/BooksPage.test.tsx` and add these test cases (keep all existing tests, append new ones):

```tsx
// Add these imports at the top if not already present:
// import { render, screen, fireEvent } from "@testing-library/react";
// import BooksPage from "@/src/components/pages/BooksPage";

// ── New tests ─────────────────────────────────────────────────────────────────

describe("BooksPage — empty and error states", () => {
    it("shows 'Your library is empty' when books array is empty and filter is All", () => {
        render(<BooksPage books={[]} onBookClick={jest.fn()} onAddBook={jest.fn()} />);
        expect(screen.getByText("Your library is empty")).toBeInTheDocument();
    });

    it("shows 'No books match this filter' when filtered result is empty", () => {
        const books = [
            {
                id: "1", title: "Dune", author: "Herbert", year: 1965,
                genre: "Sci-Fi", status: "Owned" as const,
            },
        ];
        render(<BooksPage books={books} onBookClick={jest.fn()} onAddBook={jest.fn()} />);
        fireEvent.click(screen.getByText(/lent out/i));
        expect(screen.getByText("No books match this filter")).toBeInTheDocument();
    });

    it("shows error state when isError is true", () => {
        render(
            <BooksPage
                books={[]}
                onBookClick={jest.fn()}
                onAddBook={jest.fn()}
                isError
                onRetry={jest.fn()}
            />
        );
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("calls onRetry when retry button clicked in error state", () => {
        const onRetry = jest.fn();
        render(
            <BooksPage
                books={[]}
                onBookClick={jest.fn()}
                onAddBook={jest.fn()}
                isError
                onRetry={onRetry}
            />
        );
        fireEvent.click(screen.getByRole("button", { name: /try again/i }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});
```

- [ ] **Step 2: Run new tests to verify they fail**

```bash
npx jest src/__tests__/BooksPage.test.tsx --no-coverage
```

Expected: new tests FAIL (existing tests still pass).

- [ ] **Step 3: Update BooksPage**

In `src/components/pages/BooksPage.tsx`, update the `BooksPageProps` interface and render logic:

```tsx
// Update interface:
interface BooksPageProps {
    books: Book[];
    onBookClick: (book: Book) => void;
    onAddBook: () => void;
    isError?: boolean;
    onRetry?: () => void;
}

// Update component signature:
export default function BooksPage({ books, onBookClick, onAddBook, isError, onRetry }: BooksPageProps) {
```

Add `ErrorState` import at the top:

```tsx
import { ErrorState } from "@/src/components/ui/ErrorState";
```

Replace the existing empty-state block (the `filtered.length === 0` ternary) with the following. The DataTable block is identical to what existed before — only the outer condition structure changes:

```tsx
{isError ? (
    <ErrorState
        heading={t.common.errorHeading}
        description={t.common.errorDescription}
        retryLabel={t.common.retry}
        onRetry={onRetry}
    />
) : filtered.length === 0 ? (
    activeFilter === "All" ? (
        <EmptyState
            heading={t.books.emptyAll}
            description={t.books.emptyAllDesc}
            icon={<BookOpen className="h-6 w-6" />}
            action={<Button variant="primary" size="sm" onClick={onAddBook}>{t.sidebar.addNewBook}</Button>}
        />
    ) : (
        <EmptyState
            heading={t.books.emptyFiltered}
            description={t.books.emptyFilteredDesc}
            icon={<BookOpen className="h-6 w-6" />}
        />
    )
) : (
    <DataTable>
        <DataTableHead>
            <tr>
                <Th>#</Th>
                <Th>{t.books.colTitle}</Th>
                <Th>{t.books.colAuthor}</Th>
                <Th>{t.books.colYear}</Th>
                <Th>{t.books.colGenre}</Th>
                <Th>{t.books.colStatus}</Th>
                <Th>{t.books.colLentTo}</Th>
                <Th>{t.books.colRating}</Th>
            </tr>
        </DataTableHead>
        <DataTableBody>
            {filtered.map((book, i) => (
                <DataTableRow
                    key={book.id}
                    onClick={() => onBookClick(book)}
                    className="cursor-pointer"
                >
                    <Td className="text-[var(--muted-foreground)] tabular-nums w-12">
                        {String(i + 1).padStart(3, "0")}
                    </Td>
                    <Td>
                        <span className="font-medium text-[var(--foreground)]">{book.title}</span>
                    </Td>
                    <Td className="text-[var(--muted)]">{book.author}</Td>
                    <Td className="tabular-nums text-[var(--muted)]">{book.year}</Td>
                    <Td><GenreTag genre={book.genre} /></Td>
                    <Td><StatusBadge status={book.status} overdue={book.overdue} /></Td>
                    <Td>
                        {book.lentTo ? (
                            <span className={book.overdue ? "text-[var(--destructive)] font-medium text-xs" : "text-xs text-[var(--foreground)]"}>
                                {book.lentTo}
                                {book.overdue && <span className="ms-1 text-[var(--destructive)]">({t.common.overdue})</span>}
                            </span>
                        ) : (
                            <span className="text-[var(--muted-foreground)]">—</span>
                        )}
                    </Td>
                    <Td>
                        {book.rating
                            ? <StarRating value={book.rating} />
                            : <span className="text-[var(--muted-foreground)]">—</span>
                        }
                    </Td>
                </DataTableRow>
            ))}
        </DataTableBody>
    </DataTable>
)}
```

- [ ] **Step 4: Run BooksPage tests**

```bash
npx jest src/__tests__/BooksPage.test.tsx --no-coverage
```

Expected: PASS — all tests green (existing + new).

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/BooksPage.tsx src/__tests__/BooksPage.test.tsx
git commit -m "feat(books): contextual empty states and error state with retry"
```

---

## Task 14: AuthorsPage improvements

**Files:**
- Modify: `src/components/pages/AuthorsPage.tsx`
- Modify: `src/__tests__/AuthorsPage.test.tsx` (create if it doesn't exist)

- [ ] **Step 1: Write AuthorsPage tests**

Check if `src/__tests__/AuthorsPage.test.tsx` exists. If not, create it. Add these tests:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import AuthorsPage from "@/src/components/pages/AuthorsPage";
import { Author, Book } from "@/src/lib/types";

const MOCK_AUTHORS: Author[] = [
    { id: "a1", initials: "JB", name: "Jorge Borges", bookCount: 2, genre: "Fiction" },
];

const MOCK_WORKS: Book[] = [
    { id: "b1", title: "Ficciones", author: "Jorge Borges", year: 1944, genre: "Fiction", status: "Owned" },
];

describe("AuthorsPage — empty and error states", () => {
    it("shows author cards when authors present", () => {
        render(<AuthorsPage authors={MOCK_AUTHORS} borgesWorks={MOCK_WORKS} />);
        expect(screen.getByText("Jorge Borges")).toBeInTheDocument();
    });

    it("shows empty state when authors array is empty", () => {
        render(<AuthorsPage authors={[]} borgesWorks={[]} />);
        expect(screen.getByText("No authors yet")).toBeInTheDocument();
    });

    it("shows empty state in works table when borgesWorks is empty", () => {
        render(<AuthorsPage authors={MOCK_AUTHORS} borgesWorks={[]} />);
        expect(screen.getByText("No works found")).toBeInTheDocument();
    });

    it("shows error state when isError is true", () => {
        render(
            <AuthorsPage
                authors={[]}
                borgesWorks={[]}
                isError
                onRetry={jest.fn()}
            />
        );
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("calls onRetry when retry button clicked", () => {
        const onRetry = jest.fn();
        render(
            <AuthorsPage
                authors={[]}
                borgesWorks={[]}
                isError
                onRetry={onRetry}
            />
        );
        fireEvent.click(screen.getByRole("button", { name: /try again/i }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/AuthorsPage.test.tsx --no-coverage
```

Expected: FAIL — `AuthorsPage` doesn't yet accept `isError`/`onRetry`, and missing empty states.

- [ ] **Step 3: Update AuthorsPage**

In `src/components/pages/AuthorsPage.tsx`, update the interface and render:

Add imports:

```tsx
import { Users } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
```

Update interface:

```tsx
interface AuthorsPageProps {
    authors: Author[];
    borgesWorks: Book[];
    isError?: boolean;
    onRetry?: () => void;
}
```

Update component signature:

```tsx
export default function AuthorsPage({ authors, borgesWorks, isError, onRetry }: AuthorsPageProps) {
```

Replace the author grid section:

```tsx
{isError ? (
    <ErrorState
        heading={t.common.errorHeading}
        description={t.common.errorDescription}
        retryLabel={t.common.retry}
        onRetry={onRetry}
    />
) : authors.length === 0 ? (
    <EmptyState
        heading={t.authors.emptyAuthors}
        description={t.authors.emptyAuthorsDesc}
        icon={<Users className="h-6 w-6" />}
        className="mb-6"
    />
) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
        {authors.map((author) => (
            <AuthorCard key={author.id} author={author} />
        ))}
    </div>
)}
```

In the Complete Works card, replace the `<DataTable>` block with:

```tsx
<DataTable className="rounded-t-none border-0 shadow-none">
    <DataTableHead>
        <tr>
            <Th>{t.authors.colTitle}</Th>
            <Th>{t.authors.colYear}</Th>
            <Th>{t.authors.colGenre}</Th>
            <Th>{t.authors.colStatus}</Th>
            <Th>{t.authors.colRating}</Th>
            <Th>{t.authors.colNotes}</Th>
        </tr>
    </DataTableHead>
    {borgesWorks.length === 0 ? (
        <tbody>
            <tr>
                <td colSpan={6}>
                    <EmptyState
                        heading={t.authors.emptyWorks}
                        description={t.authors.emptyWorksDesc}
                        icon={<BookOpen className="h-6 w-6" />}
                        className="py-10"
                    />
                </td>
            </tr>
        </tbody>
    ) : (
        <DataTableBody>
            {borgesWorks.map((book) => (
                <DataTableRow key={book.id}>
                    <Td>
                        <span className="font-medium text-[var(--foreground)]">{book.title}</span>
                    </Td>
                    <Td className="tabular-nums text-[var(--muted)]">{book.year}</Td>
                    <Td><GenreTag genre={book.genre} /></Td>
                    <Td><StatusBadge status={book.status} overdue={book.overdue} /></Td>
                    <Td>
                        {book.rating
                            ? <StarRating value={book.rating} />
                            : <span className="text-[var(--muted-foreground)]">—</span>
                        }
                    </Td>
                    <Td className="text-xs text-[var(--muted)] italic">{book.notes ?? ""}</Td>
                </DataTableRow>
            ))}
        </DataTableBody>
    )}
</DataTable>
```

Also add `BookOpen` to the lucide import if not already there.

- [ ] **Step 4: Run AuthorsPage tests**

```bash
npx jest src/__tests__/AuthorsPage.test.tsx --no-coverage
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass with no regressions.

- [ ] **Step 6: Commit**

```bash
git add src/components/pages/AuthorsPage.tsx src/__tests__/AuthorsPage.test.tsx
git commit -m "feat(authors): add empty states for author grid and works table, error state with retry"
```

---

## Task 15: Final verification

- [ ] **Step 1: Run full test suite one final time**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify .gitignore has .superpowers entry**

Check `.gitignore`. If `.superpowers/` is not present, add it:

```
.superpowers/
```

Then:

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm directory"
```
