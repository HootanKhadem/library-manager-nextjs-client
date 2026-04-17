import {fireEvent, render, screen} from "@testing-library/react";
import Sidebar from "@/src/components/Sidebar";

const defaultProps = {
    activePage: "dashboard" as const,
    onNavigate: jest.fn(),
    isOpen: false,
    onClose: jest.fn(),
    onAddBook: jest.fn(),
};

describe("Sidebar component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the Bibliotheca logo", () => {
        render(<Sidebar {...defaultProps} />);
        expect(screen.getByText("Bibliotheca")).toBeInTheDocument();
    });

    it("renders all navigation items", () => {
        render(<Sidebar {...defaultProps} />);
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("All Books")).toBeInTheDocument();
        expect(screen.getByText("Currently Lent")).toBeInTheDocument();
        const authorsNavItem = screen.getAllByText("Authors");
        expect(authorsNavItem.length).toBeGreaterThan(0);
        expect(screen.getByText("Preferences")).toBeInTheDocument();
    });

    it("marks the active page nav item", () => {
        render(<Sidebar {...defaultProps} activePage="books"/>);
        const booksBtn = screen.getByText("All Books").closest("button");
        expect(booksBtn).toHaveAttribute("aria-current", "page");
    });

    it("calls onNavigate with correct page when nav item is clicked", () => {
        const onNavigate = jest.fn();
        render(<Sidebar {...defaultProps} onNavigate={onNavigate}/>);
        fireEvent.click(screen.getByText("All Books").closest("button")!);
        expect(onNavigate).toHaveBeenCalledWith("books");
    });

    it("calls onAddBook when Add New Book button is clicked", () => {
        const onAddBook = jest.fn();
        render(<Sidebar {...defaultProps} onAddBook={onAddBook}/>);
        // Button has aria-label matching t.sidebar.addNewBook
        fireEvent.click(screen.getByLabelText(/Add New Book/i));
        expect(onAddBook).toHaveBeenCalled();
    });

    it("shows mobile overlay when isOpen is true", () => {
        const {container} = render(<Sidebar {...defaultProps} isOpen={true}/>);
        expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
    });
});
