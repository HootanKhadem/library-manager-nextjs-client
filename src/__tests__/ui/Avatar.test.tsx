import { render, screen } from "@testing-library/react";
import { Avatar } from "@/src/components/ui/Avatar";

describe("Avatar component", () => {
    it("renders initials for a two-word name", () => {
        render(<Avatar name="Jorge Borges" />);
        expect(screen.getByText("JB")).toBeInTheDocument();
    });

    it("renders first two characters for a single-word name", () => {
        render(<Avatar name="Borges" />);
        expect(screen.getByText("BO")).toBeInTheDocument();
    });

    it("renders initials in uppercase", () => {
        render(<Avatar name="frank herbert" />);
        expect(screen.getByText("FH")).toBeInTheDocument();
    });

    it("uses first and last word for 3+ word names", () => {
        render(<Avatar name="Gabriel Garcia Marquez" />);
        expect(screen.getByText("GM")).toBeInTheDocument();
    });

    it("is aria-hidden", () => {
        render(<Avatar name="Test User" />);
        expect(screen.getByText("TU")).toHaveAttribute("aria-hidden", "true");
    });
});
