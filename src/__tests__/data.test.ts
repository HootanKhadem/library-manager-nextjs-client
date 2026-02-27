import {AUTHORS, BOOKS, BORGES_WORKS, getBookById, getLentBooks, getOverdueBooks} from "@/src/lib/data";

describe("Data helpers", () => {
    describe("BOOKS", () => {
        it("contains at least one book", () => {
            expect(BOOKS.length).toBeGreaterThan(0);
        });

        it("all books have required fields", () => {
            BOOKS.forEach((book) => {
                expect(book.id).toBeTruthy();
                expect(book.title).toBeTruthy();
                expect(book.author).toBeTruthy();
                expect(book.year).toBeGreaterThan(0);
                expect(book.status).toBeTruthy();
            });
        });
    });

    describe("AUTHORS", () => {
        it("contains authors", () => {
            expect(AUTHORS.length).toBeGreaterThan(0);
        });

        it("all authors have initials and name", () => {
            AUTHORS.forEach((author) => {
                expect(author.initials).toBeTruthy();
                expect(author.name).toBeTruthy();
                expect(author.bookCount).toBeGreaterThan(0);
            });
        });
    });

    describe("getLentBooks", () => {
        it("returns only books with status Lent Out", () => {
            const lent = getLentBooks();
            lent.forEach((book) => {
                expect(book.status).toBe("Lent Out");
            });
        });

        it("returns at least one lent book", () => {
            expect(getLentBooks().length).toBeGreaterThan(0);
        });
    });

    describe("getOverdueBooks", () => {
        it("returns only overdue books", () => {
            const overdue = getOverdueBooks();
            overdue.forEach((book) => {
                expect(book.overdue).toBe(true);
            });
        });

        it("returns at least one overdue book", () => {
            expect(getOverdueBooks().length).toBeGreaterThan(0);
        });
    });

    describe("getBookById", () => {
        it("returns the correct book by id", () => {
            const book = getBookById("blood-meridian");
            expect(book).toBeDefined();
            expect(book?.title).toBe("Blood Meridian");
        });

        it("returns undefined for unknown id", () => {
            const book = getBookById("non-existent-id");
            expect(book).toBeUndefined();
        });
    });

    describe("BORGES_WORKS", () => {
        it("contains only Borges books", () => {
            BORGES_WORKS.forEach((book) => {
                expect(book.author).toBe("Jorge Luis Borges");
            });
        });

        it("contains 5 Borges works", () => {
            expect(BORGES_WORKS).toHaveLength(5);
        });
    });
});
