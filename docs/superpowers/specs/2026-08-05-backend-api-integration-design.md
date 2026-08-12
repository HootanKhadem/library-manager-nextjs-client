# Backend API Integration — Design

## Context

Backend exposes an OpenAPI spec at `http://localhost:8080/docs/documentation.yaml` (basic auth `swagger`/`swagger`, dev-only). Client already proxies auth (login), dashboard stats/recently-added/recent-activity, and lending/active through Next.js Route Handlers under `src/app/api/**`, each following the same pattern:

```ts
export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  let res: Response;
  try {
    res = await fetch(`${process.env.API_BASE_URL}/<backend-path>`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
  }
  const data = await res.json().catch(() => <fallback>);
  return NextResponse.json(data, { status: res.status });
}
```

Remaining backend endpoints (book, author, genre, member, lending create/return, admin users) are not proxied at all — the corresponding UI (`LibraryContext`, `AddBookModal`, `BookDetailModal`, `LentPage`) still operates on the static mock data in `src/lib/data.ts`.

## Goal

1. Add BFF proxy routes for every backend endpoint not yet exposed client-side.
2. Wire the routes that have an existing UI hook point into real data: creating a book, lending a book, returning a book.
3. Document what stays on mock data and why (backend gaps or explicit scope cuts), so it's not mistaken for an oversight later.

## Out of scope (explicit)

- Genre management page, Member management page, Admin user-creation page. Proxy routes are built so the endpoints are ready, but no nav entry or page is added — building those is a separate feature project (confirmed with user).
- Book edit/delete, book list-all, author list-all — backend has no endpoints for these (`GET /api/book` collection, `PUT/DELETE /api/book/{id}`, `GET /api/author` collection all absent from the spec). Books-page table and Authors-page grid keep using `src/lib/data.ts`.
- "Remind" button on `LentPage` — no notification/reminder endpoint exists on the backend.

## Phase 1 — Proxy routes

New Route Handlers, each mirroring the pattern above (cookie → Bearer header → forward status/body → `503` on network failure):

| Route | Backend | Method |
|---|---|---|
| `src/app/api/book/route.ts` | `/api/book` | POST |
| `src/app/api/book/[id]/route.ts` | `/api/book/{id}` | GET |
| `src/app/api/books/count/route.ts` | `/count-user-books` | GET |
| `src/app/api/author/route.ts` | `/api/author` | POST |
| `src/app/api/author/search/route.ts` | `/api/author/search?query=` | GET |
| `src/app/api/genre/route.ts` | `/api/genre` | GET, POST |
| `src/app/api/genre/[id]/route.ts` | `/api/genre/{id}` | PUT, DELETE |
| `src/app/api/member/route.ts` | `/api/member` | GET, POST |
| `src/app/api/member/[id]/route.ts` | `/api/member/{id}` | PUT, DELETE |
| `src/app/api/lending/route.ts` | `/api/lending` | POST |
| `src/app/api/lending/[id]/return/route.ts` | `/api/lending/{id}/return` | PUT |
| `src/app/api/admin/users/route.ts` | `/admin/users` | POST |

Behavior notes:
- All require the `access_token` cookie; `401` if absent (backend re-validates the JWT anyway, this just avoids a wasted round trip).
- `DELETE` routes return `204` with an empty body — must not call `res.json()` on empty responses (guard on `res.status !== 204`).
- `search` and query-string routes forward `req.nextUrl.searchParams` straight through.
- `/api/admin/users` proxies straight through; backend enforces the ADMIN role and returns `403` for non-admins, which the route just passes along.

## Phase 2 — Wire into existing UI

**`AddBookModal` → `LibraryContext.addBook`**
`addBook` becomes async, `POST`s to `/api/book`, and on success prepends the returned `Book` (from the backend response, not a client-synthesized one) to state. On failure, the modal stays open and surfaces an inline error (reuse existing form error styling — no new component).

**`BookDetailModal` "Lend" button**
Currently a dead button. Add a small inline member picker (native `<select>`, populated from `GET /api/member`, fetched when the modal opens) plus the existing Lend button now `POST`s `/api/lending` with `{ bookId, memberId, lentDate }`. On success, close modal and let the parent page's data refresh (same refetch pattern `LentPage` already uses).

**`LentPage` "Mark returned" button**
Wire to `PUT /api/lending/{id}/return`. On success, call the existing `load()` to refetch the active-lending list (same as retry-after-error already does).

## Error handling

Follow the established convention: `503` with a friendly message on network failure, otherwise pass through the backend's status/body untouched. UI-side, reuse `ErrorState`/inline error patterns already in the codebase — no new error-handling primitives.

## Testing

Each new route gets a test file under `src/__tests__/api/**` mirroring the existing route tests (e.g. `src/__tests__/api/lending/active.route.test.ts`): asserts `401` with no cookie, forwards `Authorization` header, passes through backend status/body, and returns `503` on fetch failure. Wired UI changes (`AddBookModal`, `BookDetailModal`, `LentPage`) get updated/new component tests following the existing RTL patterns in `src/__tests__/`.
