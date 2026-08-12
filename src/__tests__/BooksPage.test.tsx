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

describe("BooksPage — empty and error states", () => {
    beforeEach(() => jest.clearAllMocks());

    it("shows 'Your library is empty' when books array is empty and filter is All", () => {
        render(<BooksPage books={[]} onBookClick={jest.fn()} onAddBook={jest.fn()} />);
        expect(screen.getByText("Your library is empty")).toBeInTheDocument();
    });

    it("shows 'No books match this filter' when filtered result is empty", () => {
        const books = [
            {
                id: "1", title: "Dune", author: "Herbert", year: 1965,
                genre: "Sci-Fi", status: "Owned" as const,
            },
        ];
        render(<BooksPage books={books} onBookClick={jest.fn()} onAddBook={jest.fn()} />);
        fireEvent.click(screen.getByText(/lent out/i));
        expect(screen.getByText("No books match this filter")).toBeInTheDocument();
    });

    it("shows error state when isError is true", () => {
        render(
            <BooksPage
                books={[]}
                onBookClick={jest.fn()}
                onAddBook={jest.fn()}
                isError
                onRetry={jest.fn()}
            />
        );
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("calls onRetry when retry button clicked in error state", () => {
        const onRetry = jest.fn();
        render(
            <BooksPage
                books={[]}
                onBookClick={jest.fn()}
                onAddBook={jest.fn()}
                isError
                onRetry={onRetry}
            />
        );
        fireEvent.click(screen.getByRole("button", { name: /try again/i }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});

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
