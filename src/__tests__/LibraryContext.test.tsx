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
            status: "OWNED",
        });
    });

    it("does not include status in POST body when status is Wishlist", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 99 }) });
        const TestHarness = () => {
            const { addBook } = useLibrary();
            return <button onClick={() => addBook({ ...FORM, status: "Wishlist" })}>add</button>;
        };
        render(<LibraryProvider><TestHarness /></LibraryProvider>);
        await userEvent.click(screen.getByText("add"));
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(opts.body);
        expect(body).not.toHaveProperty("status");
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
