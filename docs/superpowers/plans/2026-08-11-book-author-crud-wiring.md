# Book/Author List, Edit, Delete Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock data with real backend calls for `GET /api/book`, `GET /api/author`, `PUT /api/book/{id}`, `DELETE /api/book/{id}`, and fix the genre picker so create/edit actually sends a real `genreId`.

**Architecture:** Next.js BFF route handlers proxy the four endpoints to the Spring Boot backend (existing pattern: cookie bearer token, try/catch → 503, pass through backend status). A new `mappers.ts` module converts backend DTOs to the frontend's `Book`/`Author` shapes. `LibraryContext` owns all list/pagination state and mutation functions; `AddBookModal` and `BookDetailModal` stay presentational, doing their own narrow `fetch` calls where the existing codebase already does that (lend, delete), and calling back into context for local state updates.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Jest 30 + React Testing Library.

## Global Constraints

- Every new BFF route handler follows the existing pattern exactly: read `access_token` cookie → 401 if missing; `fetch` to `${process.env.API_BASE_URL}` with `Authorization: Bearer <token>`; wrap in try/catch → 503 on network failure; pass through the backend's response status.
- Every new user-facing string is added to **both** `src/lib/i18n/translations/en.ts` and `src/lib/i18n/translations/fa.ts`, and to the `Translations` interface in `src/lib/i18n/types.ts`.
- No new dependencies. Use `fetch`, not axios/react-query — matches the rest of the codebase.
- Backend status enum values (`OWNED`, `LENT_OUT`, `WISHLIST`, `READ`) map to frontend `BookStatus` (`"Owned"`, `"Lent Out"`, `"Wishlist"`, `"Read"`); unknown/missing values fall back to `"Owned"`.
- Backend `Book.genreId` (number) maps to a display name via a `genreId -> name` map built from `GET /api/genre` (BFF route already exists at `src/app/api/genre/route.ts`, no changes needed there).
- `translator` and `image` fields on the backend `Book` are not tracked by any frontend form and are not preserved across an edit — this is a pre-existing gap (the create flow already never set them) and is out of scope to fix.
- `description`, `notes`, `lendingHistory`, `lentTo`, `dueBack`, `dateLent`, `overdue` are **not** present on the backend `Book` schema — books fetched from the real API will have these fields `undefined`. Out of scope.
- The Authors page "Complete Works" table keeps its hardcoded Borges framing (`Change Author` stays inert) — only its data source changes from mock to live.

---

### Task 1: Backend types + mapping layer

**Files:**
- Modify: `src/lib/types.ts`
- Create: `src/lib/mappers.ts`
- Test: `src/__tests__/mappers.test.ts`

**Interfaces:**
- Consumes: nothing (pure types + pure functions).
- Produces: `PagedResponse<T>`, `BackendBook`, `BackendAuthorRef`, `BackendAuthor`, `BackendGenre` (types), and `mapBackendStatusToBookStatus(status?: string): BookStatus`, `extractYear(publishedDate?: string): number`, `mapBackendBookToBook(b: BackendBook, genreMap: Map<number,string>): Book`, `mapBackendAuthorToAuthor(a: BackendAuthor, bookCount: number): Author`, `bookToFormData(book: Book, genres: BackendGenre[]): NewBookFormData` — all consumed by later tasks.

- [ ] **Step 1: Add `quantity` to `Book` and add backend-shaped types to `src/lib/types.ts`**

In `src/lib/types.ts`, add `quantity?: number;` to the `Book` interface, right after the `pages?: number;` line:

```ts
export interface Book {
    id: string;
    title: string;
    author: string;
    year: number;
    genre: BookGenre | string;
    status: BookStatus;
    lentTo?: string;
    dueBack?: string;
    dateLent?: string;
    rating?: number;
    publisher?: string;
    isbn?: string;
    pages?: number;
    quantity?: number;
    description?: string;
    notes?: string;
    lendingHistory?: LendRecord[];
    overdue?: boolean;
}
```

Then append this new section at the end of the file (after the existing `ActiveLending` interface):

```ts
// ── Paginated list / backend DTO types ──────────────────────────────────────

export interface PagedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export interface BackendAuthorRef {
    id?: number;
    name: string;
    image?: string;
}

export interface BackendBook {
    id: number;
    name: string;
    author: BackendAuthorRef;
    translator?: string;
    pages: number;
    isbn: string;
    publishedDate: string;
    publisher: string;
    quantity: number;
    image?: string;
    genreId?: number;
    rating?: number;
    status?: string;
    userId?: number;
}

export interface BackendAuthor {
    id: number;
    name: string;
    image: string;
    userId?: number;
}

export interface BackendGenre {
    id: number;
    name: string;
}
```

- [ ] **Step 2: Write the failing test for the mapping layer**

Create `src/__tests__/mappers.test.ts`:

```tsx
import {
    bookToFormData,
    extractYear,
    mapBackendAuthorToAuthor,
    mapBackendBookToBook,
    mapBackendStatusToBookStatus,
} from "@/src/lib/mappers";
import { BackendAuthor, BackendBook, BackendGenre, Book } from "@/src/lib/types";

describe("mapBackendStatusToBookStatus", () => {
    it.each([
        ["OWNED", "Owned"],
        ["LENT_OUT", "Lent Out"],
        ["WISHLIST", "Wishlist"],
        ["READ", "Read"],
    ])("maps %s to %s", (backend, frontend) => {
        expect(mapBackendStatusToBookStatus(backend)).toBe(frontend);
    });

    it("falls back to 'Owned' for an unknown status", () => {
        expect(mapBackendStatusToBookStatus("SOME_NEW_STATUS")).toBe("Owned");
    });

    it("falls back to 'Owned' for undefined", () => {
        expect(mapBackendStatusToBookStatus(undefined)).toBe("Owned");
    });
});

describe("extractYear", () => {
    it("extracts a 4-digit year from an ISO date string", () => {
        expect(extractYear("1965-06-01")).toBe(1965);
    });

    it("extracts a 4-digit year from a bare year string", () => {
        expect(extractYear("1965")).toBe(1965);
    });

    it("falls back to the current year for garbage input", () => {
        expect(extractYear("not a date")).toBe(new Date().getFullYear());
    });

    it("falls back to the current year for undefined", () => {
        expect(extractYear(undefined)).toBe(new Date().getFullYear());
    });
});

describe("mapBackendBookToBook", () => {
    const genreMap = new Map<number, string>([[1, "Fiction"], [2, "Mystery"]]);

    const backendBook: BackendBook = {
        id: 42,
        name: "Dune",
        author: { id: 7, name: "Frank Herbert" },
        pages: 412,
        isbn: "978-0-441-01359-3",
        publishedDate: "1965-06-01",
        publisher: "Chilton",
        quantity: 3,
        genreId: 1,
        rating: 5,
        status: "OWNED",
    };

    it("maps all known fields", () => {
        const book = mapBackendBookToBook(backendBook, genreMap);
        expect(book).toEqual<Book>({
            id: "42",
            title: "Dune",
            author: "Frank Herbert",
            year: 1965,
            genre: "Fiction",
            status: "Owned",
            publisher: "Chilton",
            isbn: "978-0-441-01359-3",
            pages: 412,
            rating: 5,
            quantity: 3,
        });
    });

    it("falls back to 'Other' when genreId has no match in the map", () => {
        const book = mapBackendBookToBook({ ...backendBook, genreId: 999 }, genreMap);
        expect(book.genre).toBe("Other");
    });

    it("falls back to 'Other' when genreId is undefined", () => {
        const book = mapBackendBookToBook({ ...backendBook, genreId: undefined }, genreMap);
        expect(book.genre).toBe("Other");
    });
});

describe("mapBackendAuthorToAuthor", () => {
    it("derives initials from a two-word name", () => {
        const backendAuthor: BackendAuthor = { id: 1, name: "Jorge Luis Borges", image: "" };
        const author = mapBackendAuthorToAuthor(backendAuthor, 5);
        expect(author).toEqual({
            id: "1",
            initials: "JB",
            name: "Jorge Luis Borges",
            bookCount: 5,
            genre: "",
        });
    });

    it("derives initials from a single-word name", () => {
        const backendAuthor: BackendAuthor = { id: 2, name: "Homer", image: "" };
        const author = mapBackendAuthorToAuthor(backendAuthor, 0);
        expect(author.initials).toBe("HO");
    });
});

describe("bookToFormData", () => {
    const genres: BackendGenre[] = [{ id: 1, name: "Fiction" }, { id: 2, name: "Mystery" }];

    it("maps a Book back into NewBookFormData, resolving the genre id by name", () => {
        const book: Book = {
            id: "42", title: "Dune", author: "Frank Herbert", year: 1965,
            genre: "Fiction", status: "Owned", publisher: "Chilton", isbn: "123",
            pages: 412, rating: 5, quantity: 3,
        };
        expect(bookToFormData(book, genres)).toEqual({
            title: "Dune",
            author: "Frank Herbert",
            year: "1965",
            genre: "1",
            status: "Owned",
            publisher: "Chilton",
            isbn: "123",
            pages: "412",
            quantity: "3",
            rating: "5",
            description: "",
            notes: "",
        });
    });

    it("leaves genre blank when the book's genre name has no match", () => {
        const book: Book = {
            id: "42", title: "Dune", author: "Frank Herbert", year: 1965,
            genre: "Other", status: "Owned",
        };
        expect(bookToFormData(book, genres).genre).toBe("");
    });

    it("defaults quantity to '1' when the book has no quantity", () => {
        const book: Book = {
            id: "42", title: "Dune", author: "Frank Herbert", year: 1965,
            genre: "Fiction", status: "Owned",
        };
        expect(bookToFormData(book, genres).quantity).toBe("1");
    });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- mappers.test.ts`
Expected: FAIL with `Cannot find module '@/src/lib/mappers'`.

- [ ] **Step 4: Implement the mapping layer**

Create `src/lib/mappers.ts`:

