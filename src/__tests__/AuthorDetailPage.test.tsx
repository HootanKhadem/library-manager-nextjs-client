import { render, screen } from "@testing-library/react";
import AuthorDetailPage from "@/src/components/pages/AuthorDetailPage";
import { LanguageProvider } from "@/src/lib/i18n/context";

jest.mock("@/src/contexts/LibraryContext", () => ({
    useLibrary: () => ({ genres: [{ id: 1, name: "Fiction" }], dataVersion: 0, refetchAuthors: jest.fn(), refetchBooks: jest.fn() }),
}));

function jsonResponse(status: number, body: unknown) {
    return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });
}

function renderPage() {
    return render(<LanguageProvider><AuthorDetailPage id="5" /></LanguageProvider>);
}

describe("AuthorDetailPage", () => {
    afterEach(() => jest.resetAllMocks());

    it("shows the author, stats and works linked to book pages", async () => {
        global.fetch = jest.fn((url: string) => {
            if (url === "/api/author/5") return jsonResponse(200, { id: 5, name: "Jorge Borges", image: "" });
            if (url === "/api/author/5/books") {
                return jsonResponse(200, [
                    { id: 9, name: "Ficciones", author: { id: 5, name: "Jorge Borges" }, pages: 174, isbn: "1", publishedDate: "1944", publisher: "Sur", quantity: 1, status: "OWNED", genreId: 1, rating: 4 },
                ]);
            }
            return Promise.reject(new Error(url));
        }) as jest.Mock;

        renderPage();
        expect(await screen.findByRole("heading", { name: "Jorge Borges" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Ficciones" })).toHaveAttribute("href", "/books/9");
        expect(screen.getByText("4.0")).toBeInTheDocument();
    });

    it("shows not-found for an unknown author", async () => {
        global.fetch = jest.fn(() => jsonResponse(404, {})) as jest.Mock;
        renderPage();
        expect(await screen.findByText("This author could not be found.")).toBeInTheDocument();
    });
});
