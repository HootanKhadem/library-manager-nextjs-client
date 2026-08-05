# Backend API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Proxy every remaining backend endpoint (book, author, genre, member, lending create/return, admin users) through Next.js Route Handlers, and wire the three that have an existing UI hook point (create book, lend a book, return a book) into real data.

**Architecture:** Each backend endpoint gets a thin Next.js Route Handler under `src/app/api/**` that reads the `access_token` cookie, forwards the request to `${process.env.API_BASE_URL}<backend-path>` with an `Authorization: Bearer` header, and passes the backend's status/body straight back to the browser. No new client-side domain types for pass-through routes — only the three UI-wiring tasks need typed payloads.

**Tech Stack:** Next.js 16 (App Router Route Handlers, async `params`), Jest + `@jest-environment node` for route tests, React Testing Library for component tests.

## Global Constraints

- Backend base URL: `process.env.API_BASE_URL` (already set in `.env` / test env via `beforeEach`).
- Auth: read the `access_token` cookie via `req.cookies.get("access_token")?.value`; if absent, return `401 { message: "Unauthorized" }` before making any network call.
- Network failure: catch the `fetch` and return `503 { message: "Unable to reach the server. Please try again." }`.
- Success/error passthrough: forward the backend's exact status code and JSON body (`res.json().catch(() => <fallback>)`, `NextResponse.json(data, { status: res.status })`).
- `204 No Content` responses (genre/member delete) must not call `.json()` — return `new NextResponse(null, { status: 204 })` directly when `res.status === 204`.
- Next.js 16 dynamic route handlers receive `context: { params: Promise<{ id: string }> }` — always `await context.params`.
- Route tests live in `src/__tests__/api/**`, mirror the existing files (`/** @jest-environment node */` header, `NextRequest` from `next/server`, `global.fetch = jest.fn()` in `beforeEach`, `jest.resetAllMocks()` in `afterEach`).
- Backend `Book.status` enum (confirmed by user): `OWNED` (default; also set when a lent book is returned), `LENT_OUT` (set when currently lent to a member). No other values are backend-recognized — the client's `Wishlist`/`Read` statuses stay client-only and are never sent to the backend.

---

### Task 1: POST /api/book proxy route

**Files:**
- Create: `src/app/api/book/route.ts`
- Test: `src/__tests__/api/book/book.route.test.ts`

**Interfaces:**
- Produces: `POST /api/book` — forwards `req.json()` body to backend `POST /api/book`, returns backend's `Book` JSON and status.

- [ ] **Step 1: Write the failing test**

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "@/src/app/api/book/route";