```ts
import {
    Author,
    BackendAuthor,
    BackendBook,
    BackendGenre,
    Book,
    BookStatus,
    NewBookFormData,
} from "@/src/lib/types";

const STATUS_BACKEND_TO_FRONTEND: Record<string, BookStatus> = {
    OWNED: "Owned",
    LENT_OUT: "Lent Out",
    WISHLIST: "Wishlist",
    READ: "Read",
};

export function mapBackendStatusToBookStatus(status: string | undefined): BookStatus {
    if (!status) return "Owned";
    return STATUS_BACKEND_TO_FRONTEND[status] ?? "Owned";
}

export function extractYear(publishedDate: string | undefined): number {
    const match = publishedDate?.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : new Date().getFullYear();
}

export function mapBackendBookToBook(b: BackendBook, genreMap: Map<number, string>): Book {
    return {
        id: String(b.id),
        title: b.name,
        author: b.author.name,
        year: extractYear(b.publishedDate),
        genre: (b.genreId !== undefined ? genreMap.get(b.genreId) : undefined) ?? "Other",
        status: mapBackendStatusToBookStatus(b.status),
        publisher: b.publisher || undefined,
        isbn: b.isbn || undefined,
        pages: b.pages || undefined,
        rating: b.rating || undefined,
        quantity: b.quantity,
    };
}

function initialsFromName(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function mapBackendAuthorToAuthor(a: BackendAuthor, bookCount: number): Author {
    return {
        id: String(a.id),
        initials: initialsFromName(a.name),
        name: a.name,
        bookCount,
        genre: "",
    };
}

export function bookToFormData(book: Book, genres: BackendGenre[]): NewBookFormData {
    const matchedGenre = genres.find((g) => g.name === book.genre);
    return {
        title: book.title,
        author: book.author,
        year: String(book.year),
        genre: matchedGenre ? String(matchedGenre.id) : "",
        status: book.status,
        publisher: book.publisher ?? "",
        isbn: book.isbn ?? "",
        pages: book.pages !== undefined ? String(book.pages) : "",
        quantity: book.quantity !== undefined ? String(book.quantity) : "1",
        rating: book.rating !== undefined ? String(book.rating) : "",
        description: book.description ?? "",
        notes: book.notes ?? "",
    };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- mappers.test.ts`
