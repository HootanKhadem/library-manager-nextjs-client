# Proxy Route Token Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every authenticated Next.js API proxy route forwards both `access_token` and `refresh_token` cookies to the backend (instead of just an `Authorization: Bearer` header built from `access_token` alone), and relays back any refreshed `access_token` cookie the backend mints — so the backend's transparent-refresh design actually works end-to-end instead of silently logging every user out ~1 hour after login/signup.

**Architecture:** One new shared helper module (`src/app/api/_authFetch.ts`) exports `buildAuthCookieHeader(req)` (builds a `Cookie` header from whichever of the two tokens are present, or `null` if both are missing) and `relayRefreshedAccessToken(req, backendRes, outgoing)` (copies any new `access_token` the backend set via its own `Set-Cookie` response header onto our outgoing response). Every one of the 18 authenticated proxy route files is updated to use both: the 401 guard changes from "no access_token → 401" to "no cookies at all → 401", the outgoing `fetch()` call's `Authorization` header is replaced with a `Cookie` header, and `relayRefreshedAccessToken` is called before every response that followed a successful backend fetch.

**Tech Stack:** TypeScript, Next.js 16 (App Router route handlers, Node.js runtime — `Headers.getSetCookie()` is available), Jest (`@jest-environment node`), existing `extractCookieValue`/`cookieBase` helpers in `src/app/api/auth/_cookies.ts` (added in the prior signup/login cookie fix).

## Global Constraints

- The backend's transparent-refresh logic (Kotlin, `library-manager-backend`'s `JWT.kt`) is gated entirely on reading `access_token`/`refresh_token` **cookies** off the incoming request — an `Authorization` header bypasses it completely. Every proxy route must forward cookies, not a Bearer header, to give the backend a chance to refresh.
- The `access_token` cookie carries a hard 1-hour `Expires` timestamp and gets purged by the browser itself once it passes — so the local 401 guard must not fire just because `access_token` is missing. It must only fire when **both** `access_token` and `refresh_token` are missing (i.e. there is truly no session at all).
- `relayRefreshedAccessToken` must be tolerant of a `Response`-like object with no `headers.getSetCookie` (this is what existing test mocks look like, and there's no reason to force every existing mock in 18 test files to grow a `headers` property it doesn't care about) — treat that as "nothing to relay", not an error.
- `login`, `signup`, and `logout` routes are **out of scope** — `login`/`signup` were already fixed in a prior task (they don't send `access_token` at all, since none exists yet), and `logout` calls a public backend endpoint that ignores auth entirely.
- `src/app/api/admin/users/route.ts` is **out of scope** — it calls `POST /admin/users` on the backend, which was deleted in an unrelated backend change. It's already broken (404) independent of this fix. Do not touch it as part of this plan.
- Preserve every existing behavior this plan doesn't explicitly change: query string forwarding, path param handling, JSON body forwarding, the 204-no-body special case on DELETE routes, and the exact 503/error-message shape on network failure.

---

## File Structure

**Create:**
- `src/app/api/_authFetch.ts` — `buildAuthCookieHeader`, `relayRefreshedAccessToken`.
- `src/__tests__/api/_authFetch.test.ts` — unit tests for both helpers.

**Modify (route + matching test file, one pair per bullet):**
- `src/app/api/book/route.ts` / `src/__tests__/api/book/book.route.test.ts`
- `src/app/api/book/[id]/route.ts` / `src/__tests__/api/book/book-id.route.test.ts`
- `src/app/api/author/route.ts` / `src/__tests__/api/author/author.route.test.ts`
- `src/app/api/author/search/route.ts` / `src/__tests__/api/author/search.route.test.ts`
- `src/app/api/genre/route.ts` / `src/__tests__/api/genre/genre.route.test.ts`
- `src/app/api/genre/[id]/route.ts` / `src/__tests__/api/genre/genre-id.route.test.ts`
- `src/app/api/member/route.ts` / `src/__tests__/api/member/member.route.test.ts`
- `src/app/api/member/[id]/route.ts` / `src/__tests__/api/member/member-id.route.test.ts`
- `src/app/api/lending/route.ts` / `src/__tests__/api/lending/lending.route.test.ts`
- `src/app/api/lending/active/route.ts` / `src/__tests__/api/lending/active.route.test.ts`
- `src/app/api/lending/[id]/return/route.ts` / `src/__tests__/api/lending/return.route.test.ts`
- `src/app/api/books/count/route.ts` / `src/__tests__/api/books/count.route.test.ts`
- `src/app/api/preferences/route.ts` / `src/__tests__/api/preferences/preferences.route.test.ts`
- `src/app/api/dashboard/stats/books/route.ts` / `src/__tests__/api/dashboard/stats-books.route.test.ts`
- `src/app/api/dashboard/stats/overdue/route.ts` / `src/__tests__/api/dashboard/stats-overdue.route.test.ts`
- `src/app/api/dashboard/stats/lent-out/route.ts` / `src/__tests__/api/dashboard/stats-lent-out.route.test.ts`
- `src/app/api/dashboard/recent-activity/route.ts` / `src/__tests__/api/dashboard/recent-activity.route.test.ts`
- `src/app/api/dashboard/recently-added/route.ts` / `src/__tests__/api/dashboard/recently-added.route.test.ts`

**Not touched:** `auth/login`, `auth/signup`, `auth/logout`, `admin/users` (see Global Constraints).

---

### Task 1: Shared helper + reference implementation (`book` routes)

**Files:**
- Create: `src/app/api/_authFetch.ts`
- Create: `src/__tests__/api/_authFetch.test.ts`
- Modify: `src/app/api/book/route.ts`
- Modify: `src/app/api/book/[id]/route.ts`
- Modify: `src/__tests__/api/book/book.route.test.ts`
- Modify: `src/__tests__/api/book/book-id.route.test.ts`

**Interfaces:**
- Consumes: `cookieBase(req: NextRequest)`, `extractCookieValue(setCookieHeaders: string[], name: string): string | undefined` — both already exist and are exported from `src/app/api/auth/_cookies.ts`.
- Produces (used by every later task):
  - `buildAuthCookieHeader(req: NextRequest): string | null` in `src/app/api/_authFetch.ts`
  - `relayRefreshedAccessToken(req: NextRequest, backendRes: Response, outgoing: NextResponse): void` in `src/app/api/_authFetch.ts`
  - Both imported everywhere as `import {buildAuthCookieHeader, relayRefreshedAccessToken} from "@/src/app/api/_authFetch";` (the `@/*` path alias maps to the repo root, per `tsconfig.json`, so this import is identical regardless of how deeply nested the importing route file is).

This task is TDD end-to-end: write the helper's unit tests first, watch them fail (module doesn't exist), implement, watch them pass — then apply the now-proven helper to the two `book` route files as the reference every later task mirrors exactly.

