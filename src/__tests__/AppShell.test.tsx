import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LibraryProvider } from "@/src/contexts/LibraryContext";
import { LanguageProvider } from "@/src/lib/i18n/context";
import { AuthProvider } from "@/src/contexts/AuthContext";
import AppShell from "@/src/components/AppShell";
import BookDetailRoute from "@/src/app/(app)/books/[id]/page";
import { BackendBook, BackendGenre, PagedResponse } from "@/src/lib/types";

// AppShell composes Sidebar + Topbar. Topbar calls usePathname() and, since it
// now has an account menu with a logout button, useRouter().
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
    usePathname: () => "/books/42",
    useParams: () => ({ id: "42" }),
    useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
}));

// The barcode scanner pulls in a camera-dependent library; it's never opened in these
// tests, but AddBookModal/Topbar reference it, so keep the import inert under jsdom.
jest.mock("@zxing/browser", () => ({
    BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
        decodeFromVideoDevice: jest.fn().mockResolvedValue({ stop: jest.fn() }),
    })),
}));

const EMPTY_PAGE: PagedResponse<unknown> = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 };

const GENRES: BackendGenre[] = [{ id: 7, name: "Science Fiction" }];

const WISHLIST_BOOK: BackendBook = {
    id: 42,
    name: "Dune",
    author: { id: 1, name: "Frank Herbert" },
    pages: 412,
    isbn: "123",
    publishedDate: "1965",
    publisher: "Chilton",
    quantity: 1,
    rating: 5,
    status: "WISHLIST",
    genreId: 7,
};

const OWNED_BOOK: BackendBook = {
    id: 42,
    name: "Blood Meridian",
    author: { id: 2, name: "Cormac McCarthy" },
    pages: 337,
    isbn: "456",
    publishedDate: "1985",
    publisher: "Random House",
    quantity: 1,
    status: "OWNED",
};

function jsonResponse(status: number, body: unknown) {
    return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });
}

type FetchHandler = (url: string, opts?: RequestInit) => Promise<unknown>;

function setupFetchMock(extra: Record<string, FetchHandler> = {}) {
    global.fetch = jest.fn((url: string, opts?: RequestInit) => {
        const key = `${opts?.method ?? "GET"} ${url}`;
        if (extra[key]) return extra[key](url, opts);
        if (url === "/api/genre") return jsonResponse(200, GENRES);
        if (url === "/api/member") return jsonResponse(200, []);
        if (url.startsWith("/api/book?")) return jsonResponse(200, EMPTY_PAGE);
        if (url.startsWith("/api/author?")) return jsonResponse(200, EMPTY_PAGE);
        return Promise.reject(new Error(`unexpected fetch: ${key}`));
    }) as jest.Mock;
}

function renderApp() {
    return render(
        <AuthProvider>
            <LanguageProvider>
                <LibraryProvider>
                    <AppShell>
                        <BookDetailRoute />
                    </AppShell>
                </LibraryProvider>
            </LanguageProvider>
        </AuthProvider>
    );
}

describe("AppShell integration — edit round-trip", () => {
    afterEach(() => jest.resetAllMocks());

    it("preserves status and genre on save (regression test for Finding 1)", async () => {
        setupFetchMock({
            "GET /api/book/42": () => jsonResponse(200, WISHLIST_BOOK),
            "PUT /api/book/42": () => jsonResponse(200, { ...WISHLIST_BOOK, name: "Dune (Revised)" }),
        });

        renderApp();

        // Detail page loads; click Edit to open the AddBookModal in edit mode.
        expect(await screen.findByRole("heading", { name: "Dune" })).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Edit" }));

        // Edit form opens, pre-filled from the selected book.
        const modal = await screen.findByTestId("add-book-modal");
        expect(modal).toBeInTheDocument();
        const titleInput = screen.getByPlaceholderText(/The Brothers Karamazov/i);
        expect(titleInput).toHaveValue("Dune");

        // Change an unrelated field and save — status/genre should still round-trip correctly.
        await userEvent.clear(titleInput);
        await userEvent.type(titleInput, "Dune (Revised)");
        await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

        await waitFor(() => {
            const putCall = (global.fetch as jest.Mock).mock.calls.find(([, o]: [string, RequestInit]) => o?.method === "PUT");
            expect(putCall).toBeDefined();
        });
        const [url, opts] = (global.fetch as jest.Mock).mock.calls.find(([, o]: [string, RequestInit]) => o?.method === "PUT")!;
        expect(url).toBe("/api/book/42");
        const body = JSON.parse(opts.body);
        expect(body.status).toBe("WISHLIST");
        expect(body.genreId).toBe(7);
    });
});

describe("AppShell integration — delete flow", () => {
    afterEach(() => jest.resetAllMocks());

    it("confirms, deletes, and returns to the books list", async () => {
        setupFetchMock({
            "GET /api/book/42": () => jsonResponse(200, OWNED_BOOK),
            "DELETE /api/book/42": () => jsonResponse(204, null),
        });

        renderApp();

        expect(await screen.findByRole("heading", { name: "Blood Meridian" })).toBeInTheDocument();

        // First click asks for confirmation, second click performs the delete.
        await userEvent.click(screen.getByRole("button", { name: "Delete" }));
        await userEvent.click(await screen.findByRole("button", { name: "Confirm Delete?" }));

        await waitFor(() => {
            const deleteCall = (global.fetch as jest.Mock).mock.calls.find(([, o]: [string, RequestInit]) => o?.method === "DELETE");
            expect(deleteCall).toBeDefined();
        });
        const [url] = (global.fetch as jest.Mock).mock.calls.find(([, o]: [string, RequestInit]) => o?.method === "DELETE")!;
        expect(url).toBe("/api/book/42");

        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/books"));
    });
});