Expected: PASS (all `describe` blocks green).

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/mappers.ts src/__tests__/mappers.test.ts
git commit -m "feat: add backend DTO types and book/author mapping layer"
```

---

### Task 2: BFF route handlers for list/update/delete

**Files:**
- Modify: `src/app/api/book/route.ts`
- Modify: `src/app/api/author/route.ts`
- Modify: `src/app/api/book/[id]/route.ts`
- Modify: `src/__tests__/api/book/book.route.test.ts`
- Modify: `src/__tests__/api/book/book-id.route.test.ts`
- Modify: `src/__tests__/api/author/author.route.test.ts`

**Interfaces:**
- Consumes: nothing new (same `process.env.API_BASE_URL` proxy pattern already used by every other route handler in the codebase).
- Produces: `GET /api/book?page=&pageSize=`, `GET /api/author?page=&pageSize=`, `PUT /api/book/:id`, `DELETE /api/book/:id` — consumed by `LibraryContext` (Task 4) and `BookDetailModal` (Task 6).

**Correction to plan research:** an earlier plan (`docs/superpowers/plans/2026-08-05-backend-api-integration.md`) already established a route-test convention at `src/__tests__/api/<resource>/*.route.test.ts` — see `src/__tests__/api/genre/genre.route.test.ts` and `genre-id.route.test.ts` for the reference pattern (`/** @jest-environment node */`, import the handler directly, build a `NextRequest` via a small helper, a `ctx(id)` helper for dynamic-route params, assert on `res.status`/forwarded URL/method/body/Authorization header). `book.route.test.ts`, `book-id.route.test.ts`, and `author.route.test.ts` already exist (covering `POST`/`GET`-by-id) — this task follows the established convention and extends those files with Jest tests for the new handlers, the same way every other BFF route in this codebase is tested.

- [ ] **Step 1: Write the failing tests for `GET /api/book`**

In `src/__tests__/api/book/book.route.test.ts`, change the import line from:

```ts
import { POST } from "@/src/app/api/book/route";
```

to:

```ts
import { GET, POST } from "@/src/app/api/book/route";
```

Then append this new `describe` block at the end of the file:

```ts
function makeGetReq(url: string, token?: string): NextRequest {
    return new NextRequest(url, {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/book", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeGetReq("http://localhost/api/book"));
        expect(res.status).toBe(401);
    });

    it("forwards page and pageSize query params to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ items: [], page: 2, pageSize: 20, totalItems: 0, totalPages: 1 }) });
        await GET(makeGetReq("http://localhost/api/book?page=2&pageSize=20", "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book?page=2&pageSize=20");
        expect(opts.headers.Authorization).toBe("Bearer tok");
    });

    it("requests the backend with no query string when none is given", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 }) });
        await GET(makeGetReq("http://localhost/api/book", "tok"));
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book");
    });

    it("proxies the 200 response from the backend", async () => {
        const page = { items: [{ id: 1, name: "Dune" }], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(page) });
        const res = await GET(makeGetReq("http://localhost/api/book?page=1&pageSize=20", "tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(page);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeGetReq("http://localhost/api/book", "tok"));
        expect(res.status).toBe(503);
    });
});
```

Run: `npm test -- book.route.test.ts`
Expected: FAIL with `'GET' is not exported from '@/src/app/api/book/route'` (or similar).

- [ ] **Step 2: Add `GET` to `src/app/api/book/route.ts`**

Append to the existing file (after the `POST` export):

```ts
export async function GET(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const qs = req.nextUrl.searchParams.toString();

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/book${qs ? `?${qs}` : ""}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

Run: `npm test -- book.route.test.ts`
Expected: PASS (all `GET /api/book` tests, plus the pre-existing `POST /api/book` tests, green).

- [ ] **Step 3: Write the failing tests for `GET /api/author`**

In `src/__tests__/api/author/author.route.test.ts`, change the import line from:

```ts
import { POST } from "@/src/app/api/author/route";
```

to:

```ts
import { GET, POST } from "@/src/app/api/author/route";
```

Then append this new `describe` block at the end of the file:

```ts
function makeGetReq(url: string, token?: string): NextRequest {
    return new NextRequest(url, {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/author", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeGetReq("http://localhost/api/author"));
        expect(res.status).toBe(401);
    });

    it("forwards page and pageSize query params to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ items: [], page: 2, pageSize: 20, totalItems: 0, totalPages: 1 }) });
        await GET(makeGetReq("http://localhost/api/author?page=2&pageSize=20", "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author?page=2&pageSize=20");
        expect(opts.headers.Authorization).toBe("Bearer tok");
    });

    it("proxies the 200 response from the backend", async () => {
        const page = { items: [{ id: 1, name: "Jorge Luis Borges" }], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(page) });
        const res = await GET(makeGetReq("http://localhost/api/author?page=1&pageSize=20", "tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(page);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeGetReq("http://localhost/api/author", "tok"));
        expect(res.status).toBe(503);
    });
});
```

Run: `npm test -- author.route.test.ts`
Expected: FAIL with `'GET' is not exported from '@/src/app/api/author/route'` (or similar).

- [ ] **Step 4: Add `GET` to `src/app/api/author/route.ts`**

Append to the existing file (after the `POST` export):

```ts
export async function GET(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const qs = req.nextUrl.searchParams.toString();

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/author${qs ? `?${qs}` : ""}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

Run: `npm test -- author.route.test.ts`
Expected: PASS (all `GET /api/author` tests, plus the pre-existing `POST /api/author` tests, green).

- [ ] **Step 5: Write the failing tests for `PUT`/`DELETE` `/api/book/[id]`**

In `src/__tests__/api/book/book-id.route.test.ts`, change the import line from:

```ts
import { GET } from "@/src/app/api/book/[id]/route";
```

to:

```ts
import { GET, PUT, DELETE } from "@/src/app/api/book/[id]/route";
```

The file already defines a `ctx(id: string)` helper for the `GET` tests — reuse it. Append this at the end of the file:

```ts
function makePutReq(body: object, token?: string): NextRequest {
    return new NextRequest("http://localhost/api/book/42", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `access_token=${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

function makeDeleteReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/book/42", {
        method: "DELETE",
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("PUT /api/book/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await PUT(makePutReq({ name: "Dune" }), ctx("42"));
        expect(res.status).toBe(401);
    });

    it("forwards the body to the correct backend path", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 42, name: "Dune" }) });
        await PUT(makePutReq({ name: "Dune" }, "tok"), ctx("42"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book/42");
        expect(opts.method).toBe("PUT");
        expect(JSON.parse(opts.body)).toEqual({ name: "Dune" });
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Book not found" }) });
        const res = await PUT(makePutReq({ name: "Dune" }, "tok"), ctx("999"));
        expect(res.status).toBe(404);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await PUT(makePutReq({ name: "Dune" }, "tok"), ctx("42"));
        expect(res.status).toBe(503);
    });
});

describe("DELETE /api/book/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await DELETE(makeDeleteReq(), ctx("42"));
        expect(res.status).toBe(401);
    });

    it("returns 204 with no body on successful deletion", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        const res = await DELETE(makeDeleteReq("tok"), ctx("42"));
        expect(res.status).toBe(204);
    });

    it("requests the correct backend path", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        await DELETE(makeDeleteReq("tok"), ctx("42"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book/42");
        expect(opts.method).toBe("DELETE");
    });

    it("propagates a 409 conflict from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 409, json: () => Promise.resolve({ message: "Book has lending history" }) });
        const res = await DELETE(makeDeleteReq("tok"), ctx("42"));
        expect(res.status).toBe(409);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await DELETE(makeDeleteReq("tok"), ctx("42"));
        expect(res.status).toBe(503);
    });
});
```

Run: `npm test -- book-id.route.test.ts`
Expected: FAIL with `'PUT' is not exported` / `'DELETE' is not exported` (or similar).

- [ ] **Step 6: Add `PUT` and `DELETE` to `src/app/api/book/[id]/route.ts`**

Append to the existing file (after the `GET` export):

```ts
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/book/${id}`, {
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
        res = await fetch(`${process.env.API_BASE_URL}/api/book/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    if (res.status === 204) {
        return new NextResponse(null, { status: 204 });
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
```

Run: `npm test -- book-id.route.test.ts`
Expected: PASS (all `PUT`/`DELETE` tests, plus the pre-existing `GET /api/book/[id]` tests, green).

- [ ] **Step 7: Run the full route test suite for this task**

Run: `npm test -- src/__tests__/api/book src/__tests__/api/author`
Expected: PASS — all test files under both directories green.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/book/route.ts src/app/api/author/route.ts src/app/api/book/\[id\]/route.ts src/__tests__/api/book/book.route.test.ts src/__tests__/api/book/book-id.route.test.ts src/__tests__/api/author/author.route.test.ts
git commit -m "feat: add GET book/author list and PUT/DELETE book BFF routes"
```

---

### Task 3: Pagination UI component

**Files:**
- Create: `src/components/ui/Pagination.tsx`
- Test: `src/__tests__/ui/Pagination.test.tsx`

**Interfaces:**
- Consumes: nothing (pure presentational component).
- Produces: `Pagination({ page: number; totalPages: number; onPageChange: (page: number) => void; prevLabel: string; nextLabel: string })` — consumed by `BooksPage` and `AuthorsPage` in Task 7.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/ui/Pagination.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import Pagination from "@/src/components/ui/Pagination";

describe("Pagination component", () => {
    it("renders nothing when totalPages is 1", () => {
        const { container } = render(
            <Pagination page={1} totalPages={1} onPageChange={jest.fn()} prevLabel="Previous" nextLabel="Next" />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when totalPages is 0", () => {
        const { container } = render(
            <Pagination page={1} totalPages={0} onPageChange={jest.fn()} prevLabel="Previous" nextLabel="Next" />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("renders a button for every page when the total is small", () => {
        render(<Pagination page={1} totalPages={3} onPageChange={jest.fn()} prevLabel="Previous" nextLabel="Next" />);
        expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    });

    it("marks the current page with aria-current", () => {
        render(<Pagination page={2} totalPages={3} onPageChange={jest.fn()} prevLabel="Previous" nextLabel="Next" />);
        expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
        expect(screen.getByRole("button", { name: "1" })).not.toHaveAttribute("aria-current");
    });

    it("calls onPageChange with the clicked page number", () => {
        const onPageChange = jest.fn();
        render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} prevLabel="Previous" nextLabel="Next" />);
        fireEvent.click(screen.getByRole("button", { name: "3" }));
        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it("disables the previous button on the first page", () => {
        render(<Pagination page={1} totalPages={5} onPageChange={jest.fn()} prevLabel="Previous" nextLabel="Next" />);
        expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    });

    it("disables the next button on the last page", () => {
        render(<Pagination page={5} totalPages={5} onPageChange={jest.fn()} prevLabel="Previous" nextLabel="Next" />);
        expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });

    it("calls onPageChange with page - 1 when Previous is clicked", () => {
        const onPageChange = jest.fn();
        render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} prevLabel="Previous" nextLabel="Next" />);
        fireEvent.click(screen.getByRole("button", { name: "Previous" }));
        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("calls onPageChange with page + 1 when Next is clicked", () => {
        const onPageChange = jest.fn();
        render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} prevLabel="Previous" nextLabel="Next" />);
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it("shows an ellipsis when there is a gap between page groups", () => {
        render(<Pagination page={1} totalPages={10} onPageChange={jest.fn()} prevLabel="Previous" nextLabel="Next" />);
        expect(screen.getByText("…")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "10" })).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- Pagination.test.tsx`
Expected: FAIL with `Cannot find module '@/src/components/ui/Pagination'`.

- [ ] **Step 3: Implement the component**

Create `src/components/ui/Pagination.tsx`:

```tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    prevLabel: string;
    nextLabel: string;
}

function pageWindow(page: number, totalPages: number): (number | "ellipsis")[] {
    const spread = 2;
    const pages = new Set<number>([1, totalPages]);
    for (let p = page - spread; p <= page + spread; p++) {
        if (p >= 1 && p <= totalPages) pages.add(p);
    }
    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result: (number | "ellipsis")[] = [];
    let prev = 0;
    for (const p of sorted) {
        if (prev && p - prev > 1) result.push("ellipsis");
        result.push(p);
        prev = p;
    }
    return result;
}

export default function Pagination({ page, totalPages, onPageChange, prevLabel, nextLabel }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-1 mt-4">
            <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label={prevLabel}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--border-strong)] hover:text-[var(--foreground)] transition-colors"
            >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            {pageWindow(page, totalPages).map((entry, i) =>
                entry === "ellipsis" ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-[var(--muted)]">…</span>
                ) : (
                    <button
                        key={entry}
                        type="button"
                        onClick={() => onPageChange(entry)}
                        aria-current={entry === page ? "page" : undefined}
                        className={[
                            "h-8 min-w-8 px-2 rounded-lg text-xs font-medium transition-colors",
                            entry === page
                                ? "bg-[var(--accent)] text-white"
                                : "text-[var(--muted)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]",
                        ].join(" ")}
                    >
                        {entry}
                    </button>
                )
            )}

            <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label={nextLabel}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--border-strong)] hover:text-[var(--foreground)] transition-colors"
            >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
        </nav>
    );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- Pagination.test.tsx`
Expected: PASS (all 10 tests green).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Pagination.tsx src/__tests__/ui/Pagination.test.tsx
git commit -m "feat: add Pagination component"
```

---

### Task 4: `LibraryContext` — real fetch for books/authors/genres, update, remove

**Files:**
- Modify: `src/contexts/LibraryContext.tsx`
- Test: `src/__tests__/LibraryContext.test.tsx` (full rewrite)

**Interfaces:**
- Consumes: `mapBackendBookToBook`, `mapBackendAuthorToAuthor` from `src/lib/mappers` (Task 1); `GET /api/book`, `GET /api/author`, `GET /api/genre`, `POST /api/book`, `PUT /api/book/:id` (Task 2 + existing).
- Produces: `useLibrary()` now also exposes `booksLoading`, `booksError`, `page`, `totalPages`, `totalItems`, `setPage`, `refetchBooks`, `authors`, `authorsLoading`, `authorsError`, `authorsPage`, `authorsTotalPages`, `setAuthorsPage`, `refetchAuthors`, `genres`, `updateBook(id, data): Promise<{ok:boolean}>`, `removeBookLocal(id): void`, `editingBook`, `setEditingBook` — consumed by `AppShell` (Task 7), `BooksRoute`/`AuthorsRoute` (Task 7).

- [ ] **Step 1: Write the failing tests (full rewrite of `LibraryContext.test.tsx`)**

Replace the entire contents of `src/__tests__/LibraryContext.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LibraryProvider, useLibrary } from "@/src/contexts/LibraryContext";
import { BackendBook, NewBookFormData, PagedResponse } from "@/src/lib/types";

const FORM: NewBookFormData = {
    title: "Dune", author: "Frank Herbert", year: "1965", genre: "Science Fiction", status: "Owned",
    publisher: "Chilton", isbn: "123", pages: "412", quantity: "1", rating: "5", description: "", notes: "",
};

const EMPTY_PAGE: PagedResponse<unknown> = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 };

const SAMPLE_BOOK: BackendBook = {
    id: 42, name: "Dune", author: { id: 1, name: "Frank Herbert" }, pages: 412,
    isbn: "123", publishedDate: "1965", publisher: "Chilton", quantity: 3, rating: 5, status: "OWNED",
};

const SAMPLE_BOOK_2: BackendBook = {
    id: 43, name: "Ficciones", author: { id: 2, name: "Jorge Luis Borges" }, pages: 174,
    isbn: "456", publishedDate: "1944", publisher: "Sur", quantity: 1, status: "OWNED",
};

function jsonResponse(status: number, body: unknown) {
    return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });
}

type FetchHandler = (url: string, opts?: RequestInit) => Promise<unknown>;

function setupFetchMock(extra: Record<string, FetchHandler> = {}) {
    global.fetch = jest.fn((url: string, opts?: RequestInit) => {
        const key = `${opts?.method ?? "GET"} ${url}`;
        if (extra[key]) return extra[key](url, opts);
        if (url === "/api/genre") return jsonResponse(200, []);
        if (url.startsWith("/api/book?")) return jsonResponse(200, EMPTY_PAGE);
        if (url.startsWith("/api/author?")) return jsonResponse(200, EMPTY_PAGE);
        return Promise.reject(new Error(`unexpected fetch: ${key}`));
    }) as jest.Mock;
}

function Harness() {
    const { books, addBook } = useLibrary();
    return (
        <div>
            <button onClick={() => addBook(FORM)}>add</button>
            <ul>{books.map((b) => <li key={b.id}>{b.title}</li>)}</ul>
        </div>
    );
}

describe("LibraryContext initial load", () => {
    afterEach(() => jest.resetAllMocks());

    it("fetches genres, books, and authors on mount", async () => {
        setupFetchMock();
        render(<LibraryProvider><Harness /></LibraryProvider>);
        await waitFor(() => {
            const urls = (global.fetch as jest.Mock).mock.calls.map(([u]: [string]) => u);
            expect(urls).toContain("/api/genre");
            expect(urls.some((u: string) => u.startsWith("/api/book?"))).toBe(true);
            expect(urls.some((u: string) => u.startsWith("/api/author?"))).toBe(true);
        });
    });

    it("sets booksError when the book list fetch fails", async () => {
        setupFetchMock({ "GET /api/book?page=1&pageSize=20": () => jsonResponse(500, {}) });
        function ErrorHarness() {
            const { booksLoading, booksError } = useLibrary();
            return <span data-testid="state">{booksLoading ? "loading" : booksError ? "error" : "ok"}</span>;
        }
        render(<LibraryProvider><ErrorHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("error"));
    });
});

describe("LibraryContext.addBook", () => {
    afterEach(() => jest.resetAllMocks());

    it("POSTs a backend-shaped payload to /api/book", async () => {
        setupFetchMock({
            "POST /api/book": () => jsonResponse(201, { ...SAMPLE_BOOK, id: 99 }),
        });
        render(<LibraryProvider><Harness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByText("add")).toBeInTheDocument());
        await userEvent.click(screen.getByText("add"));
        await waitFor(() => {
            const postCall = (global.fetch as jest.Mock).mock.calls.find(([, o]: [string, RequestInit]) => o?.method === "POST");
            expect(postCall).toBeDefined();
        });
        const [url, opts] = (global.fetch as jest.Mock).mock.calls.find(([, o]: [string, RequestInit]) => o?.method === "POST")!;
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
            status: "OWNED",
        });
    });

    it("does not include status in POST body when status is Wishlist", async () => {
        setupFetchMock({ "POST /api/book": () => jsonResponse(201, { ...SAMPLE_BOOK, id: 99 }) });
        function WishlistHarness() {
            const { addBook } = useLibrary();
            return <button onClick={() => addBook({ ...FORM, status: "Wishlist" })}>add</button>;
        }
        render(<LibraryProvider><WishlistHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByText("add")).toBeInTheDocument());
        await userEvent.click(screen.getByText("add"));
        await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.some(([, o]: [string, RequestInit]) => o?.method === "POST")).toBe(true));
        const [, opts] = (global.fetch as jest.Mock).mock.calls.find(([, o]: [string, RequestInit]) => o?.method === "POST")!;
        expect(JSON.parse(opts.body)).not.toHaveProperty("status");
    });

    it("does not include status in POST body when status is Lent Out", async () => {
        setupFetchMock({ "POST /api/book": () => jsonResponse(201, { ...SAMPLE_BOOK, id: 99 }) });
        function LentOutHarness() {
            const { addBook } = useLibrary();
            return <button onClick={() => addBook({ ...FORM, status: "Lent Out" })}>add</button>;
        }
        render(<LibraryProvider><LentOutHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByText("add")).toBeInTheDocument());
        await userEvent.click(screen.getByText("add"));
        await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.some(([, o]: [string, RequestInit]) => o?.method === "POST")).toBe(true));
        const [, opts] = (global.fetch as jest.Mock).mock.calls.find(([, o]: [string, RequestInit]) => o?.method === "POST")!;
        expect(JSON.parse(opts.body)).not.toHaveProperty("status");
    });

    it("prepends the new book using the backend-assigned id on success", async () => {
        setupFetchMock({ "POST /api/book": () => jsonResponse(201, { ...SAMPLE_BOOK, id: 99, name: "Dune" }) });
        render(<LibraryProvider><Harness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByText("add")).toBeInTheDocument());
        await userEvent.click(screen.getByText("add"));
        await waitFor(() => expect(screen.getByText("Dune")).toBeInTheDocument());
    });

    it("does not add the book locally when the request fails", async () => {
        setupFetchMock({ "POST /api/book": () => jsonResponse(400, { message: "bad" }) });
        render(<LibraryProvider><Harness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByText("add")).toBeInTheDocument());
        const before = screen.queryAllByRole("listitem").length;
        await userEvent.click(screen.getByText("add"));
        await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.some(([, o]: [string, RequestInit]) => o?.method === "POST")).toBe(true));
        expect(screen.queryAllByRole("listitem").length).toBe(before);
    });
});