- [ ] **Step 1: Write the failing helper tests**

Create `src/__tests__/api/_authFetch.test.ts`:

```ts
/** @jest-environment node */
import {NextRequest, NextResponse} from 'next/server';
import {buildAuthCookieHeader, relayRefreshedAccessToken} from '@/src/app/api/_authFetch';

function makeReq(cookieHeader?: string): NextRequest {
    return new NextRequest('http://localhost/api/book', {
        headers: cookieHeader ? {Cookie: cookieHeader} : {},
    });
}

describe('buildAuthCookieHeader', () => {
    it('returns null when neither cookie is present', () => {
        expect(buildAuthCookieHeader(makeReq())).toBeNull();
    });

    it('includes only access_token when refresh_token is absent', () => {
        expect(buildAuthCookieHeader(makeReq('access_token=abc'))).toBe('access_token=abc');
    });

    it('includes only refresh_token when access_token is absent', () => {
        expect(buildAuthCookieHeader(makeReq('refresh_token=xyz'))).toBe('refresh_token=xyz');
    });

    it('includes both when both are present', () => {
        expect(buildAuthCookieHeader(makeReq('access_token=abc; refresh_token=xyz'))).toBe('access_token=abc; refresh_token=xyz');
    });
});

describe('relayRefreshedAccessToken', () => {
    it('sets a new access_token cookie on the outgoing response when the backend refreshed one', () => {
        const req = makeReq('refresh_token=xyz');
        const backendRes = {
            headers: {getSetCookie: () => ['access_token=newtok; Path=/; Secure; HttpOnly; SameSite=None']},
        } as unknown as Response;
        const outgoing = NextResponse.json({ok: true});

        relayRefreshedAccessToken(req, backendRes, outgoing);

        expect(outgoing.cookies.get('access_token')?.value).toBe('newtok');
    });

    it('does nothing when the backend response has no Set-Cookie headers', () => {
        const req = makeReq('access_token=abc');
        const backendRes = {headers: {getSetCookie: () => []}} as unknown as Response;
        const outgoing = NextResponse.json({ok: true});

        relayRefreshedAccessToken(req, backendRes, outgoing);

        expect(outgoing.cookies.get('access_token')).toBeUndefined();
    });

    it('does nothing when the backend response mock has no headers.getSetCookie at all', () => {
        const req = makeReq('access_token=abc');
        const backendRes = {} as unknown as Response;
        const outgoing = NextResponse.json({ok: true});

        expect(() => relayRefreshedAccessToken(req, backendRes, outgoing)).not.toThrow();
        expect(outgoing.cookies.get('access_token')).toBeUndefined();
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/__tests__/api/_authFetch.test.ts`
Expected: FAIL — `Cannot find module '@/src/app/api/_authFetch'`.

- [ ] **Step 3: Implement the helper**

Create `src/app/api/_authFetch.ts`:

```ts
import {NextRequest, NextResponse} from 'next/server';
import {cookieBase, extractCookieValue} from '@/src/app/api/auth/_cookies';

// The backend's transparent-refresh logic reads access_token/refresh_token
// as cookies on the incoming request — not as an Authorization header. Build
// a raw Cookie header from whichever of the two are present so the backend
// gets a chance to run that logic. access_token alone expires after 1 hour
// and the browser purges it itself once it does, so we must not require it:
// return null (→ 401 upstream) only when there is truly no session at all.
export function buildAuthCookieHeader(req: NextRequest): string | null {
    const access = req.cookies.get('access_token')?.value;
    const refresh = req.cookies.get('refresh_token')?.value;
    if (!access && !refresh) return null;
    return [
        access ? `access_token=${access}` : null,
        refresh ? `refresh_token=${refresh}` : null,
    ].filter((part): part is string => part !== null).join('; ');
}

// The backend transparently mints a new access_token (via its own
// Set-Cookie response header) whenever the incoming one was expired but the
// refresh_token was still valid. Relay that onto our own response so the
// browser's session extends automatically — this is what makes the
// backend's "no explicit refresh call" design actually work end-to-end.
// Tolerant of a Response-like object with no headers.getSetCookie (plain
// test mocks that don't care about this) — that just means nothing to relay.
export function relayRefreshedAccessToken(req: NextRequest, backendRes: Response, outgoing: NextResponse): void {
    const setCookieHeaders = backendRes.headers?.getSetCookie?.() ?? [];
    const refreshed = extractCookieValue(setCookieHeaders, 'access_token');
    if (refreshed) {
        outgoing.cookies.set('access_token', refreshed, cookieBase(req));
    }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/__tests__/api/_authFetch.test.ts`
Expected: PASS — 7/7 tests green.

- [ ] **Step 5: Apply the helper to `book/route.ts`**

