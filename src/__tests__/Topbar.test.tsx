import {fireEvent, render, screen} from "@testing-library/react";
import Topbar from "@/src/components/Topbar";

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
        expect(screen.getByTestId("topbar-title")).toHaveTextContent("Overview");
    });

    it("renders books page title", () => {
        render(<Topbar {...defaultProps} activePage="books"/>);
        expect(screen.getByTestId("topbar-title")).toHaveTextContent("All Books");
        expect(screen.getByTestId("topbar-title")).toHaveTextContent("Your Complete Collection");
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
        expect(screen.getByRole("textbox", {name: /search/i})).toBeInTheDocument();
    });

    it("calls onSearchChange when typing in search box", () => {
        const onSearchChange = jest.fn();
        render(<Topbar {...defaultProps} onSearchChange={onSearchChange}/>);
        fireEvent.change(screen.getByRole("textbox", {name: /search/i}), {
            target: {value: "Borges"},
        });
        expect(onSearchChange).toHaveBeenCalledWith("Borges");
    });

    it("shows current search query in input", () => {
        render(<Topbar {...defaultProps} searchQuery="McCarthy"/>);
        expect(screen.getByRole("textbox", {name: /search/i})).toHaveValue("McCarthy");
    });
});