function makeReq(body: object, token?: string): NextRequest {
    return new NextRequest("http://localhost/api/book", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `access_token=${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/book", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await POST(makeReq({ name: "Dune" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body and Authorization header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Dune" }) });
        await POST(makeReq({ name: "Dune" }, "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book");
        expect(opts.headers.Authorization).toBe("Bearer tok");
        expect(JSON.parse(opts.body)).toEqual({ name: "Dune" });
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Dune" }) });
        const res = await POST(makeReq({ name: "Dune" }, "tok"));
        expect(res.status).toBe(201);
        expect(await res.json()).toEqual({ id: 1, name: "Dune" });
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await POST(makeReq({ name: "Dune" }, "tok"));
        expect(res.status).toBe(503);
        expect((await res.json()).message).toMatch(/unable to reach/i);
    });

    it("propagates a non-2xx status from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ message: "Invalid book" }) });
        const res = await POST(makeReq({ name: "" }, "tok"));
        expect(res.status).toBe(400);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/api/book/book.route.test.ts`
Expected: FAIL — `Cannot find module '@/src/app/api/book/route'`

- [ ] **Step 3: Write minimal implementation**

```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/book`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/api/book/book.route.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/book/route.ts src/__tests__/api/book/book.route.test.ts
git commit -m "feat: proxy POST /api/book through BFF"
```

---

### Task 2: GET /api/book/[id] proxy route

**Files:**
- Create: `src/app/api/book/[id]/route.ts`
- Test: `src/__tests__/api/book/book-id.route.test.ts`

**Interfaces:**
- Produces: `GET /api/book/:id` — forwards to backend `GET /api/book/{id}`, returns backend's `Book` JSON and status (including `404`).

- [ ] **Step 1: Write the failing test**

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/book/[id]/route";

function makeReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/book/42", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

function ctx(id: string) {
    return { params: Promise.resolve({ id }) };
}

describe("GET /api/book/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq(), ctx("42"));
        expect(res.status).toBe(401);
    });

    it("requests the backend path with the given id and Bearer header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 42, name: "Dune" }) });
        await GET(makeReq("tok"), ctx("42"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book/42");
        expect(opts.headers.Authorization).toBe("Bearer tok");
    });

    it("proxies the 200 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 42, name: "Dune" }) });
        const res = await GET(makeReq("tok"), ctx("42"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ id: 42, name: "Dune" });
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Book not found" }) });
        const res = await GET(makeReq("tok"), ctx("999"));
        expect(res.status).toBe(404);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("tok"), ctx("42"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/api/book/book-id.route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/book/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/api/book/book-id.route.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/book/[id]/route.ts" src/__tests__/api/book/book-id.route.test.ts
git commit -m "feat: proxy GET /api/book/:id through BFF"
```

---

### Task 3: GET /api/books/count proxy route

**Files:**
- Create: `src/app/api/books/count/route.ts`
- Test: `src/__tests__/api/books/count.route.test.ts`

**Interfaces:**
- Produces: `GET /api/books/count` — forwards to backend `GET /count-user-books`, returns the raw integer JSON and status.

- [ ] **Step 1: Write the failing test**

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/books/count/route";

function makeReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/books/count", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/books/count", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq());
        expect(res.status).toBe(401);
    });

    it("requests the backend count-user-books path with a Bearer header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(12) });
        await GET(makeReq("tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/count-user-books");
        expect(opts.headers.Authorization).toBe("Bearer tok");
    });

    it("proxies the 200 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(12) });
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toBe(12);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/api/books/count.route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/count-user-books`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => 0);
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/api/books/count.route.test.ts`
Expected: PASS (4/4)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/books/count/route.ts src/__tests__/api/books/count.route.test.ts
git commit -m "feat: proxy GET /api/books/count through BFF"
```

---

### Task 4: POST /api/author proxy route

**Files:**
- Create: `src/app/api/author/route.ts`
- Test: `src/__tests__/api/author/author.route.test.ts`

**Interfaces:**
- Produces: `POST /api/author` — forwards `req.json()` body to backend `POST /api/author`, returns backend's `Author` JSON and status.

- [ ] **Step 1: Write the failing test**

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "@/src/app/api/author/route";

function makeReq(body: object, token?: string): NextRequest {
    return new NextRequest("http://localhost/api/author", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `access_token=${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/author", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await POST(makeReq({ name: "Borges", image: "" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body and Authorization header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Borges" }) });
        await POST(makeReq({ name: "Borges", image: "" }, "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author");
        expect(opts.headers.Authorization).toBe("Bearer tok");
        expect(JSON.parse(opts.body)).toEqual({ name: "Borges", image: "" });
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Borges" }) });
        const res = await POST(makeReq({ name: "Borges", image: "" }, "tok"));
        expect(res.status).toBe(201);
        expect(await res.json()).toEqual({ id: 1, name: "Borges" });
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await POST(makeReq({ name: "Borges", image: "" }, "tok"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/api/author/author.route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/author`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/api/author/author.route.test.ts`
Expected: PASS (4/4)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/author/route.ts src/__tests__/api/author/author.route.test.ts
git commit -m "feat: proxy POST /api/author through BFF"
```

---

### Task 5: GET /api/author/search proxy route

**Files:**
- Create: `src/app/api/author/search/route.ts`
- Test: `src/__tests__/api/author/search.route.test.ts`

**Interfaces:**
- Produces: `GET /api/author/search?query=` — forwards the `query` param to backend `GET /api/author/search`, returns the `Author[]` JSON and status.

- [ ] **Step 1: Write the failing test**

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/author/search/route";

function makeReq(query: string, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/author/search?query=${encodeURIComponent(query)}`, {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/author/search", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq("borges"));
        expect(res.status).toBe(401);
    });

    it("forwards the query param and Authorization header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("borges", "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author/search?query=borges");
        expect(opts.headers.Authorization).toBe("Bearer tok");
    });

    it("proxies the 200 response from the backend", async () => {
        const authors = [{ id: 1, name: "Jorge Luis Borges" }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(authors) });
        const res = await GET(makeReq("borges", "tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(authors);
    });

    it("defaults to an empty query string when none is given", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("", "tok"));
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author/search?query=");
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("borges", "tok"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/api/author/search.route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const query = req.nextUrl.searchParams.get("query") ?? "";

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/author/search?query=${encodeURIComponent(query)}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => []);
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/api/author/search.route.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/author/search/route.ts src/__tests__/api/author/search.route.test.ts
git commit -m "feat: proxy GET /api/author/search through BFF"
```

---

### Task 6: GET+POST /api/genre proxy route

**Files:**
- Create: `src/app/api/genre/route.ts`
- Test: `src/__tests__/api/genre/genre.route.test.ts`

**Interfaces:**
- Produces: `GET /api/genre` — proxies backend `GET /api/genre`, returns `Genre[]`.
- Produces: `POST /api/genre` — forwards body to backend `POST /api/genre`, returns created `Genre`.

- [ ] **Step 1: Write the failing test**

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, POST } from "@/src/app/api/genre/route";

function makeGetReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/genre", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

function makePostReq(body: object, token?: string): NextRequest {
    return new NextRequest("http://localhost/api/genre", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `access_token=${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("GET /api/genre", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeGetReq());
        expect(res.status).toBe(401);
    });

    it("proxies the 200 response from the backend", async () => {
        const genres = [{ id: 1, name: "Fiction" }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(genres) });
        const res = await GET(makeGetReq("tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(genres);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeGetReq("tok"));
        expect(res.status).toBe(503);
    });
});