Replace the full contents of `src/app/api/book/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function POST(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/book`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookieHeader },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const qs = req.nextUrl.searchParams.toString();

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/book${qs ? `?${qs}` : ""}`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 6: Apply the helper to `book/[id]/route.ts`**

Replace the full contents of `src/app/api/book/[id]/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/book/${id}`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/book/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookieHeader },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/book/${id}`, {
            method: "DELETE",
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    if (res.status === 204) {
        const response = new NextResponse(null, { status: 204 });
        relayRefreshedAccessToken(req, res, response);
        return response;
    }
    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 7: Update `book.route.test.ts` to match the new Cookie-forwarding contract**

Replace the full contents of `src/__tests__/api/book/book.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, POST } from "@/src/app/api/book/route";

function makeReq(body: object, cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/book", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/book", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await POST(makeReq({ name: "Dune" }));
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present (no access_token)", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Dune" }) });
        const res = await POST(makeReq({ name: "Dune" }, "refresh_token=rtok"));
        expect(res.status).toBe(201);
    });

    it("forwards the request body and Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Dune" }) });
        await POST(makeReq({ name: "Dune" }, "access_token=tok; refresh_token=rtok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book");
        expect(opts.headers.Cookie).toBe("access_token=tok; refresh_token=rtok");
        expect(opts.headers.Authorization).toBeUndefined();
        expect(JSON.parse(opts.body)).toEqual({ name: "Dune" });
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Dune" }) });
        const res = await POST(makeReq({ name: "Dune" }, "access_token=tok"));
        expect(res.status).toBe(201);
        expect(await res.json()).toEqual({ id: 1, name: "Dune" });
    });

    it("relays a refreshed access_token cookie from the backend response", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 201,
            json: () => Promise.resolve({ id: 1, name: "Dune" }),
            headers: { getSetCookie: () => ["access_token=newtok; Path=/; Secure; HttpOnly; SameSite=None"] },
        });
        const res = await POST(makeReq({ name: "Dune" }, "refresh_token=rtok"));
        expect(res.cookies.get("access_token")?.value).toBe("newtok");
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await POST(makeReq({ name: "Dune" }, "access_token=tok"));
        expect(res.status).toBe(503);
        expect((await res.json()).message).toMatch(/unable to reach/i);
    });

    it("propagates a non-2xx status from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ message: "Invalid book" }) });
        const res = await POST(makeReq({ name: "" }, "access_token=tok"));
        expect(res.status).toBe(400);
    });
});

function makeGetReq(url: string, cookies?: string): NextRequest {
    return new NextRequest(url, {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/book", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeGetReq("http://localhost/api/book"));
        expect(res.status).toBe(401);
    });

    it("forwards page and pageSize query params and the Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ items: [], page: 2, pageSize: 20, totalItems: 0, totalPages: 1 }) });
        await GET(makeGetReq("http://localhost/api/book?page=2&pageSize=20", "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book?page=2&pageSize=20");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("requests the backend with no query string when none is given", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 }) });
        await GET(makeGetReq("http://localhost/api/book", "access_token=tok"));
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book");
    });

    it("proxies the 200 response from the backend", async () => {
        const page = { items: [{ id: 1, name: "Dune" }], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(page) });
        const res = await GET(makeGetReq("http://localhost/api/book?page=1&pageSize=20", "access_token=tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(page);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeGetReq("http://localhost/api/book", "access_token=tok"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 8: Update `book-id.route.test.ts`**

Replace the full contents of `src/__tests__/api/book/book-id.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "@/src/app/api/book/[id]/route";

function makeReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/book/42", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

function ctx(id: string) {
    return { params: Promise.resolve({ id }) };
}

describe("GET /api/book/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeReq(), ctx("42"));
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 42, name: "Dune" }) });
        const res = await GET(makeReq("refresh_token=rtok"), ctx("42"));
        expect(res.status).toBe(200);
    });

    it("requests the backend path with the given id and a Cookie header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 42, name: "Dune" }) });
        await GET(makeReq("access_token=tok"), ctx("42"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book/42");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("proxies the 200 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 42, name: "Dune" }) });
        const res = await GET(makeReq("access_token=tok"), ctx("42"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ id: 42, name: "Dune" });
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Book not found" }) });
        const res = await GET(makeReq("access_token=tok"), ctx("999"));
        expect(res.status).toBe(404);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("access_token=tok"), ctx("42"));
        expect(res.status).toBe(503);
    });
});

function makePutReq(body: object, cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/book/42", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
    });
}

function makeDeleteReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/book/42", {
        method: "DELETE",
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("PUT /api/book/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await PUT(makePutReq({ name: "Dune" }), ctx("42"));
        expect(res.status).toBe(401);
    });

    it("forwards the body and Cookie header to the correct backend path", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 42, name: "Dune" }) });
        await PUT(makePutReq({ name: "Dune" }, "access_token=tok"), ctx("42"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book/42");
        expect(opts.method).toBe("PUT");
        expect(opts.headers.Cookie).toBe("access_token=tok");
        expect(JSON.parse(opts.body)).toEqual({ name: "Dune" });
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Book not found" }) });
        const res = await PUT(makePutReq({ name: "Dune" }, "access_token=tok"), ctx("999"));
        expect(res.status).toBe(404);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await PUT(makePutReq({ name: "Dune" }, "access_token=tok"), ctx("42"));
        expect(res.status).toBe(503);
    });
});