describe("LibraryContext.updateBook", () => {
    afterEach(() => jest.resetAllMocks());

    it("PUTs a backend-shaped payload and replaces the matching book on success", async () => {
        setupFetchMock({
            "GET /api/book?page=1&pageSize=20": () => jsonResponse(200, { items: [SAMPLE_BOOK], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }),
            "PUT /api/book/42": () => jsonResponse(200, { ...SAMPLE_BOOK, name: "Dune (Revised)" }),
        });
        function UpdateHarness() {
            const { books, updateBook } = useLibrary();
            return (
                <div>
                    <button onClick={() => updateBook("42", FORM)}>update</button>
                    <ul>{books.map((b) => <li key={b.id}>{b.title}</li>)}</ul>
                </div>
            );
        }
        render(<LibraryProvider><UpdateHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByText("Dune")).toBeInTheDocument());
        await userEvent.click(screen.getByText("update"));
        await waitFor(() => expect(screen.getByText("Dune (Revised)")).toBeInTheDocument());
        expect(screen.queryByText("Dune")).not.toBeInTheDocument();
    });

    it("leaves the book unchanged when the request fails", async () => {
        setupFetchMock({
            "GET /api/book?page=1&pageSize=20": () => jsonResponse(200, { items: [SAMPLE_BOOK], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }),
            "PUT /api/book/42": () => jsonResponse(400, { message: "bad" }),
        });
        function UpdateHarness() {
            const { books, updateBook } = useLibrary();
            return (
                <div>
                    <button onClick={() => updateBook("42", FORM)}>update</button>
                    <ul>{books.map((b) => <li key={b.id}>{b.title}</li>)}</ul>
                </div>
            );
        }
        render(<LibraryProvider><UpdateHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByText("Dune")).toBeInTheDocument());
        await userEvent.click(screen.getByText("update"));
        await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.some(([, o]: [string, RequestInit]) => o?.method === "PUT")).toBe(true));
        expect(screen.getByText("Dune")).toBeInTheDocument();
    });
});

describe("LibraryContext.removeBookLocal", () => {
    afterEach(() => jest.resetAllMocks());

    it("removes the matching book from local state without touching other books", async () => {
        setupFetchMock({
            "GET /api/book?page=1&pageSize=20": () => jsonResponse(200, { items: [SAMPLE_BOOK, SAMPLE_BOOK_2], page: 1, pageSize: 20, totalItems: 2, totalPages: 1 }),
        });
        function RemoveHarness() {
            const { books, removeBookLocal } = useLibrary();
            return (
                <div>
                    <button onClick={() => removeBookLocal("42")}>remove</button>
                    <ul>{books.map((b) => <li key={b.id}>{b.title}</li>)}</ul>
                </div>
            );
        }
        render(<LibraryProvider><RemoveHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByText("Dune")).toBeInTheDocument());
        await userEvent.click(screen.getByText("remove"));
        await waitFor(() => expect(screen.queryByText("Dune")).not.toBeInTheDocument());
        expect(screen.getByText("Ficciones")).toBeInTheDocument();
    });
});

