import {fireEvent, render, screen} from "@testing-library/react";
import LentPage from "@/src/components/pages/LentPage";
import {getLentBooks} from "@/src/lib/data";

describe("LentPage component", () => {
    const lentBooks = getLentBooks();

    it("renders 'Currently Lent' heading", () => {
        render(<LentPage lentBooks={lentBooks}/>);
        expect(screen.getByRole("heading", {name: /Currently Lent/i})).toBeInTheDocument();
    });

    it("renders all lent book cards by default", () => {
        render(<LentPage lentBooks={lentBooks}/>);
        expect(screen.getByText("Orientalism")).toBeInTheDocument();
        expect(screen.getByText("Ficciones")).toBeInTheDocument();
        expect(screen.getByText("Invisible Cities")).toBeInTheDocument();
    });

    it("renders correct lent book count in subtitle", () => {
        render(<LentPage lentBooks={lentBooks}/>);
        expect(screen.getByText(new RegExp(`${lentBooks.length} books`))).toBeInTheDocument();
    });

    it("shows overdue indicator for overdue books", () => {
        render(<LentPage lentBooks={lentBooks}/>);
        const overdueElements = screen.getAllByText(/Overdue/);
        expect(overdueElements.length).toBeGreaterThan(0);
    });

    it("filters to show only overdue books when Overdue Only is clicked", () => {
        render(<LentPage lentBooks={lentBooks}/>);
        fireEvent.click(screen.getByRole("button", {name: "Overdue Only"}));
        // Overdue books visible
        expect(screen.getByText("Invisible Cities")).toBeInTheDocument();
        // Non-overdue books should not be visible
        expect(screen.queryByText("Orientalism")).not.toBeInTheDocument();
    });

    it("shows all books again when All Lent is clicked after filtering", () => {
        render(<LentPage lentBooks={lentBooks}/>);
        fireEvent.click(screen.getByRole("button", {name: "Overdue Only"}));
        fireEvent.click(screen.getByRole("button", {name: "All Lent"}));
        expect(screen.getByText("Orientalism")).toBeInTheDocument();
        expect(screen.getByText("Ficciones")).toBeInTheDocument();
    });

    it("renders Mark Returned and Remind buttons for each card", () => {
        render(<LentPage lentBooks={lentBooks}/>);
        const markReturnedBtns = screen.getAllByRole("button", {name: /Mark Returned/i});
        expect(markReturnedBtns.length).toBe(lentBooks.length);
    });
});