describe("DELETE /api/book/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await DELETE(makeDeleteReq(), ctx("42"));
        expect(res.status).toBe(401);
    });

    it("returns 204 with no body on successful deletion", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        const res = await DELETE(makeDeleteReq("access_token=tok"), ctx("42"));
        expect(res.status).toBe(204);
    });

    it("relays a refreshed access_token cookie even on a 204 response", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 204,
            headers: { getSetCookie: () => ["access_token=newtok; Path=/; Secure; HttpOnly; SameSite=None"] },
        });
        const res = await DELETE(makeDeleteReq("refresh_token=rtok"), ctx("42"));
        expect(res.status).toBe(204);
        expect(res.cookies.get("access_token")?.value).toBe("newtok");
    });

    it("requests the correct backend path with a Cookie header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        await DELETE(makeDeleteReq("access_token=tok"), ctx("42"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book/42");
        expect(opts.method).toBe("DELETE");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("propagates a 409 conflict from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 409, json: () => Promise.resolve({ message: "Book has lending history" }) });
        const res = await DELETE(makeDeleteReq("access_token=tok"), ctx("42"));
        expect(res.status).toBe(409);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await DELETE(makeDeleteReq("access_token=tok"), ctx("42"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 9: Run the full affected test suite and typecheck**

Run: `npx jest src/__tests__/api/_authFetch.test.ts src/__tests__/api/book`
Expected: PASS — all tests green.

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add src/app/api/_authFetch.ts src/__tests__/api/_authFetch.test.ts src/app/api/book src/__tests__/api/book
git commit -m "fix(api): forward auth cookies (not just Bearer header) so backend token refresh works

Every proxy route sent access_token as an Authorization: Bearer header,
never forwarding the actual cookies. The backend's transparent-refresh
logic only ever looks at access_token/refresh_token as cookies on the
incoming request, so it never got a chance to run through this frontend
— once access_token's 1-hour cookie expired (and the browser purged it),
every proxy route's own guard 401'd locally without even asking the
backend, whose refresh_token-based refresh never got attempted.

New _authFetch.ts helper: buildAuthCookieHeader() builds a Cookie header
from whichever tokens are present (401 only when both are absent),
relayRefreshedAccessToken() copies back any access_token the backend
refreshed via its own Set-Cookie response header. Applied here to the
book routes as the reference implementation."
```

---

### Task 2: `author` routes

**Files:**
- Modify: `src/app/api/author/route.ts`
- Modify: `src/app/api/author/search/route.ts`
- Modify: `src/__tests__/api/author/author.route.test.ts`
- Modify: `src/__tests__/api/author/search.route.test.ts`

**Interfaces:**
- Consumes: `buildAuthCookieHeader`, `relayRefreshedAccessToken` from `@/src/app/api/_authFetch` (Task 1).

- [ ] **Step 1: Apply the pattern to `author/route.ts`**

Replace the full contents of `src/app/api/author/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function POST(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/author`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookieHeader },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const qs = req.nextUrl.searchParams.toString();

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/author${qs ? `?${qs}` : ""}`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 2: Apply the pattern to `author/search/route.ts`**

Replace the full contents of `src/app/api/author/search/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const query = req.nextUrl.searchParams.get("query") ?? "";

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/author/search?query=${encodeURIComponent(query)}`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => []);
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 3: Update `author.route.test.ts`**

Replace the full contents of `src/__tests__/api/author/author.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, POST } from "@/src/app/api/author/route";

function makeReq(body: object, cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/author", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/author", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await POST(makeReq({ name: "Borges", image: "" }));
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Borges" }) });
        const res = await POST(makeReq({ name: "Borges", image: "" }, "refresh_token=rtok"));
        expect(res.status).toBe(201);
    });

    it("forwards the request body and Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Borges" }) });
        await POST(makeReq({ name: "Borges", image: "" }, "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author");
        expect(opts.headers.Cookie).toBe("access_token=tok");
        expect(opts.headers.Authorization).toBeUndefined();
        expect(JSON.parse(opts.body)).toEqual({ name: "Borges", image: "" });
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Borges" }) });
        const res = await POST(makeReq({ name: "Borges", image: "" }, "access_token=tok"));
        expect(res.status).toBe(201);
        expect(await res.json()).toEqual({ id: 1, name: "Borges" });
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await POST(makeReq({ name: "Borges", image: "" }, "access_token=tok"));
        expect(res.status).toBe(503);
    });
});

function makeGetReq(url: string, cookies?: string): NextRequest {
    return new NextRequest(url, {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/author", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeGetReq("http://localhost/api/author"));
        expect(res.status).toBe(401);
    });

    it("forwards page and pageSize query params and the Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ items: [], page: 2, pageSize: 20, totalItems: 0, totalPages: 1 }) });
        await GET(makeGetReq("http://localhost/api/author?page=2&pageSize=20", "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author?page=2&pageSize=20");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("proxies the 200 response from the backend", async () => {
        const page = { items: [{ id: 1, name: "Jorge Luis Borges" }], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(page) });
        const res = await GET(makeGetReq("http://localhost/api/author?page=1&pageSize=20", "access_token=tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(page);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeGetReq("http://localhost/api/author", "access_token=tok"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 4: Update `search.route.test.ts`**

Replace the full contents of `src/__tests__/api/author/search.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/author/search/route";

function makeReq(query: string, cookies?: string): NextRequest {
    return new NextRequest(`http://localhost/api/author/search?query=${encodeURIComponent(query)}`, {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/author/search", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeReq("borges"));
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        const res = await GET(makeReq("borges", "refresh_token=rtok"));
        expect(res.status).toBe(200);
    });

    it("forwards the query param and Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("borges", "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author/search?query=borges");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("proxies the 200 response from the backend", async () => {
        const authors = [{ id: 1, name: "Jorge Luis Borges" }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(authors) });
        const res = await GET(makeReq("borges", "access_token=tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(authors);
    });

    it("defaults to an empty query string when none is given", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("", "access_token=tok"));
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author/search?query=");
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("borges", "access_token=tok"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx jest src/__tests__/api/author`
Expected: PASS.

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/author src/__tests__/api/author
git commit -m "fix(api): forward auth cookies for author routes (see book routes fix)"
```

---

### Task 3: `genre` routes

**Files:**
- Modify: `src/app/api/genre/route.ts`
- Modify: `src/app/api/genre/[id]/route.ts`
- Modify: `src/__tests__/api/genre/genre.route.test.ts`
- Modify: `src/__tests__/api/genre/genre-id.route.test.ts`

**Interfaces:**
- Consumes: `buildAuthCookieHeader`, `relayRefreshedAccessToken` from `@/src/app/api/_authFetch` (Task 1).

- [ ] **Step 1: Apply the pattern to `genre/route.ts`**

Replace the full contents of `src/app/api/genre/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/genre`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => []);
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}

export async function POST(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/genre`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookieHeader },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 2: Apply the pattern to `genre/[id]/route.ts`**

Replace the full contents of `src/app/api/genre/[id]/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/genre/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookieHeader },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/genre/${id}`, {
            method: "DELETE",
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    if (res.status === 204) {
        const response = new NextResponse(null, { status: 204 });
        relayRefreshedAccessToken(req, res, response);
        return response;
    }
    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 3: Update `genre.route.test.ts`**

Replace the full contents of `src/__tests__/api/genre/genre.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, POST } from "@/src/app/api/genre/route";

function makeGetReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/genre", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

function makePostReq(body: object, cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/genre", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("GET /api/genre", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeGetReq());
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        const res = await GET(makeGetReq("refresh_token=rtok"));
        expect(res.status).toBe(200);
    });

    it("sends a Cookie header instead of Authorization to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeGetReq("access_token=tok"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Cookie).toBe("access_token=tok");
        expect(opts.headers.Authorization).toBeUndefined();
    });

    it("proxies the 200 response from the backend", async () => {
        const genres = [{ id: 1, name: "Fiction" }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(genres) });
        const res = await GET(makeGetReq("access_token=tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(genres);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeGetReq("access_token=tok"));
        expect(res.status).toBe(503);
    });
});

