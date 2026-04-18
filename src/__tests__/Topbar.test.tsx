import {fireEvent, render, screen} from "@testing-library/react";
import Topbar from "@/src/components/Topbar";

// BarcodeScanner uses @zxing/browser — mock it so tests don't need a camera
jest.mock("@zxing/browser", () => ({
    BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
        decodeFromVideoDevice: jest.fn().mockResolvedValue({ stop: jest.fn() }),
    })),
}));

describe("Topbar component", () => {
    const defaultProps = {
        activePage: "dashboard" as const,
        onMenuToggle: jest.fn(),
        searchQuery: "",
        onSearchChange: jest.fn(),
    };

    beforeEach(() => jest.clearAllMocks());

    it("renders dashboard title", () => {
        render(<Topbar {...defaultProps} />);
        expect(screen.getByTestId("topbar-title")).toHaveTextContent("Dashboard");
    });

    it("renders books page title", () => {
        render(<Topbar {...defaultProps} activePage="books"/>);
        expect(screen.getByTestId("topbar-title")).toHaveTextContent("All Books");
    });

    it("renders lent page title", () => {
        render(<Topbar {...defaultProps} activePage="lent"/>);
        expect(screen.getByTestId("topbar-title")).toHaveTextContent("Currently Lent");
    });

    it("renders authors page title", () => {
        render(<Topbar {...defaultProps} activePage="authors"/>);
        expect(screen.getByTestId("topbar-title")).toHaveTextContent("Authors");
    });

    it("renders settings page title", () => {
        render(<Topbar {...defaultProps} activePage="settings"/>);
        expect(screen.getByTestId("topbar-title")).toHaveTextContent("Preferences");
    });

    it("renders search input", () => {
        render(<Topbar {...defaultProps} />);
        // type="search" gives the input a role of "searchbox"
        expect(screen.getByRole("searchbox", {name: /search/i})).toBeInTheDocument();
    });

    it("calls onSearchChange when typing in search box", () => {
        const onSearchChange = jest.fn();
        render(<Topbar {...defaultProps} onSearchChange={onSearchChange}/>);
        fireEvent.change(screen.getByRole("searchbox", {name: /search/i}), {
            target: {value: "Borges"},
        });
        expect(onSearchChange).toHaveBeenCalledWith("Borges");
    });

    it("shows current search query in input", () => {
        render(<Topbar {...defaultProps} searchQuery="McCarthy"/>);
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
            // Two search inputs now exist: desktop (hidden via CSS) + mobile overlay
            const inputs = screen.getAllByRole("searchbox", { name: /search/i });
            expect(inputs.length).toBe(2);
        });

        it("closes the overlay and clears the query when X is clicked", () => {
            const onSearchChange = jest.fn();
            render(<Topbar {...defaultProps} onSearchChange={onSearchChange} />);
            fireEvent.click(screen.getByRole("button", { name: /^search$/i }));
            fireEvent.click(screen.getByRole("button", { name: /close/i }));
            expect(onSearchChange).toHaveBeenCalledWith("");
            // Back to one search input
            expect(screen.getAllByRole("searchbox", { name: /search/i })).toHaveLength(1);
        });

        it("calls onSearchChange when typing in the mobile overlay input", () => {
            const onSearchChange = jest.fn();
            render(<Topbar {...defaultProps} onSearchChange={onSearchChange} />);
            fireEvent.click(screen.getByRole("button", { name: /^search$/i }));
            const inputs = screen.getAllByRole("searchbox", { name: /search/i });
            // The last one is the mobile overlay input
            fireEvent.change(inputs[inputs.length - 1], { target: { value: "Borges" } });
            expect(onSearchChange).toHaveBeenCalledWith("Borges");
        });
    });
});
