import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BookDetailModal from "@/src/components/BookDetailModal";
import {Book} from "@/src/lib/types";

const mockBook: Book = {
    id: "test-book",
    title: "Blood Meridian",
    author: "Cormac McCarthy",
    year: 1985,
    genre: "Fiction",
    status: "Owned",
    rating: 5,
    publisher: "Random House",
    isbn: "978-0679728757",
    pages: 337,
    description: "A dark and violent western novel.",
    notes: "One of the best.",
    lendingHistory: [
        {lentTo: "Sofia K.", dateOut: "Mar 2024", dateReturned: "May 2024", condition: "Good"},
    ],
};

describe("BookDetailModal component", () => {
    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("renders null when book is null", () => {
        const {container} = render(<BookDetailModal book={null} onClose={jest.fn()}/>);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders the book title", () => {
        render(<BookDetailModal book={mockBook} onClose={jest.fn()}/>);
        expect(screen.getByRole("heading", {name: "Blood Meridian"})).toBeInTheDocument();
    });

    it("renders the author and year", () => {
        render(<BookDetailModal book={mockBook} onClose={jest.fn()}/>);
        expect(screen.getByText("Cormac McCarthy · 1985")).toBeInTheDocument();
    });

    it("renders the book description", () => {
        render(<BookDetailModal book={mockBook} onClose={jest.fn()}/>);
        expect(screen.getByText("A dark and violent western novel.")).toBeInTheDocument();
    });

    it("renders the lending history", () => {
        render(<BookDetailModal book={mockBook} onClose={jest.fn()}/>);
        expect(screen.getByText("Sofia K.")).toBeInTheDocument();
        expect(screen.getByText("Mar 2024")).toBeInTheDocument();
        expect(screen.getByText("May 2024")).toBeInTheDocument();
    });

    it("calls onClose when Close button is clicked", () => {
        const onClose = jest.fn();
        render(<BookDetailModal book={mockBook} onClose={onClose}/>);
        fireEvent.click(screen.getByText("Close"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when X button is clicked", () => {
        const onClose = jest.fn();
        render(<BookDetailModal book={mockBook} onClose={onClose}/>);
        // aria-label is now t.common.close = "Close" (from the default en context)
        fireEvent.click(screen.getByLabelText("Close"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose on Escape key press", () => {
        const onClose = jest.fn();
        render(<BookDetailModal book={mockBook} onClose={onClose}/>);
        fireEvent.keyDown(document, {key: "Escape"});
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("renders status badge", () => {
        render(<BookDetailModal book={mockBook} onClose={jest.fn()}/>);
        expect(screen.getByText("Owned")).toBeInTheDocument();
    });

    it("renders publisher and ISBN when present", () => {
        render(<BookDetailModal book={mockBook} onClose={jest.fn()}/>);
        expect(screen.getByText("Random House")).toBeInTheDocument();
        expect(screen.getByText("978-0679728757")).toBeInTheDocument();
    });

    it("renders the notes textarea with pre-filled notes", () => {
        render(<BookDetailModal book={mockBook} onClose={jest.fn()}/>);
        // aria-label is now t.bookDetail.labelNotes = "My Notes & Comments" (en default)
        const textarea = screen.getByLabelText("My Notes & Comments") as HTMLTextAreaElement;
        expect(textarea.defaultValue.trim()).toBe("One of the best.");
    });

    it("has dialog role and aria-modal", () => {
        render(<BookDetailModal book={mockBook} onClose={jest.fn()}/>);
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("fetches members and lends the book when Lend is clicked", async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([{ id: 3, name: "Sofia K." }]) })
            .mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 9, status: "ACTIVE" }) });

        const onLent = jest.fn();
        render(<BookDetailModal book={{ ...mockBook, id: "42" }} onClose={jest.fn()} onLent={onLent} />);

        await waitFor(() => expect(screen.getByLabelText(/lend to/i)).toBeInTheDocument());
        await userEvent.selectOptions(screen.getByLabelText(/lend to/i), "3");
        await userEvent.click(screen.getByRole("button", { name: /lend/i }));

        await waitFor(() => expect(onLent).toHaveBeenCalled());
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[1];
        expect(url).toBe("/api/lending");
        expect(JSON.parse(opts.body)).toMatchObject({ bookId: 42, memberId: 3 });
    });

    it("shows an inline error and keeps the modal open when lending fails", async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([{ id: 3, name: "Sofia K." }]) })
            .mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Not found" }) });

        const onClose = jest.fn();
        const onLent = jest.fn();
        render(<BookDetailModal book={{ ...mockBook, id: "999" }} onClose={onClose} onLent={onLent} />);

        await waitFor(() => expect(screen.getByLabelText(/lend to/i)).toBeInTheDocument());
        await userEvent.selectOptions(screen.getByLabelText(/lend to/i), "3");
        await userEvent.click(screen.getByRole("button", { name: /lend/i }));

        expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i);
        expect(onLent).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
});

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