describe("LibraryContext.markBookLent", () => {
    afterEach(() => jest.resetAllMocks());

    it("updates the matching book's status to 'Lent Out' in local state", async () => {
        setupFetchMock({
            "GET /api/book?page=1&pageSize=20": () => jsonResponse(200, { items: [SAMPLE_BOOK, SAMPLE_BOOK_2], page: 1, pageSize: 20, totalItems: 2, totalPages: 1 }),
        });
        function LentHarness() {
            const { books, markBookLent } = useLibrary();
            return (
                <div>
                    <button onClick={() => markBookLent(books[0].id)}>mark-lent</button>
                    <ul>{books.map((b) => <li key={b.id}>{b.title}: {b.status}</li>)}</ul>
                </div>
            );
        }
        render(<LibraryProvider><LentHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(2));
        await userEvent.click(screen.getByText("mark-lent"));
        await waitFor(() => expect(screen.getAllByRole("listitem")[0].textContent).toContain("Lent Out"));
        expect(screen.getAllByRole("listitem")[1].textContent).toContain("Owned");
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- LibraryContext.test.tsx`
Expected: FAIL — `updateBook`/`removeBookLocal` are not part of the current context value, and the mount effect doesn't fetch yet, so most assertions time out or throw.

- [ ] **Step 3: Rewrite `src/contexts/LibraryContext.tsx`**

Replace the entire file contents:

```tsx
'use client';

import {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {Author, BackendAuthor, BackendBook, BackendGenre, Book, NewBookFormData, PagedResponse} from '@/src/lib/types';
import {mapBackendAuthorToAuthor, mapBackendBookToBook} from '@/src/lib/mappers';

const PAGE_SIZE = 20;

interface LibraryContextValue {
    books: Book[];
    booksLoading: boolean;
    booksError: boolean;
    page: number;
    totalPages: number;
    totalItems: number;
    setPage: (page: number) => void;
    refetchBooks: () => void;

    authors: Author[];
    authorsLoading: boolean;
    authorsError: boolean;
    authorsPage: number;
    authorsTotalPages: number;
    setAuthorsPage: (page: number) => void;
    refetchAuthors: () => void;

    genres: BackendGenre[];

    addBook: (data: NewBookFormData) => Promise<{ ok: boolean }>;
    updateBook: (id: string, data: NewBookFormData) => Promise<{ ok: boolean }>;
    removeBookLocal: (id: string) => void;
    markBookLent: (bookId: string) => void;

    selectedBook: Book | null;
    setSelectedBook: (book: Book | null) => void;
    showAddModal: boolean;
    setShowAddModal: (show: boolean) => void;
    editingBook: Book | null;
    setEditingBook: (book: Book | null) => void;

    searchQuery: string;
    setSearchQuery: (q: string) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

function buildGenreMap(genres: BackendGenre[]): Map<number, string> {
    return new Map(genres.map((g) => [g.id, g.name]));
}

function buildBookPayload(data: NewBookFormData) {
    const genreId = Number(data.genre);
    return {
        name: data.title,
        author: { name: data.author, image: '' },
        pages: parseInt(data.pages) || 0,
        isbn: data.isbn,
        publishedDate: data.year,
        publisher: data.publisher,
        quantity: parseInt(data.quantity) || 1,
        ...(data.rating ? { rating: parseInt(data.rating) } : {}),
        ...(data.status === 'Owned' ? { status: 'OWNED' } : {}),
        ...(genreId ? { genreId } : {}),
    };
}

async function fetchGenres(): Promise<BackendGenre[]> {
    try {
        const res = await fetch('/api/genre');
        if (!res.ok) return [];
        return await res.json().catch(() => []);
    } catch {
        return [];
    }
}

async function fetchBookPage(pageNum: number, genreMap: Map<number, string>): Promise<
    { ok: true; items: Book[]; totalPages: number; totalItems: number } | { ok: false }
> {
    let res: Response;
    try {
        res = await fetch(`/api/book?page=${pageNum}&pageSize=${PAGE_SIZE}`);
    } catch {
        return { ok: false };
    }
    if (!res.ok) return { ok: false };
    const data: PagedResponse<BackendBook> | null = await res.json().catch(() => null);
    if (!data) return { ok: false };
    return {
        ok: true,
        items: data.items.map((b) => mapBackendBookToBook(b, genreMap)),
        totalPages: data.totalPages,
        totalItems: data.totalItems,
    };
}

async function fetchAuthorPage(pageNum: number): Promise<
    { ok: true; items: BackendAuthor[]; totalPages: number; totalItems: number } | { ok: false }
> {
    let res: Response;
    try {
        res = await fetch(`/api/author?page=${pageNum}&pageSize=${PAGE_SIZE}`);
    } catch {
        return { ok: false };
    }
    if (!res.ok) return { ok: false };
    const data: PagedResponse<BackendAuthor> | null = await res.json().catch(() => null);
    if (!data) return { ok: false };
    return { ok: true, items: data.items, totalPages: data.totalPages, totalItems: data.totalItems };
}

export function LibraryProvider({children}: { children: ReactNode }) {
    const [books, setBooks] = useState<Book[]>([]);
    const [booksLoading, setBooksLoading] = useState(true);
    const [booksError, setBooksError] = useState(false);
    const [page, setPageState] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [authors, setAuthors] = useState<Author[]>([]);
    const [authorsLoading, setAuthorsLoading] = useState(true);
    const [authorsError, setAuthorsError] = useState(false);
    const [authorsPage, setAuthorsPageState] = useState(1);
    const [authorsTotalPages, setAuthorsTotalPages] = useState(1);

    const [genres, setGenres] = useState<BackendGenre[]>([]);

    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const genreMap = useMemo(() => buildGenreMap(genres), [genres]);

    const loadBooks = useCallback(async (pageNum: number, map: Map<number, string>) => {
        setBooksLoading(true);
        setBooksError(false);
        const result = await fetchBookPage(pageNum, map);
        if (!result.ok) {
            setBooksError(true);
            setBooksLoading(false);
            return;
        }
        setBooks(result.items);
        setTotalPages(result.totalPages);
        setTotalItems(result.totalItems);
        setPageState(pageNum);
        setBooksLoading(false);
    }, []);

    const loadAuthors = useCallback(async (pageNum: number) => {
        setAuthorsLoading(true);
        setAuthorsError(false);
        const result = await fetchAuthorPage(pageNum);
        if (!result.ok) {
            setAuthorsError(true);
            setAuthorsLoading(false);
            return;
        }
        setAuthors(result.items.map((a) => mapBackendAuthorToAuthor(a, 0)));
        setAuthorsTotalPages(result.totalPages);
        setAuthorsPageState(pageNum);
        setAuthorsLoading(false);
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const genreList = await fetchGenres();
            if (cancelled) return;
            setGenres(genreList);
            await loadBooks(1, buildGenreMap(genreList));
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadAuthors(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setPage = useCallback((next: number) => { loadBooks(next, genreMap); }, [loadBooks, genreMap]);
    const setAuthorsPage = useCallback((next: number) => { loadAuthors(next); }, [loadAuthors]);
    const refetchBooks = useCallback(() => { loadBooks(page, genreMap); }, [loadBooks, page, genreMap]);
    const refetchAuthors = useCallback(() => { loadAuthors(authorsPage); }, [loadAuthors, authorsPage]);

    const addBook = useCallback(async (data: NewBookFormData): Promise<{ ok: boolean }> => {
        let res: Response;
        try {
            res = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildBookPayload(data)),
            });
        } catch {
            return { ok: false };
        }
        if (!res.ok) return { ok: false };
        const created: BackendBook | null = await res.json().catch(() => null);
        if (!created) return { ok: false };
        setBooks((prev) => [mapBackendBookToBook(created, genreMap), ...prev]);
        return { ok: true };
    }, [genreMap]);

    const updateBook = useCallback(async (id: string, data: NewBookFormData): Promise<{ ok: boolean }> => {
        let res: Response;
        try {
            res = await fetch(`/api/book/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildBookPayload(data)),
            });
        } catch {
            return { ok: false };
        }
        if (!res.ok) return { ok: false };
        const updated: BackendBook | null = await res.json().catch(() => null);
        if (!updated) return { ok: false };
        const mapped = mapBackendBookToBook(updated, genreMap);
        setBooks((prev) => prev.map((b) => (b.id === id ? mapped : b)));
        return { ok: true };
    }, [genreMap]);

    const removeBookLocal = useCallback((id: string) => {
        setBooks((prev) => prev.filter((b) => b.id !== id));
    }, []);

    const markBookLent = useCallback((bookId: string) => {
        setBooks(prev => prev.map(b => (b.id === bookId ? { ...b, status: 'Lent Out' } : b)));
    }, []);

    const value = useMemo(
        () => ({
            books, booksLoading, booksError, page, totalPages, totalItems, setPage, refetchBooks,
            authors, authorsLoading, authorsError, authorsPage, authorsTotalPages, setAuthorsPage, refetchAuthors,
            genres,
            addBook, updateBook, removeBookLocal, markBookLent,
            selectedBook, setSelectedBook,
            showAddModal, setShowAddModal,
            editingBook, setEditingBook,
            searchQuery, setSearchQuery,
        }),
        [
            books, booksLoading, booksError, page, totalPages, totalItems, setPage, refetchBooks,
            authors, authorsLoading, authorsError, authorsPage, authorsTotalPages, setAuthorsPage, refetchAuthors,
            genres, addBook, updateBook, removeBookLocal, markBookLent,
            selectedBook, showAddModal, editingBook, searchQuery,
        ],
    );

    return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
    const ctx = useContext(LibraryContext);
    if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
    return ctx;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- LibraryContext.test.tsx`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
git add src/contexts/LibraryContext.tsx src/__tests__/LibraryContext.test.tsx
git commit -m "feat: wire LibraryContext to real book/author/genre APIs with update and remove"
```

---

### Task 5: `AddBookModal` — edit mode + real genre picker

**Files:**
- Modify: `src/components/AddBookModal.tsx`
- Modify: `src/lib/i18n/types.ts`, `src/lib/i18n/translations/en.ts`, `src/lib/i18n/translations/fa.ts`
- Test: `src/__tests__/AddBookModal.test.tsx` (append new tests, existing tests untouched)

**Interfaces:**
- Consumes: `BackendGenre` (Task 1). `onAdd` prop signature is unchanged (`(book: NewBookFormData) => Promise<boolean>`) so `AppShell` keeps compiling without modification until Task 7.
- Produces: new optional props `mode?: "add" | "edit"`, `initialData?: NewBookFormData`, `genres?: BackendGenre[]` — consumed by `AppShell` in Task 7.

- [ ] **Step 1: Add new i18n key and reuse `common.save` for the edit submit label**

In `src/lib/i18n/types.ts`, add `titleEdit: string;` to the `addBook` section (right after `title: string;`):

```ts
    addBook: {
        title: string;
        titleEdit: string;
        subtitle: string;
```

In `src/lib/i18n/translations/en.ts`, add to the `addBook` object (right after `title: "Add New Book",`):

```ts
        title: "Add New Book",
        titleEdit: "Edit Book",
```

In `src/lib/i18n/translations/fa.ts`, add to the `addBook` object (right after `title: "افزودن کتاب جدید",`):

```ts
        title: "افزودن کتاب جدید",
        titleEdit: "ویرایش کتاب",
```

- [ ] **Step 2: Write the failing tests for edit mode**

Append to `src/__tests__/AddBookModal.test.tsx` (add this new `describe` block; do not modify the existing one, and add `NewBookFormData` to the existing import from `@/src/lib/types` if not already present):

```tsx
import { NewBookFormData } from "@/src/lib/types";

describe("AddBookModal edit mode", () => {
    const onClose = jest.fn();
    const onAdd = jest.fn().mockResolvedValue(true);
    const genres = [{ id: 1, name: "Fiction" }, { id: 2, name: "Mystery" }];
    const initialData: NewBookFormData = {
        title: "Dune", author: "Frank Herbert", year: "1965", genre: "1", status: "Owned",
        publisher: "Chilton", isbn: "123", pages: "412", quantity: "3", rating: "5", description: "", notes: "",
    };

    beforeEach(() => jest.clearAllMocks());

    it("renders the edit heading and Save Changes button", () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd} mode="edit" initialData={initialData} genres={genres} />);
        expect(screen.getByRole("heading", { name: "Edit Book" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    });

    it("pre-fills form fields from initialData", () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd} mode="edit" initialData={initialData} genres={genres} />);
        expect(screen.getByPlaceholderText(/The Brothers Karamazov/i)).toHaveValue("Dune");
        expect(screen.getByPlaceholderText(/Fyodor Dostoevsky/i)).toHaveValue("Frank Herbert");
        expect(screen.getByLabelText(/quantity/i)).toHaveValue(3);
    });

    it("renders genre options from the genres prop", () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd} mode="edit" initialData={initialData} genres={genres} />);
        expect(screen.getByRole("option", { name: "Fiction" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Mystery" })).toBeInTheDocument();
    });

    it("calls onAdd with edited form data on save", async () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd} mode="edit" initialData={initialData} genres={genres} />);
        fireEvent.change(screen.getByPlaceholderText(/The Brothers Karamazov/i), { target: { value: "Dune Messiah" } });
        fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
        expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ title: "Dune Messiah", author: "Frank Herbert" }));
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- AddBookModal.test.tsx`
Expected: FAIL — `mode`/`initialData`/`genres` props don't exist yet, genre `<option>`s named "Fiction"/"Mystery" don't render, heading text "Edit Book" doesn't exist.

- [ ] **Step 4: Update `src/components/AddBookModal.tsx`**

Replace the entire file contents:

```tsx
"use client";

import {useState} from "react";
import {ScanLine} from "lucide-react";
import {BackendGenre, BookStatus, NewBookFormData} from "@/src/lib/types";
import {useLanguage} from "@/src/lib/i18n/context";
import {Modal, ModalBody, ModalCloseButton, ModalFooter, ModalHeader} from "@/src/components/ui/Modal";
import {Input} from "@/src/components/ui/Input";
import {Select} from "@/src/components/ui/Select";
import {Button} from "@/src/components/ui/Button";
import {BarcodeScanner} from "@/src/components/ui/BarcodeScanner";

interface AddBookModalProps {
    onClose: () => void;
    onAdd: (book: NewBookFormData) => Promise<boolean>;
    mode?: "add" | "edit";
    initialData?: NewBookFormData;
    genres?: BackendGenre[];
}

const EMPTY_FORM: NewBookFormData = {
    title: "", author: "", year: "", genre: "", status: "Owned",
    publisher: "", isbn: "", pages: "", quantity: "1", rating: "", description: "", notes: "",
};

export default function AddBookModal({ onClose, onAdd, mode = "add", initialData, genres = [] }: AddBookModalProps) {
    const { t } = useLanguage();
    const [form, setForm] = useState<NewBookFormData>(initialData ?? EMPTY_FORM);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit() {
        if (!form.title.trim() || !form.author.trim()) return;
        setSubmitting(true);
        setError(null);
        const ok = await onAdd(form);
        setSubmitting(false);
        if (ok) {
            setForm(EMPTY_FORM);
            onClose();
        } else {
            setError(t.common.errorHeading);
        }
    }

    const statusOptions: { value: BookStatus; label: string }[] = [
        { value: "Owned",    label: t.addBook.statuses.owned },
        { value: "Lent Out", label: t.addBook.statuses.lentOut },
        { value: "Wishlist", label: t.addBook.statuses.wishlist },
        { value: "Read",     label: t.addBook.statuses.read },
    ];

    const ratingOptions = [
        { value: "5", label: t.addBook.ratings.r5 },
        { value: "4", label: t.addBook.ratings.r4 },
        { value: "3", label: t.addBook.ratings.r3 },
        { value: "2", label: t.addBook.ratings.r2 },
        { value: "1", label: t.addBook.ratings.r1 },
    ];

    const heading = mode === "edit" ? t.addBook.titleEdit : t.addBook.title;
    const submitLabel = mode === "edit" ? t.common.save : t.addBook.btnAdd;

    return (
        <Modal open onClose={onClose} className="max-w-[min(640px,95vw)] max-h-[90vh] overflow-y-auto" data-testid="add-book-modal">
            <ModalHeader>
                <div>
                    <h2 className="text-base font-semibold text-[var(--foreground)]">{heading}</h2>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{t.addBook.subtitle}</p>
                </div>
                <ModalCloseButton onClose={onClose} aria-label={t.common.close} />
            </ModalHeader>

            <ModalBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <Input
                            label={t.addBook.fieldTitle}
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder={t.addBook.fieldTitlePlaceholder}
                        />
                    </div>
                    <Input
                        label={t.addBook.fieldAuthor}
                        name="author"
                        value={form.author}
                        onChange={handleChange}
                        placeholder={t.addBook.fieldAuthorPlaceholder}
                    />
                    <Input
                        label={t.addBook.fieldYear}
                        name="year"
                        type="number"
                        value={form.year}
                        onChange={handleChange}
                        placeholder={t.addBook.fieldYearPlaceholder}
                    />
                    <Select label={t.addBook.fieldGenre} name="genre" value={form.genre} onChange={handleChange}>
                        <option value="">{t.addBook.fieldGenreDefault}</option>
                        {genres.map((g) => (
                            <option key={g.id} value={String(g.id)}>{g.name}</option>
                        ))}
                    </Select>
                    <Select label={t.addBook.fieldStatus} name="status" value={form.status} onChange={handleChange}>
                        {statusOptions.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </Select>
                    <Input
                        label={t.addBook.fieldPublisher}
                        name="publisher"
                        value={form.publisher}
                        onChange={handleChange}
                        placeholder={t.addBook.fieldPublisherPlaceholder}
                    />
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <Input
                                label={t.addBook.fieldIsbn}
                                name="isbn"
                                value={form.isbn}
                                onChange={handleChange}
                                placeholder={t.addBook.fieldIsbnPlaceholder}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setScannerOpen(true)}
                            aria-label={t.barcodeScanner.title}
                            className="h-9 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)] transition-colors shrink-0 cursor-pointer"
                        >
                            <ScanLine className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                    <BarcodeScanner
                        open={scannerOpen}
                        onClose={() => setScannerOpen(false)}
                        onScan={(isbn) => {
                            setForm((prev) => ({ ...prev, isbn }));
                            setScannerOpen(false);
                        }}
                    />
                    <Input
                        label={t.addBook.fieldPages}
                        name="pages"
                        type="number"
                        value={form.pages}
                        onChange={handleChange}
                        placeholder={t.addBook.fieldPagesPlaceholder}
                    />
                    <Input
                        label={t.addBook.fieldQuantity}
                        name="quantity"
                        type="number"
                        value={form.quantity}
                        onChange={handleChange}
                        placeholder="1"
                    />
                    <Select label={t.addBook.fieldRating} name="rating" value={form.rating} onChange={handleChange}>
                        <option value="">{t.addBook.fieldRatingDefault}</option>
                        {ratingOptions.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </Select>
                    <div className="sm:col-span-2 flex flex-col gap-1">
                        <label className="text-sm font-medium text-[var(--foreground)]">{t.addBook.fieldDescription}</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder={t.addBook.fieldDescriptionPlaceholder}
                            rows={3}
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-y transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 hover:border-[var(--border-strong)]"
                        />
                    </div>
                    <div className="sm:col-span-2 flex flex-col gap-1">
                        <label className="text-sm font-medium text-[var(--foreground)]">{t.addBook.fieldNotes}</label>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder={t.addBook.fieldNotesPlaceholder}
                            rows={3}
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-y transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 hover:border-[var(--border-strong)]"
                        />
                    </div>
                </div>

                {error && (
                    <p role="alert" className="mt-4 text-sm text-[var(--destructive)]">{error}</p>
                )}
            </ModalBody>

            <ModalFooter>
                <Button variant="secondary" size="sm" onClick={onClose}>{t.addBook.btnCancel}</Button>
                <Button variant="primary" size="sm" onClick={handleSubmit} disabled={submitting} loading={submitting}>
                    {submitLabel}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
```

Note: the hardcoded `genreOptions` array and the now-unreferenced `t.addBook.genres.*` translation keys are removed from this component only — the translation strings themselves stay in `en.ts`/`fa.ts` (not deleted, just unused, to avoid unrelated i18n churn).

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- AddBookModal.test.tsx`
Expected: PASS — both the original tests (unaffected, since `mode`/`genres` default to `"add"`/`[]`) and the new edit-mode tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/AddBookModal.tsx src/__tests__/AddBookModal.test.tsx src/lib/i18n/types.ts src/lib/i18n/translations/en.ts src/lib/i18n/translations/fa.ts
git commit -m "feat: add edit mode and real genre picker to AddBookModal"
```

---

### Task 6: `BookDetailModal` — edit button + delete with confirm and 409 handling

**Files:**
- Modify: `src/components/BookDetailModal.tsx`
- Modify: `src/lib/i18n/types.ts`, `src/lib/i18n/translations/en.ts`, `src/lib/i18n/translations/fa.ts`
- Test: `src/__tests__/BookDetailModal.test.tsx` (append new tests, existing tests untouched)

**Interfaces:**
- Consumes: nothing new (does its own `fetch` for `DELETE /api/book/:id`, matching the existing `handleLend` pattern of doing its own `POST /api/lending`).
- Produces: new optional props `onEdit?: () => void`, `onDeleted?: () => void` — consumed by `AppShell` in Task 7.

- [ ] **Step 1: Add new i18n keys**

In `src/lib/i18n/types.ts`, add to the `bookDetail` section (right after `btnDelete: string;`):

```ts
        btnDelete: string;
        btnConfirmDelete: string;
        btnEdit: string;
        errorDeleteConflict: string;
```

In `src/lib/i18n/translations/en.ts`, add to the `bookDetail` object (right after `btnDelete: "Delete",`):

```ts
        btnDelete: "Delete",
        btnConfirmDelete: "Confirm Delete?",
        btnEdit: "Edit",
        errorDeleteConflict: "This book has lending history and can't be deleted.",
```

In `src/lib/i18n/translations/fa.ts`, add to the `bookDetail` object (right after `btnDelete: "حذف",`):

```ts
        btnDelete: "حذف",
        btnConfirmDelete: "تأیید حذف؟",
        btnEdit: "ویرایش",
        errorDeleteConflict: "این کتاب دارای تاریخچه امانت است و قابل حذف نیست.",
```

- [ ] **Step 2: Write the failing tests**

Append to `src/__tests__/BookDetailModal.test.tsx` (new `describe` block; `userEvent` is already imported at the top of this file):

```tsx
describe("BookDetailModal edit and delete", () => {
    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("calls onEdit when the Edit button is clicked", () => {
        const onEdit = jest.fn();
        render(<BookDetailModal book={mockBook} onClose={jest.fn()} onEdit={onEdit} />);
        fireEvent.click(screen.getByRole("button", { name: "Edit" }));
        expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it("shows a confirm state on the first Delete click without calling the API", async () => {
        render(<BookDetailModal book={mockBook} onClose={jest.fn()} />);
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        expect(await screen.findByRole("button", { name: "Confirm Delete?" })).toBeInTheDocument();
        expect(global.fetch).toHaveBeenCalledTimes(1); // only the members fetch
    });

    it("deletes the book and calls onDeleted on the second click", async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) })
            .mockResolvedValueOnce({ ok: true, status: 204, json: () => Promise.resolve(null) });
        const onDeleted = jest.fn();
        render(<BookDetailModal book={{ ...mockBook, id: "42" }} onClose={jest.fn()} onDeleted={onDeleted} />);
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        await userEvent.click(await screen.findByRole("button", { name: "Confirm Delete?" }));
        await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[1];
        expect(url).toBe("/api/book/42");
        expect(opts.method).toBe("DELETE");
    });

    it("shows a conflict message and does not call onDeleted on 409", async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) })
            .mockResolvedValueOnce({ ok: false, status: 409, json: () => Promise.resolve({ message: "conflict" }) });
        const onDeleted = jest.fn();
        render(<BookDetailModal book={mockBook} onClose={jest.fn()} onDeleted={onDeleted} />);
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        await userEvent.click(await screen.findByRole("button", { name: "Confirm Delete?" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("This book has lending history and can't be deleted.");
        expect(onDeleted).not.toHaveBeenCalled();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- BookDetailModal.test.tsx`
Expected: FAIL — no "Edit" button exists, Delete doesn't have a confirm state yet.

- [ ] **Step 4: Update `src/components/BookDetailModal.tsx`**

Replace the entire file contents:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Book } from "@/src/lib/types";
import { useLanguage } from "@/src/lib/i18n/context";
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from "@/src/components/ui/Modal";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { StarRating } from "@/src/components/ui/StarRating";
import { GenreTag } from "@/src/components/ui/GenreTag";
import { Button } from "@/src/components/ui/Button";
import { DataTable, DataTableHead, DataTableBody, DataTableRow, Th, Td } from "@/src/components/ui/DataTable";

interface BookDetailModalProps {
    book: Book | null;
    onClose: () => void;
    onLent?: () => void;
    onEdit?: () => void;
    onDeleted?: () => void;
}

export default function BookDetailModal({ book, onClose, onLent, onEdit, onDeleted }: BookDetailModalProps) {
    const { t } = useLanguage();
    const [members, setMembers] = useState<{ id: number; name: string }[]>([]);
    const [membersLoaded, setMembersLoaded] = useState(false);
    const [memberId, setMemberId] = useState<string>("");
    const [lending, setLending] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!book) return;
        setMembersLoaded(false);
        fetch("/api/member")
            .then((res) => (res.ok ? res.json() : []))
            .then(setMembers)
            .catch(() => setMembers([]))
            .finally(() => setMembersLoaded(true));
    }, [book]);

    if (!book) return null;

    async function handleLend() {
        if (!memberId) return;
        setLending(true);
        setError(null);
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
            if (res.ok) {
                onLent?.();
            } else {
                setError(t.common.errorHeading);
            }
        } catch {
            setError(t.common.errorHeading);
        } finally {
            setLending(false);
        }
    }

    async function handleDeleteClick() {
        if (!confirmingDelete) {
            setConfirmingDelete(true);
            return;
        }
        setDeleting(true);
        setError(null);
        try {
            const res = await fetch(`/api/book/${book!.id}`, { method: "DELETE" });
            if (res.ok) {
                onDeleted?.();
            } else if (res.status === 409) {
                setError(t.bookDetail.errorDeleteConflict);
                setConfirmingDelete(false);
            } else {
                setError(t.common.errorHeading);
                setConfirmingDelete(false);
            }
        } catch {
            setError(t.common.errorHeading);
            setConfirmingDelete(false);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <Modal
            open
            onClose={onClose}
            className="max-w-[min(640px,95vw)] max-h-[90vh] overflow-y-auto"
            data-testid="book-detail-modal"
        >
            <ModalHeader>
                <div>
                    <h2 className="text-base font-semibold text-[var(--foreground)] leading-tight" id="modal-title">
                        {book.title}
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{book.author} · {book.year}</p>
                </div>
                <ModalCloseButton onClose={onClose} aria-label={t.common.close} />
            </ModalHeader>

            <ModalBody>
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

                {membersLoaded && members.length === 0 && (
                    <p className="mb-4 text-sm text-[var(--muted)]">{t.bookDetail.noMembers}</p>
                )}

                {error && (
                    <p role="alert" className="mb-4 text-sm text-[var(--destructive)]">{error}</p>
                )}

                <div className="grid grid-cols-3 gap-4 mb-5">
                    <MetaItem label={t.bookDetail.labelStatus}>
                        <StatusBadge status={book.status} overdue={book.overdue} />
                    </MetaItem>
                    <MetaItem label={t.bookDetail.labelGenre}>
                        <GenreTag genre={book.genre} />
                    </MetaItem>
                    <MetaItem label={t.bookDetail.labelRating}>
                        {book.rating
                            ? <StarRating value={book.rating} />
                            : <span className="text-sm text-[var(--muted)]">—</span>
                        }
                    </MetaItem>
                    {book.publisher && (
                        <MetaItem label={t.bookDetail.labelPublisher}>
                            <span className="text-sm font-medium text-[var(--foreground)]">{book.publisher}</span>
                        </MetaItem>
                    )}
                    {book.isbn && (
                        <MetaItem label={t.bookDetail.labelIsbn}>
                            <span className="text-xs font-mono text-[var(--foreground)]">{book.isbn}</span>
                        </MetaItem>
                    )}
                    {book.pages && (
                        <MetaItem label={t.bookDetail.labelPages}>
                            <span className="text-sm font-medium text-[var(--foreground)]">{book.pages}</span>
                        </MetaItem>
                    )}
                </div>

                <hr className="border-[var(--border)] my-4" />

                {book.description && (
                    <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                            {t.bookDetail.labelDescription}
                        </p>
                        <p className="text-sm text-[var(--foreground)] leading-relaxed border-s-2 border-[var(--accent)] ps-3 italic">
                            {book.description}
                        </p>
                    </div>
                )}

                <div className="mb-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                        {t.bookDetail.labelNotes}
                    </p>
                    <textarea
                        defaultValue={book.notes ?? ""}
                        placeholder={t.bookDetail.notesPlaceholder}
                        rows={3}
                        aria-label={t.bookDetail.labelNotes}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-y transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 hover:border-[var(--border-strong)]"
                    />
                </div>

                {book.lendingHistory && book.lendingHistory.length > 0 && (
                    <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                            {t.bookDetail.labelLendingHistory}
                        </p>
                        <DataTable>
                            <DataTableHead>
                                <tr>
                                    <Th>{t.bookDetail.colLentTo}</Th>
                                    <Th>{t.bookDetail.colDateOut}</Th>
                                    <Th>{t.bookDetail.colDateReturned}</Th>
                                    <Th>{t.bookDetail.colCondition}</Th>
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {book.lendingHistory.map((record, i) => (
                                    <DataTableRow key={i}>
                                        <Td>{record.lentTo}</Td>
                                        <Td>{record.dateOut}</Td>
                                        <Td>{record.dateReturned ?? "—"}</Td>
                                        <Td>{record.condition ?? "—"}</Td>
                                    </DataTableRow>
                                ))}
                            </DataTableBody>
                        </DataTable>
                    </div>
                )}
            </ModalBody>

            <ModalFooter>
                <Button variant="danger" size="sm" onClick={handleDeleteClick} disabled={deleting} loading={deleting}>
                    {confirmingDelete ? t.bookDetail.btnConfirmDelete : t.bookDetail.btnDelete}
                </Button>
                <Button variant="secondary" size="sm" onClick={onEdit}>{t.bookDetail.btnEdit}</Button>
                <Button variant="secondary" size="sm" onClick={onClose}>{t.bookDetail.btnClose}</Button>
                <Button variant="primary"   size="sm" onClick={handleLend} disabled={!memberId || lending}>{t.bookDetail.btnLend}</Button>
            </ModalFooter>
        </Modal>
    );
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)] mb-1">{label}</p>
            <div>{children}</div>
        </div>
    );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- BookDetailModal.test.tsx`
Expected: PASS — original tests plus the new edit/delete tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/BookDetailModal.tsx src/__tests__/BookDetailModal.test.tsx src/lib/i18n/types.ts src/lib/i18n/translations/en.ts src/lib/i18n/translations/fa.ts
git commit -m "feat: add edit button and delete-with-confirm to BookDetailModal"
```

---

### Task 7: Final wiring — AppShell, pages, routes, pagination, i18n, manual smoke test

**Files:**
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/pages/BooksPage.tsx`
- Modify: `src/components/pages/AuthorsPage.tsx`
- Modify: `src/app/(app)/books/page.tsx`
- Modify: `src/app/(app)/authors/page.tsx`
- Modify: `src/lib/i18n/types.ts`, `src/lib/i18n/translations/en.ts`, `src/lib/i18n/translations/fa.ts`
- Test: `src/__tests__/BooksPage.test.tsx`, `src/__tests__/AuthorsPage.test.tsx` (append new tests)

**Interfaces:**
- Consumes: `useLibrary()` (Task 4: `booksLoading/booksError/page/totalPages/setPage/refetchBooks/authors/authorsLoading/.../genres/editingBook/setEditingBook/updateBook/removeBookLocal`), `AddBookModal` (Task 5: `mode/initialData/genres`), `BookDetailModal` (Task 6: `onEdit/onDeleted`), `Pagination` (Task 3), `bookToFormData` (Task 1).
- Produces: fully wired Books/Authors pages — this is the last task, nothing downstream depends on it.

- [ ] **Step 1: Add `common.prev`/`common.next` i18n keys**

In `src/lib/i18n/types.ts`, add to the `common` section (right after `retry: string;`):

```ts
        retry: string;
        prev: string;
        next: string;
```

In `src/lib/i18n/translations/en.ts`, add to the `common` object (right after `retry: "Try again",`):

```ts
        retry: "Try again",
        prev: "Previous",
        next: "Next",
```

In `src/lib/i18n/translations/fa.ts`, add to the `common` object (right after `retry: "تلاش مجدد",`):

```ts
        retry: "تلاش مجدد",
        prev: "قبلی",
        next: "بعدی",
```

- [ ] **Step 2: Write the failing tests for pagination/loading in `BooksPage` and `AuthorsPage`**

Append to `src/__tests__/BooksPage.test.tsx` (new `describe` block; `fireEvent`/`render`/`screen` already imported):

```tsx
describe("BooksPage — loading and pagination", () => {
    it("shows loading text when isLoading and no books yet", () => {
        render(<BooksPage books={[]} onBookClick={jest.fn()} onAddBook={jest.fn()} isLoading />);
        expect(screen.getByText("Loading…")).toBeInTheDocument();
    });

    it("renders pagination controls when totalPages > 1", () => {
        render(
            <BooksPage
                books={BOOKS}
                onBookClick={jest.fn()}
                onAddBook={jest.fn()}
                page={1}
                totalPages={3}
                onPageChange={jest.fn()}
            />
        );
        expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    });

    it("calls onPageChange when a page button is clicked", () => {
        const onPageChange = jest.fn();
        render(
            <BooksPage
                books={BOOKS}
                onBookClick={jest.fn()}
                onAddBook={jest.fn()}
                page={1}
                totalPages={3}
                onPageChange={onPageChange}
            />
        );
        fireEvent.click(screen.getByRole("button", { name: "2" }));
        expect(onPageChange).toHaveBeenCalledWith(2);
    });
});
```

Append to `src/__tests__/AuthorsPage.test.tsx` (new `describe` block):

```tsx
describe("AuthorsPage — loading and pagination", () => {
    it("shows loading text when isLoading and no authors yet", () => {
        render(<AuthorsPage authors={[]} borgesWorks={[]} isLoading />);
        expect(screen.getByText("Loading…")).toBeInTheDocument();
    });

    it("renders pagination controls when totalPages > 1", () => {
        render(
            <AuthorsPage
                authors={MOCK_AUTHORS}
                borgesWorks={MOCK_WORKS}
                page={1}
                totalPages={3}
                onPageChange={jest.fn()}
            />
        );
        expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- BooksPage.test.tsx AuthorsPage.test.tsx`
Expected: FAIL — `isLoading`/`page`/`totalPages`/`onPageChange` props aren't read yet, no `<Pagination>` rendered.

- [ ] **Step 4: Update `src/components/pages/BooksPage.tsx`**

Replace the entire file contents:

```tsx
"use client";

import { useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { Book, BookStatus } from "@/src/lib/types";
import { interpolate, useLanguage } from "@/src/lib/i18n/context";
import { PageHeader } from "@/src/components/ui/Topbar";
import { Button } from "@/src/components/ui/Button";
import { DataTable, DataTableHead, DataTableBody, DataTableRow, Th, Td } from "@/src/components/ui/DataTable";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { StarRating } from "@/src/components/ui/StarRating";
import { GenreTag } from "@/src/components/ui/GenreTag";
import Pagination from "@/src/components/ui/Pagination";

interface BooksPageProps {
    books: Book[];
    onBookClick: (book: Book) => void;
    onAddBook: () => void;
    isError?: boolean;
    onRetry?: () => void;
    isLoading?: boolean;
    page?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

export default function BooksPage({
    books, onBookClick, onAddBook, isError, onRetry,
    isLoading = false, page = 1, totalPages = 1, onPageChange = () => {},
}: BooksPageProps) {
    const { t } = useLanguage();
    const [activeFilter, setActiveFilter] = useState<BookStatus | "All">("All");
    const filtered = activeFilter === "All" ? books : books.filter((b) => b.status === activeFilter);

    const FILTERS: { value: BookStatus | "All"; label: string }[] = [
        { value: "All",      label: t.books.filterAll },
        { value: "Owned",    label: t.books.filterOwned },
        { value: "Lent Out", label: t.books.filterLentOut },
        { value: "Wishlist", label: t.books.filterWishlist },
    ];

    return (
        <div data-testid="books-page">
            <PageHeader
                title={t.books.title}
                subtitle={interpolate(t.books.subtitle, { count: String(books.length) })}
                action={
                    <div className="flex items-center gap-2 flex-wrap">
                        {FILTERS.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setActiveFilter(value)}
                                className={[
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                    activeFilter === value
                                        ? "bg-[var(--accent)] text-white"
                                        : "bg-transparent text-[var(--muted)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]",
                                ].join(" ")}
                            >
                                {label}
                            </button>
                        ))}
                        <Button variant="primary" size="sm" onClick={onAddBook}>
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            {t.common.add}
                        </Button>
                    </div>
                }
            />

            {isError ? (
                <ErrorState
                    heading={t.common.errorHeading}
                    description={t.common.errorDescription}
                    retryLabel={t.common.retry}
                    onRetry={onRetry}
                />
            ) : isLoading && books.length === 0 ? (
                <p className="py-16 text-center text-sm text-[var(--muted)]">{t.common.loading}</p>
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
                <>
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
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        prevLabel={t.common.prev}
                        nextLabel={t.common.next}
                    />
                </>
            )}
        </div>
    );
}
```

- [ ] **Step 5: Update `src/components/pages/AuthorsPage.tsx`**

Replace the entire file contents:

```tsx
"use client";

import { Author, Book } from "@/src/lib/types";
import { interpolate, useLanguage } from "@/src/lib/i18n/context";
import { PageHeader } from "@/src/components/ui/Topbar";
import { Card, CardHeader, CardBody } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { DataTable, DataTableHead, DataTableBody, DataTableRow, Th, Td } from "@/src/components/ui/DataTable";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { StarRating } from "@/src/components/ui/StarRating";
import { GenreTag } from "@/src/components/ui/GenreTag";
import { Avatar } from "@/src/components/ui/Avatar";
import { Users, BookOpen } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import Pagination from "@/src/components/ui/Pagination";

interface AuthorsPageProps {
    authors: Author[];
    borgesWorks: Book[];
    isError?: boolean;
    onRetry?: () => void;
    isLoading?: boolean;
    page?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

export default function AuthorsPage({
    authors, borgesWorks, isError, onRetry,
    isLoading = false, page = 1, totalPages = 1, onPageChange = () => {},
}: AuthorsPageProps) {
    const { t } = useLanguage();

    return (
        <div data-testid="authors-page">
            <PageHeader
                title={t.authors.title}
                subtitle={interpolate(t.authors.subtitle, { count: String(authors.length) })}
            />

            {isError ? (
                <ErrorState
                    heading={t.common.errorHeading}
                    description={t.common.errorDescription}
                    retryLabel={t.common.retry}
                    onRetry={onRetry}
                />
            ) : isLoading && authors.length === 0 ? (
                <p className="py-16 text-center text-sm text-[var(--muted)] mb-6">{t.common.loading}</p>
            ) : authors.length === 0 ? (
                <EmptyState
                    heading={t.authors.emptyAuthors}
                    description={t.authors.emptyAuthorsDesc}
                    icon={<Users className="h-6 w-6" />}
                    className="mb-6"
                />
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
                        {authors.map((author) => (
                            <AuthorCard key={author.id} author={author} />
                        ))}
                    </div>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        prevLabel={t.common.prev}
                        nextLabel={t.common.next}
                    />
                    <div className="mb-6" />
                </>
            )}

            <Card>
                <CardHeader>
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                        {t.authors.completeWorksTitle}
                    </span>
                    <Button variant="ghost" size="sm">{t.authors.changeAuthor}</Button>
                </CardHeader>
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
            </Card>
        </div>
    );
}

function AuthorCard({ author }: { author: Author }) {
    const { t } = useLanguage();
    return (
        <Card className="text-center p-5 cursor-pointer hover:-translate-y-0.5 transition-transform">
            <CardBody className="flex flex-col items-center gap-2 p-0">
                <Avatar name={author.name} size="lg" />
                <div>
                    <p className="text-sm font-semibold text-[var(--foreground)] leading-tight">{author.name}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                        {interpolate(t.authors.booksInCollection, { count: String(author.bookCount) })}
                    </p>
                </div>
                <GenreTag genre={author.genre} />
            </CardBody>
        </Card>
    );
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test -- BooksPage.test.tsx AuthorsPage.test.tsx`
Expected: PASS.

- [ ] **Step 7: Update `src/app/(app)/books/page.tsx`**

Replace the entire file contents:

```tsx
'use client';

import {useLibrary} from '@/src/contexts/LibraryContext';
import {filterBooks} from '@/src/lib/utils';
import BooksPage from '@/src/components/pages/BooksPage';

export default function BooksRoute() {
    const {
        books, searchQuery, setSelectedBook, setShowAddModal,
        booksLoading, booksError, page, totalPages, setPage, refetchBooks,
    } = useLibrary();

    const filtered = filterBooks(books, searchQuery);

    return (
        <BooksPage
            books={filtered}
            onBookClick={setSelectedBook}
            onAddBook={() => setShowAddModal(true)}
            isError={booksError}
            onRetry={refetchBooks}
            isLoading={booksLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
        />
    );
}
```

- [ ] **Step 8: Update `src/app/(app)/authors/page.tsx`**

Replace the entire file contents. This file was a Server Component reading static mock data before — it now needs `'use client'` since it calls `useLibrary()`. Author book counts aren't returned by `GET /api/author` (the backend `Author` schema has no count field), so this computes a best-effort count from the currently-loaded books page — the same "loaded page only" limitation the Complete Works table already has:

```tsx
'use client';

import {useLibrary} from '@/src/contexts/LibraryContext';
import AuthorsPage from '@/src/components/pages/AuthorsPage';

export default function AuthorsRoute() {
    const {
        authors, books, authorsLoading, authorsError,
        authorsPage, authorsTotalPages, setAuthorsPage, refetchAuthors,
    } = useLibrary();

    const bookCountByAuthor = books.reduce<Record<string, number>>((acc, b) => {
        acc[b.author] = (acc[b.author] ?? 0) + 1;
        return acc;
    }, {});
    const authorsWithCounts = authors.map((a) => ({ ...a, bookCount: bookCountByAuthor[a.name] ?? 0 }));

    const borgesWorks = books.filter((b) => b.author === "Jorge Luis Borges");

    return (
        <AuthorsPage
            authors={authorsWithCounts}
            borgesWorks={borgesWorks}
            isError={authorsError}
            onRetry={refetchAuthors}
            isLoading={authorsLoading}
            page={authorsPage}
            totalPages={authorsTotalPages}
            onPageChange={setAuthorsPage}
        />
    );
}
```

- [ ] **Step 9: Update `src/components/AppShell.tsx`**

Replace the entire file contents:

```tsx
'use client';

import {useState} from 'react';
import {useLibrary} from '@/src/contexts/LibraryContext';
import Sidebar from '@/src/components/Sidebar';
import Topbar from '@/src/components/Topbar';
import BookDetailModal from '@/src/components/BookDetailModal';
import AddBookModal from '@/src/components/AddBookModal';
import {bookToFormData} from '@/src/lib/mappers';

export default function AppShell({children}: { children: React.ReactNode }) {
    const {
        selectedBook, setSelectedBook,
        showAddModal, setShowAddModal,
        editingBook, setEditingBook,
        genres,
        addBook, updateBook, removeBookLocal, markBookLent,
    } = useLibrary();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const showBookForm = showAddModal || !!editingBook;

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="lg:ms-[60px] min-h-screen flex flex-col">
                <Topbar onMenuToggle={() => setSidebarOpen(o => !o)}/>
                <div className="flex-1 p-6 lg:p-8">
                    {children}
                </div>
            </main>

            {selectedBook && (
                <BookDetailModal
                    book={selectedBook}
                    onClose={() => setSelectedBook(null)}
                    onLent={() => {
                        if (selectedBook) markBookLent(selectedBook.id);
                        setSelectedBook(null);
                    }}
                    onEdit={() => {
                        setEditingBook(selectedBook);
                        setSelectedBook(null);
                    }}
                    onDeleted={() => {
                        removeBookLocal(selectedBook.id);
                        setSelectedBook(null);
                    }}
                />
            )}
            {showBookForm && (
                <AddBookModal
                    key={editingBook?.id ?? 'add'}
                    mode={editingBook ? 'edit' : 'add'}
                    initialData={editingBook ? bookToFormData(editingBook, genres) : undefined}
                    genres={genres}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingBook(null);
                    }}
                    onAdd={async (data) => {
                        const result = editingBook
                            ? await updateBook(editingBook.id, data)
                            : await addBook(data);
                        return result.ok;
                    }}
                />
            )}
        </div>
    );
}
```

- [ ] **Step 10: Run the full test suite**

Run: `npm test`
Expected: PASS — every test file in the project is green, including all files touched in Tasks 1–7.

- [ ] **Step 11: Manual smoke test in the browser**

Run: `npm run dev` (in the background)

In a browser at `http://localhost:3000` (logged in against a real backend, or with `API_BASE_URL` pointed at one):
1. Open the **Books** page — confirm the list loads from the real API (not the old mock titles like "Blood Meridian"), and pagination controls appear if there's more than one page.
2. Open the **Authors** page — confirm real authors load, with pagination if applicable.
3. Click a book to open its detail modal, click **Edit**, change the title, save — confirm the row updates.
4. Click a book, click **Delete** — confirm it asks for confirmation, then click it again — confirm the book disappears from the list. If the book has lending history, confirm a conflict message appears instead and the book stays.
5. Click **Add** and create a book with a genre selected — confirm the new genre-picker dropdown lists real genres and the created book shows the right genre tag.

Stop the dev server afterward. Note any discrepancies found and fix before considering the task complete.

- [ ] **Step 12: Commit**

```bash
git add src/components/AppShell.tsx src/components/pages/BooksPage.tsx src/components/pages/AuthorsPage.tsx "src/app/(app)/books/page.tsx" "src/app/(app)/authors/page.tsx" src/__tests__/BooksPage.test.tsx src/__tests__/AuthorsPage.test.tsx src/lib/i18n/types.ts src/lib/i18n/translations/en.ts src/lib/i18n/translations/fa.ts
git commit -m "feat: wire book/author list pagination, edit, and delete end-to-end"
```
