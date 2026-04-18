import {fireEvent, render, screen} from "@testing-library/react";
import BooksPage from "@/src/components/pages/BooksPage";
import {BOOKS} from "@/src/lib/data";

const onBookClick = jest.fn();
const onAddBook = jest.fn();

describe("BooksPage component", () => {
    beforeEach(() => jest.clearAllMocks());

    it("renders 'All Books' heading", () => {
        render(<BooksPage books={BOOKS} onBookClick={onBookClick} onAddBook={onAddBook}/>);
        expect(screen.getByRole("heading", {name: "All Books"})).toBeInTheDocument();
    });

    it("renders all books by default", () => {
        render(<BooksPage books={BOOKS} onBookClick={onBookClick} onAddBook={onAddBook}/>);
        expect(screen.getByText("Blood Meridian")).toBeInTheDocument();
        expect(screen.getByText("Ficciones")).toBeInTheDocument();
    });

    it("filters to show only Owned books", () => {
        render(<BooksPage books={BOOKS} onBookClick={onBookClick} onAddBook={onAddBook}/>);
        fireEvent.click(screen.getByRole("button", {name: "Owned"}));
        // Owned books are visible
        expect(screen.getByText("Blood Meridian")).toBeInTheDocument();
        // Lent Out books should not appear
        expect(screen.queryByText("Ficciones")).not.toBeInTheDocument();
    });

    it("filters to show only Lent Out books", () => {
        render(<BooksPage books={BOOKS} onBookClick={onBookClick} onAddBook={onAddBook}/>);
        fireEvent.click(screen.getByRole("button", {name: "Lent Out"}));
        expect(screen.getByText("Ficciones")).toBeInTheDocument();
        expect(screen.queryByText("Blood Meridian")).not.toBeInTheDocument();
    });

    it("calls onBookClick when a book row is clicked", () => {
        render(<BooksPage books={BOOKS} onBookClick={onBookClick} onAddBook={onAddBook}/>);
        fireEvent.click(screen.getByText("Blood Meridian").closest("tr")!);
        expect(onBookClick).toHaveBeenCalledWith(
            expect.objectContaining({id: "blood-meridian"})
        );
    });

    it("calls onAddBook when Add button is clicked", () => {
        render(<BooksPage books={BOOKS} onBookClick={onBookClick} onAddBook={onAddBook}/>);
        // Button renders t.common.add = "Add" with a Plus icon (aria-hidden)
        fireEvent.click(screen.getByRole("button", {name: /^Add$/i}));
        expect(onAddBook).toHaveBeenCalled();
    });

    it("shows total book count in subtitle", () => {
        render(<BooksPage books={BOOKS} onBookClick={onBookClick} onAddBook={onAddBook}/>);
        expect(screen.getByText(new RegExp(`${BOOKS.length} volumes`))).toBeInTheDocument();
    });
});
