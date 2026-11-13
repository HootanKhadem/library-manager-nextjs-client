import {render, screen} from "@testing-library/react";
import BottomNav from "@/src/components/BottomNav";
import {usePathname} from "next/navigation";

jest.mock("next/navigation", () => ({
    usePathname: jest.fn(() => "/dashboard"),
}));

describe("BottomNav component", () => {
    beforeEach(() => jest.clearAllMocks());

    it("renders all navigation items", () => {
        render(<BottomNav />);
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("All Books")).toBeInTheDocument();
        expect(screen.getByText("Currently Lent")).toBeInTheDocument();
        expect(screen.getByText("Authors")).toBeInTheDocument();
        expect(screen.getByText("Preferences")).toBeInTheDocument();
    });

    it("marks the active tab based on current pathname", () => {
        (usePathname as jest.Mock).mockReturnValue("/books");
        render(<BottomNav />);
        expect(screen.getByText("All Books").closest("a")).toHaveAttribute("aria-current", "page");
    });

    it("tabs link to their correct paths", () => {
        render(<BottomNav />);
        expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute("href", "/dashboard");
        expect(screen.getByText("All Books").closest("a")).toHaveAttribute("href", "/books");
    });
});
