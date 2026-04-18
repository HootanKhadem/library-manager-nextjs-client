import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/src/components/ui/EmptyState";

describe("EmptyState component", () => {
    it("renders the heading", () => {
        render(<EmptyState heading="No books found" />);
        expect(screen.getByText("No books found")).toBeInTheDocument();
    });

    it("renders the description when provided", () => {
        render(<EmptyState heading="Empty" description="Add your first book" />);
        expect(screen.getByText("Add your first book")).toBeInTheDocument();
    });

    it("does not render description when not provided", () => {
        render(<EmptyState heading="Empty" />);
        // Only the heading — no extra paragraph
        expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
    });

    it("renders the icon when provided", () => {
        render(<EmptyState heading="Empty" icon={<span data-testid="test-icon" />} />);
        expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    });

    it("renders the action when provided", () => {
        render(<EmptyState heading="Empty" action={<button>Add Book</button>} />);
        expect(screen.getByRole("button", { name: "Add Book" })).toBeInTheDocument();
    });
});
