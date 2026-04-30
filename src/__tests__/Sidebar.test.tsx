import {fireEvent, render, screen} from "@testing-library/react";
import Sidebar from "@/src/components/Sidebar";

jest.mock("next/navigation", () => ({
    usePathname: jest.fn(() => "/dashboard"),
    useRouter: jest.fn(() => ({push: jest.fn()})),
}));

const mockSetShowAddModal = jest.fn();
jest.mock("@/src/contexts/LibraryContext", () => ({
    useLibrary: jest.fn(() => ({setShowAddModal: mockSetShowAddModal})),
}));

import {usePathname} from "next/navigation";

const defaultProps = {isOpen: false, onClose: jest.fn()};

describe("Sidebar component", () => {
    beforeEach(() => jest.clearAllMocks());

    it("renders the Librax logo", () => {
        render(<Sidebar {...defaultProps} />);
        expect(screen.getByText("Librax")).toBeInTheDocument();
    });

    it("renders all navigation items", () => {
        render(<Sidebar {...defaultProps} />);
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("All Books")).toBeInTheDocument();
        expect(screen.getByText("Currently Lent")).toBeInTheDocument();
        expect(screen.getAllByText("Authors").length).toBeGreaterThan(0);
        expect(screen.getByText("Preferences")).toBeInTheDocument();
    });

    it("marks the active nav item based on current pathname", () => {
        (usePathname as jest.Mock).mockReturnValue("/books");
        render(<Sidebar {...defaultProps} />);
        const booksLink = screen.getByText("All Books").closest("a");
        expect(booksLink).toHaveAttribute("aria-current", "page");
    });

    it("nav items link to their correct paths", () => {
        render(<Sidebar {...defaultProps} />);
        expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute("href", "/dashboard");
        expect(screen.getByText("All Books").closest("a")).toHaveAttribute("href", "/books");
    });

    it("calls setShowAddModal when Add New Book is clicked", () => {
        render(<Sidebar {...defaultProps} />);
        fireEvent.click(screen.getByLabelText(/Add New Book/i));
        expect(mockSetShowAddModal).toHaveBeenCalledWith(true);
    });

    it("shows mobile overlay when isOpen is true", () => {
        const {container} = render(<Sidebar {...defaultProps} isOpen={true}/>);
        expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
    });
});