describe("POST /api/genre", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await POST(makePostReq({ name: "Fiction" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body and Authorization header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Fiction" }) });
        await POST(makePostReq({ name: "Fiction" }, "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/genre");
        expect(opts.headers.Authorization).toBe("Bearer tok");
        expect(JSON.parse(opts.body)).toEqual({ name: "Fiction" });
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Fiction" }) });
        const res = await POST(makePostReq({ name: "Fiction" }, "tok"));
        expect(res.status).toBe(201);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/api/genre/genre.route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/genre`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => []);
    return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/genre`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/api/genre/genre.route.test.ts`
Expected: PASS (6/6)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/genre/route.ts src/__tests__/api/genre/genre.route.test.ts
git commit -m "feat: proxy GET+POST /api/genre through BFF"
```

---

### Task 7: PUT+DELETE /api/genre/[id] proxy route

**Files:**
- Create: `src/app/api/genre/[id]/route.ts`
- Test: `src/__tests__/api/genre/genre-id.route.test.ts`

**Interfaces:**
- Produces: `PUT /api/genre/:id` — forwards body to backend `PUT /api/genre/{id}`, returns updated `Genre`.
- Produces: `DELETE /api/genre/:id` — forwards to backend `DELETE /api/genre/{id}`, returns `204` with empty body on success.

- [ ] **Step 1: Write the failing test**

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { PUT, DELETE } from "@/src/app/api/genre/[id]/route";

function ctx(id: string) {
    return { params: Promise.resolve({ id }) };
}

function makePutReq(body: object, token?: string): NextRequest {
    return new NextRequest("http://localhost/api/genre/1", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `access_token=${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

function makeDeleteReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/genre/1", {
        method: "DELETE",
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("PUT /api/genre/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await PUT(makePutReq({ name: "Fiction" }), ctx("1"));
        expect(res.status).toBe(401);
    });

    it("forwards the body to the correct backend path", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 1, name: "Fiction" }) });
        await PUT(makePutReq({ name: "Fiction" }, "tok"), ctx("1"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/genre/1");
        expect(opts.method).toBe("PUT");
        expect(JSON.parse(opts.body)).toEqual({ name: "Fiction" });
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Genre not found" }) });
        const res = await PUT(makePutReq({ name: "Fiction" }, "tok"), ctx("999"));
        expect(res.status).toBe(404);
    });
});

describe("DELETE /api/genre/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await DELETE(makeDeleteReq(), ctx("1"));
        expect(res.status).toBe(401);
    });

    it("returns 204 with no body on successful deletion", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        const res = await DELETE(makeDeleteReq("tok"), ctx("1"));
        expect(res.status).toBe(204);
    });

    it("requests the correct backend path", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        await DELETE(makeDeleteReq("tok"), ctx("1"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/genre/1");
        expect(opts.method).toBe("DELETE");
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await DELETE(makeDeleteReq("tok"), ctx("1"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/api/genre/genre-id.route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```ts
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/genre/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/genre/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/api/genre/genre-id.route.test.ts`
Expected: PASS (7/7)

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/genre/[id]/route.ts" src/__tests__/api/genre/genre-id.route.test.ts
git commit -m "feat: proxy PUT+DELETE /api/genre/:id through BFF"
```

---

### Task 8: GET+POST /api/member proxy route

**Files:**
- Create: `src/app/api/member/route.ts`
- Test: `src/__tests__/api/member/member.route.test.ts`

**Interfaces:**
- Produces: `GET /api/member` — proxies backend `GET /api/member`, returns `Member[]`.
- Produces: `POST /api/member` — forwards body to backend `POST /api/member`, returns created `Member`.

Same shape as Task 6, targeting `/api/member` instead of `/api/genre`.

- [ ] **Step 1: Write the failing test**

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, POST } from "@/src/app/api/member/route";

function makeGetReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/member", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

function makePostReq(body: object, token?: string): NextRequest {
    return new NextRequest("http://localhost/api/member", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `access_token=${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("GET /api/member", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeGetReq());
        expect(res.status).toBe(401);
    });

    it("proxies the 200 response from the backend", async () => {
        const members = [{ id: 1, name: "Lucas Martinez" }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(members) });
        const res = await GET(makeGetReq("tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(members);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeGetReq("tok"));
        expect(res.status).toBe(503);
    });
});

describe("POST /api/member", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await POST(makePostReq({ name: "Lucas Martinez" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body and Authorization header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Lucas Martinez" }) });
        await POST(makePostReq({ name: "Lucas Martinez" }, "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/member");
        expect(opts.headers.Authorization).toBe("Bearer tok");
        expect(JSON.parse(opts.body)).toEqual({ name: "Lucas Martinez" });
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Lucas Martinez" }) });
        const res = await POST(makePostReq({ name: "Lucas Martinez" }, "tok"));
        expect(res.status).toBe(201);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/api/member/member.route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/member`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => []);
    return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/member`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/api/member/member.route.test.ts`
Expected: PASS (6/6)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/member/route.ts src/__tests__/api/member/member.route.test.ts
git commit -m "feat: proxy GET+POST /api/member through BFF"
```

---

### Task 9: PUT+DELETE /api/member/[id] proxy route

**Files:**
- Create: `src/app/api/member/[id]/route.ts`
- Test: `src/__tests__/api/member/member-id.route.test.ts`

**Interfaces:**
- Produces: `PUT /api/member/:id` — forwards body to backend `PUT /api/member/{id}`, returns updated `Member`.
- Produces: `DELETE /api/member/:id` — forwards to backend `DELETE /api/member/{id}`, returns `204` on success.

Same shape as Task 7, targeting `/api/member` instead of `/api/genre`.

- [ ] **Step 1: Write the failing test**

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { PUT, DELETE } from "@/src/app/api/member/[id]/route";

function ctx(id: string) {
    return { params: Promise.resolve({ id }) };
}

function makePutReq(body: object, token?: string): NextRequest {
    return new NextRequest("http://localhost/api/member/1", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `access_token=${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

function makeDeleteReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/member/1", {
        method: "DELETE",
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("PUT /api/member/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await PUT(makePutReq({ name: "Lucas Martinez" }), ctx("1"));
        expect(res.status).toBe(401);
    });

    it("forwards the body to the correct backend path", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 1, name: "Lucas Martinez" }) });
        await PUT(makePutReq({ name: "Lucas Martinez" }, "tok"), ctx("1"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/member/1");
        expect(opts.method).toBe("PUT");
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Member not found" }) });
        const res = await PUT(makePutReq({ name: "Lucas Martinez" }, "tok"), ctx("999"));
        expect(res.status).toBe(404);
    });
});

describe("DELETE /api/member/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await DELETE(makeDeleteReq(), ctx("1"));
        expect(res.status).toBe(401);
    });

    it("returns 204 with no body on successful deletion", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        const res = await DELETE(makeDeleteReq("tok"), ctx("1"));
        expect(res.status).toBe(204);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await DELETE(makeDeleteReq("tok"), ctx("1"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/api/member/member-id.route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```ts
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/member/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/member/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/api/member/member-id.route.test.ts`
Expected: PASS (6/6)

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/member/[id]/route.ts" src/__tests__/api/member/member-id.route.test.ts
git commit -m "feat: proxy PUT+DELETE /api/member/:id through BFF"
```

---

### Task 10: POST /api/lending proxy route

**Files:**
- Create: `src/app/api/lending/route.ts`
- Test: `src/__tests__/api/lending/lending.route.test.ts`

**Interfaces:**
- Produces: `POST /api/lending` — forwards `{ bookId, memberId, lentDate, expectedReturnDate? }` to backend `POST /api/lending`, returns the created `Lending` (shape matches the existing `ActiveLending` type in `src/lib/types.ts`).

- [ ] **Step 1: Write the failing test**

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "@/src/app/api/lending/route";

function makeReq(body: object, token?: string): NextRequest {
    return new NextRequest("http://localhost/api/lending", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `access_token=${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/lending", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await POST(makeReq({ bookId: 1, memberId: 2, lentDate: "2026-08-05" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body and Authorization header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 9, bookId: 1, memberId: 2, status: "ACTIVE" }) });
        await POST(makeReq({ bookId: 1, memberId: 2, lentDate: "2026-08-05" }, "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/lending");
        expect(opts.headers.Authorization).toBe("Bearer tok");
        expect(JSON.parse(opts.body)).toEqual({ bookId: 1, memberId: 2, lentDate: "2026-08-05" });
    });

    it("proxies the 201 response from the backend", async () => {
        const lending = { id: 9, bookId: 1, memberId: 2, status: "ACTIVE" };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve(lending) });
        const res = await POST(makeReq({ bookId: 1, memberId: 2, lentDate: "2026-08-05" }, "tok"));
        expect(res.status).toBe(201);
        expect(await res.json()).toEqual(lending);
    });

    it("propagates a non-2xx status from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ message: "Invalid lending" }) });
        const res = await POST(makeReq({ bookId: 0, memberId: 0, lentDate: "" }, "tok"));
        expect(res.status).toBe(400);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await POST(makeReq({ bookId: 1, memberId: 2, lentDate: "2026-08-05" }, "tok"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/api/lending/lending.route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/lending`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/api/lending/lending.route.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/lending/route.ts src/__tests__/api/lending/lending.route.test.ts
git commit -m "feat: proxy POST /api/lending through BFF"
```

---

### Task 11: PUT /api/lending/[id]/return proxy route

**Files:**
- Create: `src/app/api/lending/[id]/return/route.ts`
- Test: `src/__tests__/api/lending/return.route.test.ts`

**Interfaces:**
- Produces: `PUT /api/lending/:id/return` — forwards to backend `PUT /api/lending/{id}/return` (no request body), returns the updated `Lending`.

- [ ] **Step 1: Write the failing test**

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { PUT } from "@/src/app/api/lending/[id]/return/route";

function ctx(id: string) {
    return { params: Promise.resolve({ id }) };
}

function makeReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/lending/9/return", {
        method: "PUT",
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("PUT /api/lending/[id]/return", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await PUT(makeReq(), ctx("9"));
        expect(res.status).toBe(401);
    });

    it("requests the correct backend path with a Bearer header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 9, status: "RETURNED" }) });
        await PUT(makeReq("tok"), ctx("9"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/lending/9/return");
        expect(opts.method).toBe("PUT");
        expect(opts.headers.Authorization).toBe("Bearer tok");
    });

    it("proxies the 200 response from the backend", async () => {
        const lending = { id: 9, status: "RETURNED" };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(lending) });
        const res = await PUT(makeReq("tok"), ctx("9"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(lending);
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Lending not found" }) });
        const res = await PUT(makeReq("tok"), ctx("999"));
        expect(res.status).toBe(404);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await PUT(makeReq("tok"), ctx("9"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/api/lending/return.route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```ts
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/lending/${id}/return`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/api/lending/return.route.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/lending/[id]/return/route.ts" src/__tests__/api/lending/return.route.test.ts
git commit -m "feat: proxy PUT /api/lending/:id/return through BFF"
```

---

### Task 12: POST /api/admin/users proxy route

**Files:**
- Create: `src/app/api/admin/users/route.ts`
- Test: `src/__tests__/api/admin/users.route.test.ts`

**Interfaces:**
- Produces: `POST /api/admin/users` — forwards body to backend `POST /admin/users`, returns created `UserDTO` and status. Backend enforces the `ADMIN` role and returns `403` for non-admins — the route just passes that through.

- [ ] **Step 1: Write the failing test**

```ts
/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "@/src/app/api/admin/users/route";

function makeReq(body: object, token?: string): NextRequest {
    return new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `access_token=${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/admin/users", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await POST(makeReq({ name: "New User", email: "n@u.com", password: "pw", role: "USER" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body to backend /admin/users with a Bearer header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "New User" }) });
        await POST(makeReq({ name: "New User", email: "n@u.com", password: "pw", role: "USER" }, "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/admin/users");
        expect(opts.headers.Authorization).toBe("Bearer tok");
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "New User" }) });
        const res = await POST(makeReq({ name: "New User", email: "n@u.com", password: "pw", role: "USER" }, "tok"));
        expect(res.status).toBe(201);
    });

    it("propagates a 403 from the backend when the caller isn't an admin", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 403, json: () => Promise.resolve({ message: "Forbidden" }) });
        const res = await POST(makeReq({ name: "New User", email: "n@u.com", password: "pw", role: "USER" }, "tok"));
        expect(res.status).toBe(403);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await POST(makeReq({ name: "New User", email: "n@u.com", password: "pw", role: "USER" }, "tok"));
        expect(res.status).toBe(503);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/api/admin/users.route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/admin/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/api/admin/users.route.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/users/route.ts src/__tests__/api/admin/users.route.test.ts
git commit -m "feat: proxy POST /admin/users through BFF"
```

---

### Task 13: Wire AddBookModal to real POST /api/book

**Files:**
- Modify: `src/lib/types.ts` (add `quantity` to `NewBookFormData`)
- Modify: `src/components/AddBookModal.tsx` (add Quantity field)
- Modify: `src/contexts/LibraryContext.tsx` (`addBook` calls the real endpoint)
- Test: `src/__tests__/AddBookModal.test.tsx` (extend existing file)
- Test: `src/__tests__/LibraryContext.test.tsx` (new)

**Interfaces:**
- Consumes: `NewBookFormData` from `src/lib/types.ts` (existing fields: `title, author, year, genre, status, publisher, isbn, pages, rating, description, notes`).
- Produces: `NewBookFormData.quantity: string`; `useLibrary().addBook(data: NewBookFormData): Promise<{ ok: boolean }>` (was synchronous `void`, now async and returns whether the create succeeded so the modal can decide whether to close).

- [ ] **Step 1: Add `quantity` to the form type**

In `src/lib/types.ts`, extend `NewBookFormData`:

```ts
export interface NewBookFormData {
    title: string;
    author: string;
    year: string;
    genre: string;
    status: BookStatus;
    publisher: string;
    isbn: string;
    pages: string;
    quantity: string;
    rating: string;
    description: string;
    notes: string;
}
```

- [ ] **Step 2: Add the Quantity field to AddBookModal**

In `src/components/AddBookModal.tsx`, update `EMPTY_FORM` and add an input next to Pages:

```ts
const EMPTY_FORM: NewBookFormData = {
    title: "", author: "", year: "", genre: "", status: "Owned",
    publisher: "", isbn: "", pages: "", quantity: "1", rating: "", description: "", notes: "",
};
```

Add after the Pages `<Input>` (inside the same `grid` div):

```tsx
<Input
    label={t.addBook.fieldQuantity}
    name="quantity"
    type="number"
    value={form.quantity}
    onChange={handleChange}
    placeholder="1"
/>
```

Add `fieldQuantity: "Quantity"` to `src/lib/i18n/translations/en.ts` under the `addBook` section, and the Persian equivalent `"تعداد"` to `src/lib/i18n/translations/fa.ts`. Add `fieldQuantity: string` to the `addBook` shape in `src/lib/i18n/types.ts`.

- [ ] **Step 3: Write the failing test for the new field**

Add to `src/__tests__/AddBookModal.test.tsx` (follow the existing file's render/setup pattern):

```tsx
it("renders a quantity field defaulting to 1", () => {
    render(<AddBookModal onClose={jest.fn()} onAdd={jest.fn()} />);
    expect(screen.getByLabelText(/quantity/i)).toHaveValue(1);
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx jest src/__tests__/AddBookModal.test.tsx -t "quantity"`
Expected: FAIL — no element with label "quantity"

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/__tests__/AddBookModal.test.tsx -t "quantity"`
Expected: PASS

- [ ] **Step 6: Write the failing test for `LibraryContext.addBook`**

Create `src/__tests__/LibraryContext.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LibraryProvider, useLibrary } from "@/src/contexts/LibraryContext";
import { NewBookFormData } from "@/src/lib/types";

const FORM: NewBookFormData = {
    title: "Dune", author: "Frank Herbert", year: "1965", genre: "Science Fiction", status: "Owned",
    publisher: "Chilton", isbn: "123", pages: "412", quantity: "1", rating: "5", description: "", notes: "",
};

function Harness() {
    const { books, addBook } = useLibrary();
    return (
        <div>
            <button onClick={() => addBook(FORM)}>add</button>
            <ul>{books.map((b) => <li key={b.id}>{b.title}</li>)}</ul>
        </div>
    );
}

describe("LibraryContext.addBook", () => {
    beforeEach(() => { global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("POSTs a backend-shaped payload to /api/book", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 99 }) });
        render(<LibraryProvider><Harness /></LibraryProvider>);
        await userEvent.click(screen.getByText("add"));
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("/api/book");
        const body = JSON.parse(opts.body);
        expect(body).toEqual({
            name: "Dune",
            author: { name: "Frank Herbert", image: "" },
            pages: 412,
            isbn: "123",
            publishedDate: "1965",
            publisher: "Chilton",
            quantity: 1,
            rating: 5,
        });
    });

    it("prepends the new book using the backend-assigned id on success", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 99 }) });
        render(<LibraryProvider><Harness /></LibraryProvider>);
        await userEvent.click(screen.getByText("add"));
        await waitFor(() => expect(screen.getByText("Dune")).toBeInTheDocument());
    });

    it("does not add the book locally when the request fails", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ message: "bad" }) });
        render(<LibraryProvider><Harness /></LibraryProvider>);
        const before = screen.getAllByRole("listitem").length;
        await userEvent.click(screen.getByText("add"));
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        expect(screen.getAllByRole("listitem").length).toBe(before);
    });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx jest src/__tests__/LibraryContext.test.tsx`
Expected: FAIL — `addBook` still synthesizes a local id and never calls `fetch`

- [ ] **Step 8: Implement `addBook` against the real endpoint**

In `src/contexts/LibraryContext.tsx`:

```tsx
'use client';

