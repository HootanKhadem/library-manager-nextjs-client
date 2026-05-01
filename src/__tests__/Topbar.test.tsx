import {fireEvent, render, screen} from "@testing-library/react";
import Topbar from "@/src/components/Topbar";

jest.mock("@zxing/browser", () => ({
    BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
        decodeFromVideoDevice: jest.fn().mockResolvedValue({ stop: jest.fn() }),
    })),
}));

jest.mock("next/navigation", () => ({
    usePathname: jest.fn(() => "/dashboard"),
}));

const mockSetSearchQuery = jest.fn();
let mockSearchQuery = "";
jest.mock("@/src/contexts/LibraryContext", () => ({
    useLibrary: jest.fn(() => ({
        searchQuery: mockSearchQuery,
        setSearchQuery: mockSetSearchQuery,
    })),
}));

import {usePathname} from "next/navigation";

const defaultProps = {onMenuToggle: jest.fn()};

describe("Topbar component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSearchQuery = "";
    });

    it("renders dashboard title", () => {
        (usePathname as jest.Mock).mockReturnValue("/dashboard");
        render(<Topbar {...defaultProps} />);
        expect(screen.getByTestId("topbar-title")).toHaveTextContent("Dashboard");
    });

    it("renders books page title", () => {
        (usePathname as jest.Mock).mockReturnValue("/books");
        render(<Topbar {...defaultProps} />);
        expect(screen.getByTestId("topbar-title")).toHaveTextContent("All Books");
    });

    it("renders lent page title", () => {
        (usePathname as jest.Mock).mockReturnValue("/lent");
        render(<Topbar {...defaultProps} />);
        expect(screen.getByTestId("topbar-title")).toHaveTextContent("Currently Lent");
    });

    it("renders authors page title", () => {
        (usePathname as jest.Mock).mockReturnValue("/authors");
        render(<Topbar {...defaultProps} />);
        expect(screen.getByTestId("topbar-title")).toHaveTextContent("Authors");
    });

    it("renders settings page title", () => {
        (usePathname as jest.Mock).mockReturnValue("/settings");
        render(<Topbar {...defaultProps} />);
        expect(screen.getByTestId("topbar-title")).toHaveTextContent("Preferences");
    });

    it("renders search input", () => {
        render(<Topbar {...defaultProps} />);
        expect(screen.getByRole("searchbox", {name: /search/i})).toBeInTheDocument();
    });

    it("calls setSearchQuery when typing in search box", () => {
        render(<Topbar {...defaultProps} />);
        fireEvent.change(screen.getByRole("searchbox", {name: /search/i}), {
            target: {value: "Borges"},
        });
        expect(mockSetSearchQuery).toHaveBeenCalledWith("Borges");
    });

    it("shows current search query in input", () => {
        mockSearchQuery = "McCarthy";
        render(<Topbar {...defaultProps} />);
        expect(screen.getByRole("searchbox", {name: /search/i})).toHaveValue("McCarthy");
    });

    describe("mobile search overlay", () => {
        it("renders a mobile search icon button", () => {
            render(<Topbar {...defaultProps} />);
            expect(screen.getByRole("button", { name: /^search$/i })).toBeInTheDocument();
        });

        it("opens the search overlay when the mobile search icon is clicked", () => {
            render(<Topbar {...defaultProps} />);
            fireEvent.click(screen.getByRole("button", { name: /^search$/i }));
            const inputs = screen.getAllByRole("searchbox", { name: /search/i });
            expect(inputs.length).toBe(2);
        });

        it("closes the overlay and clears the query when X is clicked", () => {
            render(<Topbar {...defaultProps} />);
            fireEvent.click(screen.getByRole("button", { name: /^search$/i }));
            fireEvent.click(screen.getByRole("button", { name: /close/i }));
            expect(mockSetSearchQuery).toHaveBeenCalledWith("");
            expect(screen.getAllByRole("searchbox", { name: /search/i })).toHaveLength(1);
        });

        it("calls setSearchQuery when typing in the mobile overlay input", () => {
            render(<Topbar {...defaultProps} />);
            fireEvent.click(screen.getByRole("button", { name: /^search$/i }));
            const inputs = screen.getAllByRole("searchbox", { name: /search/i });
            fireEvent.change(inputs[inputs.length - 1], { target: { value: "Borges" } });
            expect(mockSetSearchQuery).toHaveBeenCalledWith("Borges");
        });
    });
});
