# Design: Wire book/author list, book edit, book delete to real API

Date: 2026-08-11

## Goal

Replace mock data with real backend calls for:

- `GET /api/book` — paginated book list
- `GET /api/author` — paginated author list
- `PUT /api/book/{id}` — update a book
- `DELETE /api/book/{id}` — delete a book (ownership-enforced, 409 on lending-history conflict)

Plus a scope addition agreed during design: the genre picker in `AddBookModal` currently offers a hardcoded string list disconnected from real genre IDs, so create/edit never sends `genreId`. This is fixed as part of this work using the already-existing `GET /api/genre` endpoint.

## Non-goals

- Making the Authors page's "Complete Works" table author-selectable (`Change Author` stays inert, as it is today).
- Populating `description`, `notes`, `lendingHistory`, `lentTo`, `dueBack`, `dateLent`, `overdue` on books fetched from `GET /api/book` — the backend `Book` schema doesn't carry these fields; they remain unset for real (non-mock) books, same as they're simply absent from the API today. No fix attempted here.
- Building author create/edit/delete UI (only the list is wired).
- Genre CRUD UI.

## Data types (`src/lib/types.ts`)

```ts
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

## Mapping layer (`src/lib/mappers.ts`, new file)

- `mapBackendBookToBook(b: BackendBook, genreMap: Map<number,string>): Book`
  - `id`: `String(b.id)`
  - `title`: `b.name`
  - `author`: `b.author.name`
  - `year`: parsed from `b.publishedDate` (first 4-digit run via regex; fallback `new Date().getFullYear()`)
  - `genre`: `genreMap.get(b.genreId ?? -1) ?? "Other"`
  - `status`: mapped via `STATUS_BACKEND_TO_FRONTEND` table below, fallback `"Owned"`
  - `publisher`, `isbn`, `pages`, `rating`: passthrough
  - `description`, `notes`, `lendingHistory`, `lentTo`, `dueBack`, `dateLent`, `overdue`: left `undefined` (see Non-goals)
- `mapBackendAuthorToAuthor(a: BackendAuthor, bookCount: number): Author`
  - `id`: `String(a.id)`, `name`: `a.name`, `initials`: derived from name (first letters of up to 2 words), `bookCount`, `genre`: `""` (backend has no author-level genre; `GenreTag` given empty string renders existing "Other" fallback — verify at implementation time)

```ts
const STATUS_BACKEND_TO_FRONTEND: Record<string, BookStatus> = {
  OWNED: "Owned",
  LENT_OUT: "Lent Out",
  WISHLIST: "Wishlist",
  READ: "Read",
};
```

## BFF routes (Next.js route handlers proxying to `API_BASE_URL`)

All follow the existing pattern in the codebase (cookie-based bearer token, try/catch → 503, pass through backend status).

- `src/app/api/book/route.ts`: add `GET`, forwarding `page`/`pageSize` query params from `req.nextUrl.searchParams` to the backend call.
- `src/app/api/author/route.ts`: add `GET`, same query-param forwarding.
- `src/app/api/book/[id]/route.ts`: add `PUT` (forwards JSON body) and `DELETE`. `DELETE` forwards the backend's raw status (204 success / 400 / 401 / 404 / 409) with no body parsing required for 204 — `res.status === 204` returns `new NextResponse(null, { status: 204 })`, otherwise attempts `res.json()` same as other handlers.
- `GET /api/genre` BFF route already exists (`src/app/api/genre/route.ts`) — reused as-is, no changes.

## `LibraryContext` (`src/contexts/LibraryContext.tsx`)

State additions:
- `books: Book[]` (seeded `[]`, no longer from mock `BOOKS`)
- `booksLoading: boolean`, `booksError: boolean`
- `page`, `pageSize` (default 20), `totalPages`, `totalItems`, `setPage`
- `authors: Author[]`, `authorsLoading`, `authorsError`, `authorsPage`, `authorsTotalPages`, `setAuthorsPage`
- `genres: BackendGenre[]`

Behavior:
- On mount: fetch genres (`GET /api/genre`), fetch books page 1 (`GET /api/book?page=1&pageSize=20`), fetch authors page 1 (`GET /api/author?page=1&pageSize=20`) — independent fetches, each sets its own loading/error.
- Changing `page` refetches books for that page. Changing `authorsPage` refetches authors.
- `buildBookPayload(form: NewBookFormData)`: extracted shared helper (used by both `addBook` and new `updateBook`) building the POST/PUT body, now including `genreId: form.genre ? Number(form.genre) : undefined` (replaces the old free-text genre field, which was never sent to the backend).
- `addBook`: unchanged control flow, now uses `buildBookPayload` and maps the create response through `mapBackendBookToBook` for the optimistic local insert (instead of hand-building the `Book` object).
- `updateBook(id: string, form: NewBookFormData): Promise<{ok: boolean}>`: `PUT /api/book/{id}` with `buildBookPayload(form)`; on success, replaces the matching item in `books` with the mapped response.
- `deleteBook(id: string): Promise<{ok: boolean; status: number}>`: `DELETE /api/book/{id}`; on `res.ok` (204), removes the item from `books`; always returns `status` so the caller can special-case 409.

## UI

### `src/components/ui/Pagination.tsx` (new)

Props: `{ page: number; totalPages: number; onPageChange: (page: number) => void }`. Renders Prev/Next buttons plus a bounded window of page-number buttons (e.g. current ± 2, with first/last always shown and `…` truncation beyond that). Hidden entirely when `totalPages <= 1`. Used by `BooksPage` and `AuthorsPage`.

### `AddBookModal`

New props: `mode: "add" | "edit"` (default `"add"`), `initialData?: NewBookFormData`, `genres: BackendGenre[]`.
- Form seeds from `initialData ?? EMPTY_FORM`.
- Genre `<Select>` options become `genres.map(g => ({ value: String(g.id), label: g.name }))` (replaces the hardcoded `genreOptions` array and the now-unused `t.addBook.genres.*` strings — left in translation files, just unreferenced, to avoid unrelated i18n churn).
- Header title/subtitle and submit button label switch between `t.addBook.title`/`t.addBook.btnAdd` and new `t.addBook.titleEdit`/`t.addBook.btnSave`.
- `onSubmit` prop stays generic (`onSubmit: (form) => Promise<boolean>`); `LibraryProvider` passes either `addBook` or `updateBook` bound to the editing book's id.

### `BookDetailModal`

- New Edit button (`t.bookDetail.btnEdit`) → calls new `onEdit?: () => void` prop, which `BooksRoute`/provider wires to open `AddBookModal` in edit mode pre-filled from the selected book. (Note: `Book.genre` currently holds a name, not id — the edit form's initial genre value is resolved by looking up the id from `genres` where `name === book.genre`; if not found, left blank.)
- Delete button: click 1 → local `confirmingDelete` state flips true, label becomes `t.bookDetail.btnConfirmDelete`, style stays `danger`. Click 2 → calls `deleteBook(book.id)`. On `status === 409`: show `t.bookDetail.errorDeleteConflict`, reset `confirmingDelete` to `false`. On other failure: show `t.common.errorHeading`. On success: call `onClose()`.

### `BooksPage` / `AuthorsPage`

- `isError`/`onRetry` props (already present) now fed real `booksError`/`authorsError` and a refetch callback instead of always `false`/`undefined`.
- Add a lightweight `booksLoading && books.length === 0` guard rendering a simple "Loading…" text row (no new skeleton component — YAGNI).
- Render `<Pagination>` below the table/grid when applicable.
- `AuthorsPage`'s "Complete Works" table keeps its current hardcoded Borges framing (see Non-goals) but its rows now come from filtering the live `books` array by `author === "Jorge Luis Borges"` instead of importing mock `BORGES_WORKS`.

## i18n additions (`en.ts` + `fa.ts`)

- `addBook.titleEdit`, `addBook.btnSave`
- `bookDetail.btnEdit`, `bookDetail.btnConfirmDelete`, `bookDetail.errorDeleteConflict`
- `common.prev`, `common.next`, `common.pageOf` (interpolated, e.g. `"Page {page} of {total}"`)

## Testing

Jest + RTL already configured (`npm test`). Add/extend:
- `mappers.test.ts`: status mapping (all 4 + unknown fallback), year parsing (valid date, garbage string), genre lookup (found/missing).
- `Pagination.test.tsx`: renders nothing at `totalPages<=1`; click handlers fire with correct page numbers; boundary behavior at first/last page.
- `LibraryContext` tests: `updateBook` success path replaces item; `deleteBook` success removes item; `deleteBook` 409 leaves item in place and surfaces status.
- `AddBookModal` edit-mode test: prefilled fields, submit calls `onSubmit` with edited data, title/button reflect edit mode.
- `BookDetailModal` delete-confirm test: first click shows confirm state without calling API; second click calls delete; 409 response shows conflict message and book remains.

## Open implementation notes (not decisions, just flags for the plan)

- `Author.genre` has no backend source (see mapper section) — implementation should confirm `GenreTag` handles an empty string gracefully or pick a documented fallback.
- `buildBookPayload` refactor touches the already-shipped `addBook` path — plan should include a quick manual smoke test of "Add Book" after the refactor, not just automated tests.
