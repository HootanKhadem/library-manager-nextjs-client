import {fireEvent, render, screen} from "@testing-library/react";
import DashboardPage from "@/src/components/pages/DashboardPage";
import {BOOKS} from "@/src/lib/data";

describe("DashboardPage component", () => {
    const onBookClick = jest.fn();
    const onViewAll = jest.fn();

    beforeEach(() => jest.clearAllMocks());

    it("renders the dashboard heading", () => {
        render(<DashboardPage books={BOOKS} onBookClick={onBookClick} onViewAll={onViewAll}/>);
        expect(screen.getByText(/Bibliophile/i)).toBeInTheDocument();
    });

    it("renders KPI cards", () => {
        render(<DashboardPage books={BOOKS} onBookClick={onBookClick} onViewAll={onViewAll}/>);
        expect(screen.getByText("Total Books")).toBeInTheDocument();
        expect(screen.getByText("Currently Lent")).toBeInTheDocument();
        expect(screen.getByText("Overdue")).toBeInTheDocument();
    });

    it("renders total books count in KPI", () => {
        render(<DashboardPage books={BOOKS} onBookClick={onBookClick} onViewAll={onViewAll}/>);
        // The KPI value should match book count
        const kpiValues = screen.getAllByText(String(BOOKS.length));
        expect(kpiValues.length).toBeGreaterThan(0);
    });

    it("renders Recently Added panel", () => {
        render(<DashboardPage books={BOOKS} onBookClick={onBookClick} onViewAll={onViewAll}/>);
        expect(screen.getByText("Recently Added")).toBeInTheDocument();
    });

    it("renders Recent Activity panel", () => {
        render(<DashboardPage books={BOOKS} onBookClick={onBookClick} onViewAll={onViewAll}/>);
        expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    });

    it("calls onViewAll when View All is clicked", () => {
        render(<DashboardPage books={BOOKS} onBookClick={onBookClick} onViewAll={onViewAll}/>);
        fireEvent.click(screen.getByRole("button", {name: /View All/i}));
        expect(onViewAll).toHaveBeenCalled();
    });

    it("calls onBookClick when a book row is clicked", () => {
        render(<DashboardPage books={BOOKS} onBookClick={onBookClick} onViewAll={onViewAll}/>);
        fireEvent.click(screen.getAllByText("Blood Meridian")[0].closest("tr")!);
        expect(onBookClick).toHaveBeenCalledWith(
            expect.objectContaining({id: "blood-meridian"})
        );
    });
});
