import {fireEvent, render, screen} from "@testing-library/react";
import BookDetailModal from "@/components/BookDetailModal";
import {Book} from "@/lib/types";

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
});
