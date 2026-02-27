import {render, screen} from "@testing-library/react";
import Badge from "@/src/components/Badge";

describe("Badge component", () => {
    it("renders 'Owned' status", () => {
        render(<Badge status="Owned"/>);
        expect(screen.getByText("Owned")).toBeInTheDocument();
    });

    it("renders 'Lent Out' status", () => {
        render(<Badge status="Lent Out"/>);
        expect(screen.getByText("Lent Out")).toBeInTheDocument();
    });

    it("renders 'Wishlist' status", () => {
        render(<Badge status="Wishlist"/>);
        expect(screen.getByText("Wishlist")).toBeInTheDocument();
    });

    it("renders 'Read' status", () => {
        render(<Badge status="Read"/>);
        expect(screen.getByText("Read")).toBeInTheDocument();
    });
});
