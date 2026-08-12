import { useState } from "react";
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

    it("sets authorsError when the author list fetch fails", async () => {
        setupFetchMock({ "GET /api/author?page=1&pageSize=20": () => jsonResponse(500, {}) });
        function AuthorErrorHarness() {
            const { authorsLoading, authorsError } = useLibrary();
            return <span data-testid="state">{authorsLoading ? "loading" : authorsError ? "error" : "ok"}</span>;
        }
        render(<LibraryProvider><AuthorErrorHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("error"));
    });
});

describe("LibraryContext pagination race", () => {
    afterEach(() => jest.resetAllMocks());

    it("discards a stale page-2 response that resolves after a newer page-3 request", async () => {
        let resolvePage2: (value: unknown) => void = () => {};
        const page2Promise = new Promise((resolve) => { resolvePage2 = resolve; });
        setupFetchMock({
            "GET /api/book?page=2&pageSize=20": () => page2Promise as Promise<unknown>,
            "GET /api/book?page=3&pageSize=20": () =>
                jsonResponse(200, { items: [SAMPLE_BOOK_2], page: 3, pageSize: 20, totalItems: 2, totalPages: 3 }),
        });
        function PageHarness() {
            const { books, page, setPage } = useLibrary();
            return (
                <div>
                    <span data-testid="page">{page}</span>
                    <button onClick={() => setPage(2)}>page2</button>
                    <button onClick={() => setPage(3)}>page3</button>
                    <ul>{books.map((b) => <li key={b.id}>{b.title}</li>)}</ul>
                </div>
            );
        }
        render(<LibraryProvider><PageHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByTestId("page")).toHaveTextContent("1"));

        await userEvent.click(screen.getByText("page2"));
        await userEvent.click(screen.getByText("page3"));

        await waitFor(() => expect(screen.getByTestId("page")).toHaveTextContent("3"));
        expect(screen.getByText("Ficciones")).toBeInTheDocument();

        // Now let the stale page-2 request resolve after page-3 already committed.
        resolvePage2({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ items: [SAMPLE_BOOK], page: 2, pageSize: 20, totalItems: 2, totalPages: 3 }),
        });

        // Give the stale response's microtasks (and React's own scheduling) a chance to run, then assert it did NOT win.
        await new Promise((r) => setTimeout(r, 50));
        expect(screen.getByTestId("page")).toHaveTextContent("3");
        expect(screen.getByText("Ficciones")).toBeInTheDocument();
        expect(screen.queryByText("Dune")).not.toBeInTheDocument();
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

    // Regression coverage for Finding 1: PUT must never conditionally drop `status`,
    // unlike POST (see the addBook describe block above, which asserts the opposite
    // for Wishlist/Lent Out and must keep passing unchanged).
    it.each([
        ["Wishlist", "WISHLIST"],
        ["Lent Out", "LENT_OUT"],
        ["Read", "READ"],
        ["Owned", "OWNED"],
    ] as const)("includes status:%s -> %s in the PUT body", async (frontendStatus, backendStatus) => {
        setupFetchMock({
            "GET /api/book?page=1&pageSize=20": () => jsonResponse(200, { items: [SAMPLE_BOOK], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }),
            "PUT /api/book/42": () => jsonResponse(200, SAMPLE_BOOK),
        });
        function UpdateHarness() {
            const { updateBook } = useLibrary();
            return <button onClick={() => updateBook("42", { ...FORM, status: frontendStatus })}>update</button>;
        }
        render(<LibraryProvider><UpdateHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByText("update")).toBeInTheDocument());
        await userEvent.click(screen.getByText("update"));
        await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.some(([, o]: [string, RequestInit]) => o?.method === "PUT")).toBe(true));
        const [, opts] = (global.fetch as jest.Mock).mock.calls.find(([, o]: [string, RequestInit]) => o?.method === "PUT")!;
        const body = JSON.parse(opts.body);
        expect(body.status).toBe(backendStatus);
    });

    it("includes genreId in the PUT body when a genre is selected", async () => {
        setupFetchMock({
            "GET /api/book?page=1&pageSize=20": () => jsonResponse(200, { items: [SAMPLE_BOOK], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }),
            "PUT /api/book/42": () => jsonResponse(200, SAMPLE_BOOK),
        });
        function UpdateHarness() {
            const { updateBook } = useLibrary();
            // FORM.genre is "Science Fiction" (a name, not an id) so Number(genre) is NaN there —
            // use a numeric genre id here to exercise the "genre is set" branch.
            return <button onClick={() => updateBook("42", { ...FORM, genre: "3" })}>update</button>;
        }
        render(<LibraryProvider><UpdateHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByText("update")).toBeInTheDocument());
        await userEvent.click(screen.getByText("update"));
        await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.some(([, o]: [string, RequestInit]) => o?.method === "PUT")).toBe(true));
        const [, opts] = (global.fetch as jest.Mock).mock.calls.find(([, o]: [string, RequestInit]) => o?.method === "PUT")!;
        expect(JSON.parse(opts.body)).toMatchObject({ genreId: 3 });
    });

    // Regression coverage for Finding 2: a 2xx response whose body isn't full BackendBook
    // shape (missing author.name) must not throw out of updateBook — it should resolve
    // { ok: false } so callers like AddBookModal can always clear their loading state.
    it("resolves { ok: false } instead of throwing when mapping the PUT response body throws", async () => {
        setupFetchMock({
            "GET /api/book?page=1&pageSize=20": () => jsonResponse(200, { items: [SAMPLE_BOOK], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }),
            "PUT /api/book/42": () =>
                Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ id: 42, get author(): never { throw new Error("malformed"); } }),
                }),
        });
        function UpdateHarness() {
            const { updateBook } = useLibrary();
            const [result, setResult] = useState<string>("pending");
            return (
                <div>
                    <button onClick={async () => setResult(String((await updateBook("42", FORM)).ok))}>update</button>
                    <span data-testid="result">{result}</span>
                </div>
            );
        }
        render(<LibraryProvider><UpdateHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByText("update")).toBeInTheDocument());
        await userEvent.click(screen.getByText("update"));
        await waitFor(() => expect(screen.getByTestId("result")).toHaveTextContent("false"));
    });
});