import {createContext, ReactNode, useCallback, useContext, useMemo, useState} from 'react';
import {Book, NewBookFormData} from '@/src/lib/types';
import {BOOKS} from '@/src/lib/data';

interface LibraryContextValue {
    books: Book[];
    addBook: (data: NewBookFormData) => Promise<{ ok: boolean }>;
    selectedBook: Book | null;
    setSelectedBook: (book: Book | null) => void;
    showAddModal: boolean;
    setShowAddModal: (show: boolean) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({children}: { children: ReactNode }) {
    const [books, setBooks] = useState<Book[]>(BOOKS);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const addBook = useCallback(async (data: NewBookFormData): Promise<{ ok: boolean }> => {
        const payload = {
            name: data.title,
            author: { name: data.author, image: '' },
            pages: parseInt(data.pages) || 0,
            isbn: data.isbn,
            publishedDate: data.year,
            publisher: data.publisher,
            quantity: parseInt(data.quantity) || 1,
            ...(data.rating ? { rating: parseInt(data.rating) } : {}),
            ...(data.status === 'Owned' || data.status === 'Lent Out'
                ? { status: data.status === 'Owned' ? 'OWNED' : 'LENT_OUT' }
                : {}),
        };

        let res: Response;
        try {
            res = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch {
            return { ok: false };
        }

        if (!res.ok) return { ok: false };
        const created: { id: number } = await res.json().catch(() => ({ id: Date.now() }));

        const newBook: Book = {
            id: String(created.id),
            title: data.title,
            author: data.author,
            year: parseInt(data.year) || new Date().getFullYear(),
            genre: data.genre || 'Other',
            status: data.status,
            publisher: data.publisher || undefined,
            isbn: data.isbn || undefined,
            pages: data.pages ? parseInt(data.pages) : undefined,
            rating: data.rating ? parseInt(data.rating) : undefined,
            description: data.description || undefined,
            notes: data.notes || undefined,
        };
        setBooks(prev => [newBook, ...prev]);
        return { ok: true };
    }, []);

    const value = useMemo(
        () => ({
            books,
            addBook,
            selectedBook,
            setSelectedBook,
            showAddModal,
            setShowAddModal,
            searchQuery,
            setSearchQuery
        }),
        [books, addBook, selectedBook, showAddModal, searchQuery],
    );

    return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
    const ctx = useContext(LibraryContext);
    if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
    return ctx;
}
```

- [ ] **Step 9: Update AddBookModal's `onAdd` caller to await the async `addBook`**

The call site is `src/components/AppShell.tsx:31-39`. Replace the `onAdd` handler:

```tsx
{showAddModal && (
    <AddBookModal
        onClose={() => setShowAddModal(false)}
        onAdd={async (data) => {
            const result = await addBook(data);
            if (result.ok) setShowAddModal(false);
        }}
    />
)}
```

`AddBookModal.tsx` itself doesn't need changes beyond the Quantity field from Step 2 — it already just calls whatever `onAdd` prop it's given (see `AddBookModal.tsx:34-37`, `handleSubmit`).

- [ ] **Step 10: Run tests to verify they pass**

Run: `npx jest src/__tests__/LibraryContext.test.tsx src/__tests__/AddBookModal.test.tsx`
Expected: PASS

- [ ] **Step 11: Run the full test suite to check for regressions**

Run: `npx jest`
Expected: PASS (no regressions in `LibraryApp.test.tsx`, `BooksPage.test.tsx`, etc. — if the `handleAdd` call site touched by Step 9 has existing tests asserting synchronous behavior, update them to `await` the click)

- [ ] **Step 12: Commit**

```bash
git add src/lib/types.ts src/components/AddBookModal.tsx src/contexts/LibraryContext.tsx \
        src/lib/i18n/translations/en.ts src/lib/i18n/translations/fa.ts src/lib/i18n/types.ts \
        src/__tests__/AddBookModal.test.tsx src/__tests__/LibraryContext.test.tsx
git commit -m "feat: create books through the real backend instead of local-only state"
```

---

### Task 14: Wire BookDetailModal's Lend button to real POST /api/lending

**Files:**
- Modify: `src/components/BookDetailModal.tsx`
- Test: `src/__tests__/BookDetailModal.test.tsx` (extend existing file)

**Interfaces:**
- Consumes: `GET /api/member` (Task 8) — response shape `{ id: number; name: string }[]`.
- Consumes: `POST /api/lending` (Task 10) — request `{ bookId: number; memberId: number; lentDate: string }`.
- Produces: `BookDetailModalProps` gains an optional `onLent?: () => void` callback, invoked after a successful lend so the parent can refetch/close.

**Known limitation (document, don't fix):** `book.id` for the seeded mock books (e.g. `"blood-meridian"`) is not a real backend id — lending one of those will 400/404 against the real backend. Only books created via Task 13's real `POST /api/book` (which get a numeric backend id as their `Book.id`) can be lent successfully end-to-end. This is a direct consequence of there being no backend "list all books" endpoint to reconcile the mock seed data with real backend rows — out of scope per the design doc.

- [ ] **Step 1: Write the failing test**

Add to `src/__tests__/BookDetailModal.test.tsx`:

```tsx
it("fetches members and lends the book when Lend is clicked", async () => {
    (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([{ id: 3, name: "Sofia K." }]) })
        .mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 9, status: "ACTIVE" }) });

    const onLent = jest.fn();
    render(<BookDetailModal book={{ ...MOCK_BOOK, id: "42" }} onClose={jest.fn()} onLent={onLent} />);

    await waitFor(() => expect(screen.getByLabelText(/lend to/i)).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText(/lend to/i), "3");
    await userEvent.click(screen.getByRole("button", { name: /lend/i }));

    await waitFor(() => expect(onLent).toHaveBeenCalled());
    const [url, opts] = (global.fetch as jest.Mock).mock.calls[1];
    expect(url).toBe("/api/lending");
    expect(JSON.parse(opts.body)).toMatchObject({ bookId: 42, memberId: 3 });
});
```

(Check the existing file for its `MOCK_BOOK` fixture name/shape and reuse it; add `beforeEach(() => { global.fetch = jest.fn(); })` / `afterEach(() => jest.resetAllMocks())` if not already present at the file level.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/BookDetailModal.test.tsx -t "lends the book"`
Expected: FAIL — no "lend to" label, Lend button not wired

