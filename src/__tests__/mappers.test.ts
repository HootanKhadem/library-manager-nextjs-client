import {
    bookToFormData,
    extractYear,
    mapBackendAuthorToAuthor,
    mapBackendBookToBook,
    mapBackendStatusToBookStatus,
} from "@/src/lib/mappers";
import { BackendAuthor, BackendBook, BackendGenre, Book } from "@/src/lib/types";

describe("mapBackendStatusToBookStatus", () => {
    it.each([
        ["OWNED", "Owned"],
        ["LENT_OUT", "Lent Out"],
        ["WISHLIST", "Wishlist"],
        ["READ", "Read"],
    ])("maps %s to %s", (backend, frontend) => {
        expect(mapBackendStatusToBookStatus(backend)).toBe(frontend);
    });

    it("falls back to 'Owned' for an unknown status", () => {
        expect(mapBackendStatusToBookStatus("SOME_NEW_STATUS")).toBe("Owned");
    });

    it("falls back to 'Owned' for undefined", () => {
        expect(mapBackendStatusToBookStatus(undefined)).toBe("Owned");
    });
});

describe("extractYear", () => {
    it("extracts a 4-digit year from an ISO date string", () => {
        expect(extractYear("1965-06-01")).toBe(1965);
    });

    it("extracts a 4-digit year from a bare year string", () => {
        expect(extractYear("1965")).toBe(1965);
    });

    it("falls back to the current year for garbage input", () => {
        expect(extractYear("not a date")).toBe(new Date().getFullYear());
    });

    it("falls back to the current year for undefined", () => {
        expect(extractYear(undefined)).toBe(new Date().getFullYear());
    });
});

describe("mapBackendBookToBook", () => {
    const genreMap = new Map<number, string>([[1, "Fiction"], [2, "Mystery"]]);

    const backendBook: BackendBook = {
        id: 42,
        name: "Dune",
        author: { id: 7, name: "Frank Herbert" },
        pages: 412,
        isbn: "978-0-441-01359-3",
        publishedDate: "1965-06-01",
        publisher: "Chilton",
        quantity: 3,
        genreId: 1,
        rating: 5,
        status: "OWNED",
    };

    it("maps all known fields", () => {
        const book = mapBackendBookToBook(backendBook, genreMap);
        expect(book).toEqual<Book>({
            id: "42",
            title: "Dune",
            author: "Frank Herbert",
            year: 1965,
            genre: "Fiction",
            status: "Owned",
            publisher: "Chilton",
            isbn: "978-0-441-01359-3",
            pages: 412,
            rating: 5,
            quantity: 3,
        });
    });

    it("falls back to 'Other' when genreId has no match in the map", () => {
        const book = mapBackendBookToBook({ ...backendBook, genreId: 999 }, genreMap);
        expect(book.genre).toBe("Other");
    });

    it("falls back to 'Other' when genreId is undefined", () => {
        const book = mapBackendBookToBook({ ...backendBook, genreId: undefined }, genreMap);
        expect(book.genre).toBe("Other");
    });
});

describe("mapBackendAuthorToAuthor", () => {
    it("derives initials from a two-word name", () => {
        const backendAuthor: BackendAuthor = { id: 1, name: "Jorge Luis Borges", image: "" };
        const author = mapBackendAuthorToAuthor(backendAuthor, 5);
        expect(author).toEqual({
            id: "1",
            initials: "JB",
            name: "Jorge Luis Borges",
            bookCount: 5,
            genre: "",
        });
    });

    it("derives initials from a single-word name", () => {
        const backendAuthor: BackendAuthor = { id: 2, name: "Homer", image: "" };
        const author = mapBackendAuthorToAuthor(backendAuthor, 0);
        expect(author.initials).toBe("HO");
    });
});

describe("bookToFormData", () => {
    const genres: BackendGenre[] = [{ id: 1, name: "Fiction" }, { id: 2, name: "Mystery" }];

    it("maps a Book back into NewBookFormData, resolving the genre id by name", () => {
        const book: Book = {
            id: "42", title: "Dune", author: "Frank Herbert", year: 1965,
            genre: "Fiction", status: "Owned", publisher: "Chilton", isbn: "123",
            pages: 412, rating: 5, quantity: 3,
        };
        expect(bookToFormData(book, genres)).toEqual({
            title: "Dune",
            author: "Frank Herbert",
            year: "1965",
            genre: "1",
            status: "Owned",
            publisher: "Chilton",
            isbn: "123",
            pages: "412",
            quantity: "3",
            rating: "5",
            description: "",
            notes: "",
        });
    });

    it("leaves genre blank when the book's genre name has no match", () => {
        const book: Book = {
            id: "42", title: "Dune", author: "Frank Herbert", year: 1965,
            genre: "Other", status: "Owned",
        };
        expect(bookToFormData(book, genres).genre).toBe("");
    });

    it("defaults quantity to '1' when the book has no quantity", () => {
        const book: Book = {
            id: "42", title: "Dune", author: "Frank Herbert", year: 1965,
            genre: "Fiction", status: "Owned",
        };
        expect(bookToFormData(book, genres).quantity).toBe("1");
    });
});