describe("LibraryContext malformed-response guards", () => {
    afterEach(() => jest.resetAllMocks());

    it("sets booksError instead of hanging in loading when the book page body has no items array", async () => {
        setupFetchMock({ "GET /api/book?page=1&pageSize=20": () => jsonResponse(200, {}) });
        function ErrorHarness() {
            const { booksLoading, booksError } = useLibrary();
            return <span data-testid="state">{booksLoading ? "loading" : booksError ? "error" : "ok"}</span>;
        }
        render(<LibraryProvider><ErrorHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("error"));
    });

    it("sets authorsError instead of hanging in loading when the author page body has no items array", async () => {
        setupFetchMock({ "GET /api/author?page=1&pageSize=20": () => jsonResponse(200, {}) });
        function AuthorErrorHarness() {
            const { authorsLoading, authorsError } = useLibrary();
            return <span data-testid="state">{authorsLoading ? "loading" : authorsError ? "error" : "ok"}</span>;
        }
        render(<LibraryProvider><AuthorErrorHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("error"));
    });

    it("resolves { ok: false } instead of throwing when mapping the POST response body throws", async () => {
        // A body whose `author` getter throws simulates any unexpected-shape response that
        // would otherwise crash mapBackendBookToBook — addBook must catch it, not propagate it.
        setupFetchMock({
            "POST /api/book": () =>
                Promise.resolve({
                    ok: true,
                    status: 201,
                    json: () => Promise.resolve({ id: 99, get author(): never { throw new Error("malformed"); } }),
                }),
        });
        function AddErrorHarness() {
            const { addBook } = useLibrary();
            const [result, setResult] = useState<string>("pending");
            return (
                <div>
                    <button onClick={async () => setResult(String((await addBook(FORM)).ok))}>add</button>
                    <span data-testid="result">{result}</span>
                </div>
            );
        }
        render(<LibraryProvider><AddErrorHarness /></LibraryProvider>);
        await waitFor(() => expect(screen.getByText("add")).toBeInTheDocument());
        await userEvent.click(screen.getByText("add"));
        await waitFor(() => expect(screen.getByTestId("result")).toHaveTextContent("false"));
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