describe("POST /api/genre", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await POST(makePostReq({ name: "Fiction" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body and Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Fiction" }) });
        await POST(makePostReq({ name: "Fiction" }, "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/genre");
        expect(opts.headers.Cookie).toBe("access_token=tok");
        expect(JSON.parse(opts.body)).toEqual({ name: "Fiction" });
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Fiction" }) });
        const res = await POST(makePostReq({ name: "Fiction" }, "access_token=tok"));
        expect(res.status).toBe(201);
    });
});
```

- [ ] **Step 4: Update `genre-id.route.test.ts`**

Replace the full contents of `src/__tests__/api/genre/genre-id.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { PUT, DELETE } from "@/src/app/api/genre/[id]/route";

function ctx(id: string) {
    return { params: Promise.resolve({ id }) };
}

function makePutReq(body: object, cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/genre/1", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
    });
}

function makeDeleteReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/genre/1", {
        method: "DELETE",
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("PUT /api/genre/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await PUT(makePutReq({ name: "Fiction" }), ctx("1"));
        expect(res.status).toBe(401);
    });

    it("forwards the body and Cookie header to the correct backend path", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 1, name: "Fiction" }) });
        await PUT(makePutReq({ name: "Fiction" }, "access_token=tok"), ctx("1"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/genre/1");
        expect(opts.method).toBe("PUT");
        expect(opts.headers.Cookie).toBe("access_token=tok");
        expect(JSON.parse(opts.body)).toEqual({ name: "Fiction" });
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Genre not found" }) });
        const res = await PUT(makePutReq({ name: "Fiction" }, "access_token=tok"), ctx("999"));
        expect(res.status).toBe(404);
    });
});

describe("DELETE /api/genre/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await DELETE(makeDeleteReq(), ctx("1"));
        expect(res.status).toBe(401);
    });

    it("returns 204 with no body on successful deletion", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        const res = await DELETE(makeDeleteReq("access_token=tok"), ctx("1"));
        expect(res.status).toBe(204);
    });

    it("requests the correct backend path with a Cookie header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        await DELETE(makeDeleteReq("access_token=tok"), ctx("1"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/genre/1");
        expect(opts.method).toBe("DELETE");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await DELETE(makeDeleteReq("access_token=tok"), ctx("1"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx jest src/__tests__/api/genre`
Expected: PASS.

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/genre src/__tests__/api/genre
git commit -m "fix(api): forward auth cookies for genre routes (see book routes fix)"
```

---

### Task 4: `member` routes

**Files:**
- Modify: `src/app/api/member/route.ts`
- Modify: `src/app/api/member/[id]/route.ts`
- Modify: `src/__tests__/api/member/member.route.test.ts`
- Modify: `src/__tests__/api/member/member-id.route.test.ts`

**Interfaces:**
- Consumes: `buildAuthCookieHeader`, `relayRefreshedAccessToken` from `@/src/app/api/_authFetch` (Task 1).

- [ ] **Step 1: Apply the pattern to `member/route.ts`**

Replace the full contents of `src/app/api/member/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/member`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => []);
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}

export async function POST(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/member`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookieHeader },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 2: Apply the pattern to `member/[id]/route.ts`**

Replace the full contents of `src/app/api/member/[id]/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/member/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookieHeader },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/member/${id}`, {
            method: "DELETE",
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    if (res.status === 204) {
        const response = new NextResponse(null, { status: 204 });
        relayRefreshedAccessToken(req, res, response);
        return response;
    }
    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 3: Update `member.route.test.ts`**

Replace the full contents of `src/__tests__/api/member/member.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, POST } from "@/src/app/api/member/route";

function makeGetReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/member", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

function makePostReq(body: object, cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/member", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("GET /api/member", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeGetReq());
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        const res = await GET(makeGetReq("refresh_token=rtok"));
        expect(res.status).toBe(200);
    });

    it("proxies the 200 response from the backend", async () => {
        const members = [{ id: 1, name: "Lucas Martinez" }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(members) });
        const res = await GET(makeGetReq("access_token=tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(members);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeGetReq("access_token=tok"));
        expect(res.status).toBe(503);
    });
});

describe("POST /api/member", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await POST(makePostReq({ name: "Lucas Martinez" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body and Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Lucas Martinez" }) });
        await POST(makePostReq({ name: "Lucas Martinez" }, "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/member");
        expect(opts.headers.Cookie).toBe("access_token=tok");
        expect(JSON.parse(opts.body)).toEqual({ name: "Lucas Martinez" });
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Lucas Martinez" }) });
        const res = await POST(makePostReq({ name: "Lucas Martinez" }, "access_token=tok"));
        expect(res.status).toBe(201);
    });
});
```

- [ ] **Step 4: Update `member-id.route.test.ts`**

Replace the full contents of `src/__tests__/api/member/member-id.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { PUT, DELETE } from "@/src/app/api/member/[id]/route";

function ctx(id: string) {
    return { params: Promise.resolve({ id }) };
}

function makePutReq(body: object, cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/member/1", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
    });
}

function makeDeleteReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/member/1", {
        method: "DELETE",
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("PUT /api/member/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await PUT(makePutReq({ name: "Lucas Martinez" }), ctx("1"));
        expect(res.status).toBe(401);
    });

    it("forwards the body and Cookie header to the correct backend path", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 1, name: "Lucas Martinez" }) });
        await PUT(makePutReq({ name: "Lucas Martinez" }, "access_token=tok"), ctx("1"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/member/1");
        expect(opts.method).toBe("PUT");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Member not found" }) });
        const res = await PUT(makePutReq({ name: "Lucas Martinez" }, "access_token=tok"), ctx("999"));
        expect(res.status).toBe(404);
    });
});