- [ ] **Step 3: Implement the member picker and lend wiring**

In `src/components/BookDetailModal.tsx`, add state and effect:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Book } from "@/src/lib/types";
// ...existing imports

interface BookDetailModalProps {
    book: Book | null;
    onClose: () => void;
    onLent?: () => void;
}

export default function BookDetailModal({ book, onClose, onLent }: BookDetailModalProps) {
    const { t } = useLanguage();
    const [members, setMembers] = useState<{ id: number; name: string }[]>([]);
    const [memberId, setMemberId] = useState<string>("");
    const [lending, setLending] = useState(false);

    useEffect(() => {
        if (!book) return;
        fetch("/api/member")
            .then((res) => (res.ok ? res.json() : []))
            .then(setMembers)
            .catch(() => setMembers([]));
    }, [book]);

    if (!book) return null;

    async function handleLend() {
        if (!memberId) return;
        setLending(true);
        try {
            const res = await fetch("/api/lending", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookId: Number(book!.id),
                    memberId: Number(memberId),
                    lentDate: new Date().toISOString().slice(0, 10),
                }),
            });
            if (res.ok) onLent?.();
        } finally {
            setLending(false);
        }
    }

    // ...
}
```

Add the picker in `ModalBody`, near the top:

```tsx
{members.length > 0 && (
    <div className="mb-4">
        <label className="text-xs font-medium uppercase tracking-wide text-[var(--muted)] mb-1 block" htmlFor="lend-to-select">
            {t.bookDetail.labelLendTo}
        </label>
        <select
            id="lend-to-select"
            aria-label={t.bookDetail.labelLendTo}
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
        >
            <option value="">{t.bookDetail.selectMember}</option>
            {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
            ))}
        </select>
    </div>
)}
```

Update the Lend button in `ModalFooter`:

```tsx
<Button variant="primary" size="sm" onClick={handleLend} disabled={!memberId || lending}>
    {t.bookDetail.btnLend}
