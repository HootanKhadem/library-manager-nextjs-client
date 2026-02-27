/**
 * Bibliotheca — API Usage Examples
 *
 * This file demonstrates how to consume the library data both synchronously
 * and asynchronously. Since this is a client-side-only app the data lives
 * in `lib/data.ts`. The patterns below show how to integrate the data
 * layer into components, server actions, and external API calls.
 *
 * Run examples with ts-node:
 *   npx ts-node --project tsconfig.json examples/api-examples.ts
 */

import {AUTHORS, BOOKS, getBookById, getLentBooks, getOverdueBooks,} from "../lib/data";
import {Book, BookStatus} from "../lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — SYNCHRONOUS EXAMPLES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Example 1a: Get all books synchronously
 */
export function getAllBooksSync(): Book[] {
    return BOOKS;
}

/**
 * Example 1b: Get a single book by ID synchronously
 */
export function getBookByIdSync(id: string): Book | undefined {
    return getBookById(id);
}

/**
 * Example 1c: Filter books by status synchronously
 */
export function filterBooksByStatus(status: BookStatus): Book[] {
    return BOOKS.filter((book) => book.status === status);
}

/**
 * Example 1d: Search books synchronously by title or author
 */
export function searchBooks(query: string): Book[] {
    const q = query.toLowerCase();
    return BOOKS.filter(
        (book) =>
            book.title.toLowerCase().includes(q) ||
            book.author.toLowerCase().includes(q)
    );
}

/**
 * Example 1e: Get summary statistics synchronously
 */
export function getLibraryStats() {
    const lent = getLentBooks();
    const overdue = getOverdueBooks();
    return {
        totalBooks: BOOKS.length,
        totalAuthors: AUTHORS.length,
        lentCount: lent.length,
        overdueCount: overdue.length,
        ownedCount: BOOKS.filter((b) => b.status === "Owned").length,
        wishlistCount: BOOKS.filter((b) => b.status === "Wishlist").length,
    };
}

/**
 * Example 1f: Get books by a specific author synchronously
 */
export function getBooksByAuthor(authorName: string): Book[] {
    return BOOKS.filter((book) =>
        book.author.toLowerCase() === authorName.toLowerCase()
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — ASYNCHRONOUS EXAMPLES
// These patterns simulate fetching from an external REST API or server action.
// Swap the implementation to call a real backend without changing consumers.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Example 2a: Get all books asynchronously (simulated API call)
 * Usage in a React Server Component or useEffect:
 *   const books = await fetchAllBooks();
 */
export async function fetchAllBooks(): Promise<Book[]> {
    // In a real app, replace with:
    //   const res = await fetch("https://your-api.com/books");
    //   return res.json();
    return new Promise((resolve) =>
        setTimeout(() => resolve(BOOKS), 100)
    );
}

/**
 * Example 2b: Get a single book by ID asynchronously
 * Usage:
 *   const book = await fetchBookById("blood-meridian");
 */
export async function fetchBookById(id: string): Promise<Book | null> {
    // In a real app: const res = await fetch(`/api/books/${id}`);
    return new Promise((resolve) =>
        setTimeout(() => {
            const book = getBookById(id);
            resolve(book ?? null);
        }, 100)
    );
}

/**
 * Example 2c: Fetch lent books asynchronously
 */
export async function fetchLentBooks(): Promise<Book[]> {
    return new Promise((resolve) =>
        setTimeout(() => resolve(getLentBooks()), 100)
    );
}

/**
 * Example 2d: Add a new book asynchronously (POST simulation)
 * Usage:
 *   const result = await addBook({ title: "Dune", author: "Frank Herbert", ... });
 */
export async function addBook(
    data: Omit<Book, "id">
): Promise<{ success: boolean; book: Book }> {
    return new Promise((resolve) =>
        setTimeout(() => {
            const newBook: Book = {
                ...data,
                id: `book-${Date.now()}`,
            };
            resolve({success: true, book: newBook});
        }, 200)
    );
}

/**
 * Example 2e: Mark a book as returned asynchronously (PATCH simulation)
 * Usage:
 *   const result = await markBookReturned("ficciones");
 */
export async function markBookReturned(
    bookId: string
): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) =>
        setTimeout(() => {
            const book = getBookById(bookId);
            if (!book) {
                reject(new Error(`Book with id "${bookId}" not found`));
                return;
            }
            if (book.status !== "Lent Out") {
                reject(new Error(`Book "${book.title}" is not currently lent out`));
                return;
            }
            resolve({success: true, message: `"${book.title}" marked as returned.`});
        }, 150)
    );
}

/**
 * Example 2f: Parallel fetch with Promise.all
 * Fetch stats and lent books concurrently.
 */
export async function fetchDashboardData() {
    const [allBooks, lentBooks] = await Promise.all([
        fetchAllBooks(),
        fetchLentBooks(),
    ]);
    return {
        totalBooks: allBooks.length,
        lentBooks,
        overdueBooks: lentBooks.filter((b) => b.overdue),
    };
}

/**
 * Example 2g: Async generator — stream books one at a time
 * Useful for large datasets or progressive UI loading.
 */
export async function* streamBooks(): AsyncGenerator<Book> {
    for (const book of BOOKS) {
        await new Promise((r) => setTimeout(r, 50)); // simulate streaming delay
        yield book;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — USAGE DEMONSTRATION
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    console.log("=== SYNCHRONOUS EXAMPLES ===\n");

    const stats = getLibraryStats();
    console.log("Library stats:", stats);

    const borgesBooks = getBooksByAuthor("Jorge Luis Borges");
    console.log(`\nBorges has ${borgesBooks.length} books:`, borgesBooks.map((b) => b.title));

    const searchResults = searchBooks("invisible");
    console.log("\nSearch 'invisible':", searchResults.map((b) => b.title));

    const ownedBooks = filterBooksByStatus("Owned");
    console.log(`\nOwned books (${ownedBooks.length}):`, ownedBooks.map((b) => b.title));

    console.log("\n=== ASYNCHRONOUS EXAMPLES ===\n");

    const allBooks = await fetchAllBooks();
    console.log(`Fetched ${allBooks.length} books asynchronously`);

    const singleBook = await fetchBookById("blood-meridian");
    console.log("Fetched book:", singleBook?.title);

    try {
        const returnResult = await markBookReturned("ficciones");
        console.log("Mark returned:", returnResult.message);
    } catch (err) {
        console.error("Error:", (err as Error).message);
    }

    const dashboard = await fetchDashboardData();
    console.log(`\nDashboard: ${dashboard.totalBooks} total, ${dashboard.lentBooks.length} lent, ${dashboard.overdueBooks.length} overdue`);

    console.log("\nStreaming books:");
    let count = 0;
    for await (const book of streamBooks()) {
        if (count++ < 3) {
            console.log(` - ${book.title} by ${book.author}`);
        } else {
            console.log(" ... (stream continues)");
            break;
        }
    }

    console.log("\nDone.");
}

// Uncomment to run:
// main().catch(console.error);

export default main;
