import {fireEvent, render, screen} from "@testing-library/react";
import LibraryApp from "@/src/components/LibraryApp";

// Helper: click sidebar nav item by its text label
function clickNav(label: string) {
    // getByText may return multiple matches; find one that's inside a <button>
    const matches = screen.getAllByText(label);
    const btn = matches.find((el) => el.closest("button") !== null);
    if (!btn) throw new Error(`No button found with text: ${label}`);
    fireEvent.click(btn.closest("button")!);
}

describe("LibraryApp integration", () => {
    it("renders the sidebar and topbar", () => {
        render(<LibraryApp/>);
        expect(screen.getByTestId("sidebar")).toBeInTheDocument();
        expect(screen.getByTestId("topbar-title")).toBeInTheDocument();
    });

    it("shows dashboard page by default", () => {
        render(<LibraryApp/>);
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    });

    it("navigates to All Books when sidebar link is clicked", () => {
        render(<LibraryApp/>);
        clickNav("All Books");
        expect(screen.getByTestId("books-page")).toBeInTheDocument();
    });

    it("navigates to Currently Lent when sidebar link is clicked", () => {
        render(<LibraryApp/>);
        clickNav("Currently Lent");
        expect(screen.getByTestId("lent-page")).toBeInTheDocument();
    });

    it("navigates to Authors when sidebar link is clicked", () => {
        render(<LibraryApp/>);
        // 'Authors' appears in nav section label and sidebar button; target sidebar button
        const authorsButtons = screen.getAllByText("Authors");
        // The button element is the nav item
        const navBtn = authorsButtons.find((el) => el.closest("button") !== null);
        fireEvent.click(navBtn!.closest("button")!);
        expect(screen.getByTestId("authors-page")).toBeInTheDocument();
    });

    it("navigates to Settings when sidebar link is clicked", () => {
        render(<LibraryApp/>);
        clickNav("Preferences");
        expect(screen.getByTestId("settings-page")).toBeInTheDocument();
    });

    it("opens AddBookModal when Add New Book is clicked", () => {
        render(<LibraryApp/>);
        fireEvent.click(screen.getByLabelText(/Add New Book/i));
        expect(screen.getByTestId("add-book-modal")).toBeInTheDocument();
    });

    it("closes AddBookModal when Cancel is clicked", () => {
        render(<LibraryApp/>);
        fireEvent.click(screen.getByLabelText(/Add New Book/i));
        fireEvent.click(screen.getByText("Cancel").closest("button")!);
        expect(screen.queryByTestId("add-book-modal")).not.toBeInTheDocument();
    });

    it("opens BookDetailModal when a book row is clicked", () => {
        render(<LibraryApp/>);
        clickNav("All Books");
        // Click the Blood Meridian row
        fireEvent.click(screen.getByText("Blood Meridian").closest("tr")!);
        expect(screen.getByTestId("book-detail-modal")).toBeInTheDocument();
    });

    it("closes BookDetailModal when Close is clicked", () => {
        render(<LibraryApp/>);
        clickNav("All Books");
        fireEvent.click(screen.getByText("Blood Meridian").closest("tr")!);
        fireEvent.click(screen.getByText("Close").closest("button")!);
        expect(screen.queryByTestId("book-detail-modal")).not.toBeInTheDocument();
    });

    it("filters books via search query on Books page", () => {
        render(<LibraryApp/>);
        clickNav("All Books");
        // type="search" gives the input a role of "searchbox"
        fireEvent.change(screen.getByRole("searchbox", {name: /search/i}), {
            target: {value: "Borges"},
        });
        expect(screen.getByText("Ficciones")).toBeInTheDocument();
        expect(screen.queryByText("Blood Meridian")).not.toBeInTheDocument();
    });

    it("adds a new book to the list", () => {
        render(<LibraryApp/>);
        clickNav("All Books");
        fireEvent.click(screen.getByLabelText(/Add New Book/i));
        fireEvent.change(screen.getByPlaceholderText(/The Brothers Karamazov/i), {
            target: {value: "Dune"},
        });
        fireEvent.change(screen.getByPlaceholderText(/Fyodor Dostoevsky/i), {
            target: {value: "Frank Herbert"},
        });
        fireEvent.click(screen.getByText("Add to Library").closest("button")!);
        expect(screen.getByText("Dune")).toBeInTheDocument();
    });
});
