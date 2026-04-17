import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/src/components/ui/StatusBadge";

describe("StatusBadge component", () => {
    it("renders Owned status", () => {
        render(<StatusBadge status="Owned" />);
        expect(screen.getByText("Owned")).toBeInTheDocument();
    });

    it("renders Lent Out status", () => {
        render(<StatusBadge status="Lent Out" />);
        expect(screen.getByText("Lent Out")).toBeInTheDocument();
    });

    it("renders Wishlist status", () => {
        render(<StatusBadge status="Wishlist" />);
        expect(screen.getByText("Wishlist")).toBeInTheDocument();
    });

    it("renders Read status", () => {
        render(<StatusBadge status="Read" />);
        expect(screen.getByText("Read")).toBeInTheDocument();
    });

    it("renders Overdue when overdue=true regardless of status", () => {
        render(<StatusBadge status="Lent Out" overdue />);
        expect(screen.getByText("Overdue")).toBeInTheDocument();
    });

    it("does not render Overdue when overdue is false", () => {
        render(<StatusBadge status="Owned" overdue={false} />);
        expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
        expect(screen.getByText("Owned")).toBeInTheDocument();
    });
});