</Button>
```

Add `labelLendTo: "Lend to"` and `selectMember: "Select a member"` to the `bookDetail` section of `src/lib/i18n/translations/en.ts` and `src/lib/i18n/types.ts`, plus Persian equivalents in `fa.ts`.

- [ ] **Step 4: Wire `onLent` at the call site**

`BookDetailModal` is rendered in `src/components/AppShell.tsx:28-30`. Update it to pass `onLent`, closing the modal on success (matches the existing `onClose` behavior):

```tsx
{selectedBook && (
    <BookDetailModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onLent={() => setSelectedBook(null)}
    />
)}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/__tests__/BookDetailModal.test.tsx`
Expected: PASS (existing tests + new one)

- [ ] **Step 6: Commit**

```bash
git add src/components/BookDetailModal.tsx src/components/AppShell.tsx src/lib/i18n/translations/en.ts \
        src/lib/i18n/translations/fa.ts src/lib/i18n/types.ts src/__tests__/BookDetailModal.test.tsx
git commit -m "feat: wire BookDetailModal's Lend button to POST /api/lending"
```

---

### Task 15: Wire LentPage's "Mark returned" button to real PUT /api/lending/[id]/return

**Files:**
- Modify: `src/components/pages/LentPage.tsx`
- Test: `src/__tests__/LentPage.test.tsx` (extend existing file)

**Interfaces:**
- Consumes: `PUT /api/lending/:id/return` (Task 11).
- No new props — `LendCard` already has `lending.id` in scope; the existing `load()` function in `LentPage` is reused to refetch after a successful return.

- [ ] **Step 1: Write the failing test**

Add to `src/__tests__/LentPage.test.tsx` (follow the existing file's fetch-mocking pattern for `/api/lending/active`):

```tsx
it("marks a lending as returned and refetches the list", async () => {
    (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([{ id: 9, bookId: 1, memberId: 2, lentDate: "2026-08-01", expectedReturnDate: null, actualReturnDate: null, status: "ACTIVE" }]) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 9, status: "RETURNED" }) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });

    render(<LentPage />);
    await waitFor(() => expect(screen.getByText(/mark returned/i)).toBeInTheDocument());

    await userEvent.click(screen.getByText(/mark returned/i));

    await waitFor(() => expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/lending/9/return", expect.objectContaining({ method: "PUT" })));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/LentPage.test.tsx -t "marks a lending as returned"`
Expected: FAIL — button has no click handler, only 1 fetch call happens

- [ ] **Step 3: Implement the wiring**

In `src/components/pages/LentPage.tsx`, pass `onReturned` down to `LendCard`:

```tsx
{!loading && !error && displayed.length > 0 && (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayed.map((lending) => (
            <LendCard key={lending.id} lending={lending} onReturned={load} />
        ))}
    </div>
)}
```

Update `LendCard`:

```tsx
function LendCard({ lending, onReturned }: { lending: ActiveLending; onReturned: () => void }) {
    const { t } = useLanguage();
    const isOverdue = lending.status === "OVERDUE";
    const [returning, setReturning] = useState(false);

    async function handleReturn() {
        setReturning(true);
        try {
            const res = await fetch(`/api/lending/${lending.id}/return`, { method: "PUT" });
            if (res.ok) onReturned();
        } finally {
            setReturning(false);
        }
    }

    return (
        <Card className={isOverdue ? "border-[var(--destructive)]/40" : ""}>
            {/* ...unchanged body... */}
            <CardFooter className="gap-2">
                <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={handleReturn} disabled={returning}>
                    {t.lent.markReturned}
                </Button>
                <Button variant="secondary" size="sm" className="flex-1 justify-center">
                    {t.lent.remind}
                </Button>
            </CardFooter>
        </Card>
    );
}
```

Add `import { useState } from "react";` is already present at the top (`useState, useEffect, useCallback` from Step imports) — no new import needed beyond what's already imported in the file.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/LentPage.test.tsx`
Expected: PASS (existing tests + new one)

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `npx jest`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/pages/LentPage.tsx src/__tests__/LentPage.test.tsx
git commit -m "feat: wire LentPage's Mark Returned button to PUT /api/lending/:id/return"
```

---

## Post-implementation report (for the user, not a task)

After all 15 tasks land, summarize for the user what's now real vs. still mock, and the confirmed backend gaps:

- **Now real:** book creation, lending creation, lending return, plus proxy routes for author create/search, genre CRUD, member CRUD, admin user creation (routes exist, no UI).
- **Still mock (backend gap, not an oversight):** Books-page list/table, Authors-page grid, book edit/delete, `BookDetailModal` fetch-by-id for pre-existing books — backend has no `GET /api/book` (list), `GET /api/author` (list), `PUT/DELETE /api/book/{id}`.
- **Still mock (scope cut, confirmed with user):** Genre management page, Member management page, Admin user-creation page — proxy routes ready, no nav entry or page built.
- **Still dead:** `LentPage` "Remind" button — no backend endpoint exists for it at all.