describe("DELETE /api/member/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await DELETE(makeDeleteReq(), ctx("1"));
        expect(res.status).toBe(401);
    });

    it("returns 204 with no body on successful deletion", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        const res = await DELETE(makeDeleteReq("access_token=tok"), ctx("1"));
        expect(res.status).toBe(204);
    });

    it("requests the correct backend path with a Cookie header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        await DELETE(makeDeleteReq("access_token=tok"), ctx("1"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/member/1");
        expect(opts.method).toBe("DELETE");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await DELETE(makeDeleteReq("access_token=tok"), ctx("1"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx jest src/__tests__/api/member`
Expected: PASS.

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/member src/__tests__/api/member
git commit -m "fix(api): forward auth cookies for member routes (see book routes fix)"
```

---

### Task 5: `lending` routes

**Files:**
- Modify: `src/app/api/lending/route.ts`
- Modify: `src/app/api/lending/active/route.ts`
- Modify: `src/app/api/lending/[id]/return/route.ts`
- Modify: `src/__tests__/api/lending/lending.route.test.ts`
- Modify: `src/__tests__/api/lending/active.route.test.ts`
- Modify: `src/__tests__/api/lending/return.route.test.ts`

**Interfaces:**
- Consumes: `buildAuthCookieHeader`, `relayRefreshedAccessToken` from `@/src/app/api/_authFetch` (Task 1).

- [ ] **Step 1: Apply the pattern to `lending/route.ts`**

Replace the full contents of `src/app/api/lending/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function POST(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/lending`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookieHeader },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 2: Apply the pattern to `lending/active/route.ts`**

Replace the full contents of `src/app/api/lending/active/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/lending/active`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => []);
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 3: Apply the pattern to `lending/[id]/return/route.ts`**

Replace the full contents of `src/app/api/lending/[id]/return/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/lending/${id}/return`, {
            method: "PUT",
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 4: Update `lending.route.test.ts`**

Replace the full contents of `src/__tests__/api/lending/lending.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "@/src/app/api/lending/route";

function makeReq(body: object, cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/lending", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/lending", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await POST(makeReq({ bookId: 1, memberId: 2, lentDate: "2026-08-05" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body and Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 9, bookId: 1, memberId: 2, status: "ACTIVE" }) });
        await POST(makeReq({ bookId: 1, memberId: 2, lentDate: "2026-08-05" }, "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/lending");
        expect(opts.method).toBe("POST");
        expect(opts.headers.Cookie).toBe("access_token=tok");
        expect(JSON.parse(opts.body)).toEqual({ bookId: 1, memberId: 2, lentDate: "2026-08-05" });
    });

    it("proxies the 201 response from the backend", async () => {
        const lending = { id: 9, bookId: 1, memberId: 2, status: "ACTIVE" };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve(lending) });
        const res = await POST(makeReq({ bookId: 1, memberId: 2, lentDate: "2026-08-05" }, "access_token=tok"));
        expect(res.status).toBe(201);
        expect(await res.json()).toEqual(lending);
    });

    it("propagates a non-2xx status from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ message: "Invalid lending" }) });
        const res = await POST(makeReq({ bookId: 0, memberId: 0, lentDate: "" }, "access_token=tok"));
        expect(res.status).toBe(400);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await POST(makeReq({ bookId: 1, memberId: 2, lentDate: "2026-08-05" }, "access_token=tok"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 5: Update `active.route.test.ts`**

Replace the full contents of `src/__tests__/api/lending/active.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/lending/active/route";

const MOCK_LENDINGS = [{
    id: 1, bookId: 5, memberId: 3, userId: 42,
    lentDate: "2026-06-01", expectedReturnDate: "2026-07-01",
    actualReturnDate: null, status: "ACTIVE",
}];

function makeReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/lending/active", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/lending/active", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeReq()); expect(res.status).toBe(401);
    });
    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        const res = await GET(makeReq("refresh_token=rtok")); expect(res.status).toBe(200);
    });
    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(MOCK_LENDINGS) });
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(200); expect(await res.json()).toEqual(MOCK_LENDINGS);
    });
    it("sends a Cookie header to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("access_token=my-token"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Cookie).toBe("access_token=my-token");
    });
    it("returns 503 when backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(503);
        expect((await res.json()).message).toMatch(/unable to reach/i);
    });
    it("propagates non-200 status from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ message: "Bad request" }) });
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(400);
    });
});
```

- [ ] **Step 6: Update `return.route.test.ts`**

Replace the full contents of `src/__tests__/api/lending/return.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { PUT } from "@/src/app/api/lending/[id]/return/route";

function ctx(id: string) {
    return { params: Promise.resolve({ id }) };
}

function makeReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/lending/9/return", {
        method: "PUT",
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("PUT /api/lending/[id]/return", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await PUT(makeReq(), ctx("9"));
        expect(res.status).toBe(401);
    });

    it("requests the correct backend path with a Cookie header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 9, status: "RETURNED" }) });
        await PUT(makeReq("access_token=tok"), ctx("9"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/lending/9/return");
        expect(opts.method).toBe("PUT");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("proxies the 200 response from the backend", async () => {
        const lending = { id: 9, status: "RETURNED" };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(lending) });
        const res = await PUT(makeReq("access_token=tok"), ctx("9"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(lending);
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Lending not found" }) });
        const res = await PUT(makeReq("access_token=tok"), ctx("999"));
        expect(res.status).toBe(404);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await PUT(makeReq("access_token=tok"), ctx("9"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 7: Run tests and typecheck**

Run: `npx jest src/__tests__/api/lending`
Expected: PASS.

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/lending src/__tests__/api/lending
git commit -m "fix(api): forward auth cookies for lending routes (see book routes fix)"
```

---

### Task 6: `books/count` and `preferences` routes

**Files:**
- Modify: `src/app/api/books/count/route.ts`
- Modify: `src/app/api/preferences/route.ts`
- Modify: `src/__tests__/api/books/count.route.test.ts`
- Modify: `src/__tests__/api/preferences/preferences.route.test.ts`

**Interfaces:**
- Consumes: `buildAuthCookieHeader`, `relayRefreshedAccessToken` from `@/src/app/api/_authFetch` (Task 1).

- [ ] **Step 1: Apply the pattern to `books/count/route.ts`**

Replace the full contents of `src/app/api/books/count/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/count-user-books`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => 0);
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 2: Apply the pattern to `preferences/route.ts`**

Replace the full contents of `src/app/api/preferences/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/preferences`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}

export async function PUT(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/preferences`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookieHeader },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 3: Update `count.route.test.ts`**

Replace the full contents of `src/__tests__/api/books/count.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/books/count/route";

function makeReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/books/count", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/books/count", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeReq());
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(12) });
        const res = await GET(makeReq("refresh_token=rtok"));
        expect(res.status).toBe(200);
    });

    it("requests the backend count-user-books path with a Cookie header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(12) });
        await GET(makeReq("access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/count-user-books");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("proxies the 200 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(12) });
        const res = await GET(makeReq("access_token=tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toBe(12);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("access_token=tok"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 4: Update `preferences.route.test.ts`**

Replace the full contents of `src/__tests__/api/preferences/preferences.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, PUT } from "@/src/app/api/preferences/route";

function makeGetReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/preferences", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

function makePutReq(body: object, cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/preferences", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("GET /api/preferences", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeGetReq());
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) });
        const res = await GET(makeGetReq("refresh_token=rtok"));
        expect(res.status).toBe(200);
    });

    it("proxies the 200 response from the backend", async () => {
        const prefs = { libraryName: "My Library", defaultLoanDurationDays: 30, dateFormat: "DD MMM YYYY", language: "en" };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(prefs) });
        const res = await GET(makeGetReq("access_token=tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(prefs);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeGetReq("access_token=tok"));
        expect(res.status).toBe(503);
    });
});

describe("PUT /api/preferences", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await PUT(makePutReq({ libraryName: "My Library" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body and Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ libraryName: "My Library" }) });
        await PUT(makePutReq({ libraryName: "My Library" }, "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/preferences");
        expect(opts.headers.Cookie).toBe("access_token=tok");
        expect(JSON.parse(opts.body)).toEqual({ libraryName: "My Library" });
    });

    it("proxies the 200 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ libraryName: "My Library" }) });
        const res = await PUT(makePutReq({ libraryName: "My Library" }, "access_token=tok"));
        expect(res.status).toBe(200);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await PUT(makePutReq({ libraryName: "My Library" }, "access_token=tok"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx jest src/__tests__/api/books src/__tests__/api/preferences`
Expected: PASS.

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/books src/app/api/preferences src/__tests__/api/books src/__tests__/api/preferences
git commit -m "fix(api): forward auth cookies for books/count and preferences routes (see book routes fix)"
```

---

### Task 7: `dashboard` routes

**Files:**
- Modify: `src/app/api/dashboard/stats/books/route.ts`
- Modify: `src/app/api/dashboard/stats/overdue/route.ts`
- Modify: `src/app/api/dashboard/stats/lent-out/route.ts`
- Modify: `src/app/api/dashboard/recent-activity/route.ts`
- Modify: `src/app/api/dashboard/recently-added/route.ts`
- Modify: `src/__tests__/api/dashboard/stats-books.route.test.ts`
- Modify: `src/__tests__/api/dashboard/stats-overdue.route.test.ts`
- Modify: `src/__tests__/api/dashboard/stats-lent-out.route.test.ts`
- Modify: `src/__tests__/api/dashboard/recent-activity.route.test.ts`
- Modify: `src/__tests__/api/dashboard/recently-added.route.test.ts`

**Interfaces:**
- Consumes: `buildAuthCookieHeader`, `relayRefreshedAccessToken` from `@/src/app/api/_authFetch` (Task 1).

- [ ] **Step 1: Apply the pattern to `dashboard/stats/books/route.ts`**

Replace the full contents of `src/app/api/dashboard/stats/books/route.ts` with:

```ts
import {NextRequest, NextResponse} from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/dashboard/stats/books`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 2: Apply the pattern to `dashboard/stats/overdue/route.ts`**

Replace the full contents of `src/app/api/dashboard/stats/overdue/route.ts` with:

```ts
import {NextRequest, NextResponse} from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/dashboard/stats/overdue`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 3: Apply the pattern to `dashboard/stats/lent-out/route.ts`**

Replace the full contents of `src/app/api/dashboard/stats/lent-out/route.ts` with:

```ts
import {NextRequest, NextResponse} from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/dashboard/stats/lent-out`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 4: Apply the pattern to `dashboard/recent-activity/route.ts`**

Replace the full contents of `src/app/api/dashboard/recent-activity/route.ts` with:

```ts
import {NextRequest, NextResponse} from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/dashboard/recent-activity?limit=5`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => []);
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 5: Apply the pattern to `dashboard/recently-added/route.ts`**

Replace the full contents of `src/app/api/dashboard/recently-added/route.ts` with:

```ts
import {NextRequest, NextResponse} from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/dashboard/recently-added?limit=5`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => []);
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
```

- [ ] **Step 6: Update `stats-books.route.test.ts`**

Replace the full contents of `src/__tests__/api/dashboard/stats-books.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/dashboard/stats/books/route";

function makeReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/dashboard/stats/books", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/dashboard/stats/books", () => {
    beforeEach(() => {
        process.env.API_BASE_URL = "http://backend";
        global.fetch = jest.fn();
    });

    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeReq());
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ totalBooks: 0, addedThisMonth: 0 }) });
        const res = await GET(makeReq("refresh_token=rtok"));
        expect(res.status).toBe(200);
    });

    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true, status: 200,
            json: () => Promise.resolve({ totalBooks: 12, addedThisMonth: 3 }),
        });
        const res = await GET(makeReq("access_token=tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ totalBooks: 12, addedThisMonth: 3 });
    });

    it("sends a Cookie header to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true, status: 200,
            json: () => Promise.resolve({ totalBooks: 0, addedThisMonth: 0 }),
        });
        await GET(makeReq("access_token=my-token"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Cookie).toBe("access_token=my-token");
    });

    it("returns 503 when backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("access_token=tok"));
        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.message).toMatch(/unable to reach/i);
    });

    it("propagates non-200 status from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false, status: 400,
            json: () => Promise.resolve({ message: "Bad request" }),
        });
        const res = await GET(makeReq("access_token=tok"));
        expect(res.status).toBe(400);
    });
});
```

- [ ] **Step 7: Update `stats-overdue.route.test.ts`**

Replace the full contents of `src/__tests__/api/dashboard/stats-overdue.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/dashboard/stats/overdue/route";

function makeReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/dashboard/stats/overdue", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/dashboard/stats/overdue", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeReq()); expect(res.status).toBe(401);
    });
    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ totalOverdue: 0 }) });
        const res = await GET(makeReq("refresh_token=rtok")); expect(res.status).toBe(200);
    });
    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ totalOverdue: 2 }) });
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(200); expect(await res.json()).toEqual({ totalOverdue: 2 });
    });
    it("sends a Cookie header to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ totalOverdue: 0 }) });
        await GET(makeReq("access_token=my-token"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Cookie).toBe("access_token=my-token");
    });
    it("returns 503 when backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(503);
        expect((await res.json()).message).toMatch(/unable to reach/i);
    });
    it("propagates non-200 status from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ message: "Bad request" }) });
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(400);
    });
});
```

- [ ] **Step 8: Update `stats-lent-out.route.test.ts`**

Replace the full contents of `src/__tests__/api/dashboard/stats-lent-out.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/dashboard/stats/lent-out/route";

function makeReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/dashboard/stats/lent-out", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/dashboard/stats/lent-out", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeReq()); expect(res.status).toBe(401);
    });
    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ totalLentOut: 0, uniqueLendees: 0 }) });
        const res = await GET(makeReq("refresh_token=rtok")); expect(res.status).toBe(200);
    });
    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ totalLentOut: 5, uniqueLendees: 3 }) });
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(200); expect(await res.json()).toEqual({ totalLentOut: 5, uniqueLendees: 3 });
    });
    it("sends a Cookie header to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ totalLentOut: 0, uniqueLendees: 0 }) });
        await GET(makeReq("access_token=my-token"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Cookie).toBe("access_token=my-token");
    });
    it("returns 503 when backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(503);
        expect((await res.json()).message).toMatch(/unable to reach/i);
    });
    it("propagates non-200 status from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ message: "Bad request" }) });
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(400);
    });
});
```

- [ ] **Step 9: Update `recent-activity.route.test.ts`**

Replace the full contents of `src/__tests__/api/dashboard/recent-activity.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/dashboard/recent-activity/route";

const MOCK_ACTIVITY = [
    { id: 1, action: "LENT", bookName: "Dune", memberName: "Jane", occurredAt: "2026-06-01T10:00:00" },
];

function makeReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/dashboard/recent-activity", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/dashboard/recent-activity", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeReq()); expect(res.status).toBe(401);
    });
    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        const res = await GET(makeReq("refresh_token=rtok")); expect(res.status).toBe(200);
    });
    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(MOCK_ACTIVITY) });
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(200); expect(await res.json()).toEqual(MOCK_ACTIVITY);
    });
    it("forwards limit=5 query param to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("access_token=tok"));
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("limit=5");
    });
    it("sends a Cookie header to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("access_token=my-token"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Cookie).toBe("access_token=my-token");
    });
    it("returns 503 when backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(503);
        expect((await res.json()).message).toMatch(/unable to reach/i);
    });
});
```

- [ ] **Step 10: Update `recently-added.route.test.ts`**

Replace the full contents of `src/__tests__/api/dashboard/recently-added.route.test.ts` with:

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/dashboard/recently-added/route";

const MOCK_BOOKS = [
    { id: 1, name: "Dune", author: "Herbert", genre: "Sci-Fi", status: "OWNED", rating: 5 },
];

function makeReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/dashboard/recently-added", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/dashboard/recently-added", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeReq()); expect(res.status).toBe(401);
    });
    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        const res = await GET(makeReq("refresh_token=rtok")); expect(res.status).toBe(200);
    });
    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(MOCK_BOOKS) });
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(200); expect(await res.json()).toEqual(MOCK_BOOKS);
    });
    it("forwards limit=5 query param to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("access_token=tok"));
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("limit=5");
    });
    it("sends a Cookie header to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("access_token=my-token"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Cookie).toBe("access_token=my-token");
    });
    it("returns 503 when backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(503);
        expect((await res.json()).message).toMatch(/unable to reach/i);
    });
});
```

- [ ] **Step 11: Run tests and typecheck**

Run: `npx jest src/__tests__/api/dashboard`
Expected: PASS.

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 12: Commit**

```bash
git add src/app/api/dashboard src/__tests__/api/dashboard
git commit -m "fix(api): forward auth cookies for dashboard routes (see book routes fix)"
```

---

## Final Verification

- [ ] **Run the full test suite and typecheck**

Run: `npx jest`
Expected: all suites pass (baseline was 522/522 before this plan; expect that count to grow by the new `_authFetch.test.ts` tests and the "proceeds when only refresh_token is present" tests added per route — no suite should fail).

Run: `npm run typecheck`
Expected: no errors.

Run: `npm run lint`
Expected: no errors.

- [ ] **Manual smoke test (optional but recommended)**

With the backend running locally and this frontend pointed at it:
1. Sign up / log in normally — confirm the app works as before.
2. In devtools, manually delete the `access_token` cookie (simulating its 1-hour expiry) while leaving `refresh_token` in place.
3. Navigate to any authenticated page (e.g. Books, Dashboard). Expected: the page loads normally (not a forced logout), and a fresh `access_token` cookie reappears in devtools — the backend transparently refreshed it and this frontend relayed it back.
