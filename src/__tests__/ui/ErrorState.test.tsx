import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorState } from "@/src/components/ui/ErrorState";

describe("ErrorState", () => {
    it("renders default heading when none provided", () => {
        render(<ErrorState />);
        expect(screen.getByRole("heading")).toHaveTextContent("Something went wrong");
    });

    it("renders custom heading", () => {
        render(<ErrorState heading="Failed to load books" />);
        expect(screen.getByRole("heading")).toHaveTextContent("Failed to load books");
    });

    it("renders description when provided", () => {
        render(<ErrorState description="Network error occurred." />);
        expect(screen.getByText("Network error occurred.")).toBeInTheDocument();
    });

    it("does not render description when omitted", () => {
        const { container } = render(<ErrorState heading="Error" />);
        expect(container.querySelectorAll("p").length).toBe(0);
    });

    it("renders retry button when onRetry provided", () => {
        render(<ErrorState onRetry={() => {}} />);
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("does not render retry button when onRetry omitted", () => {
        render(<ErrorState />);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("calls onRetry when retry button clicked", () => {
        const onRetry = jest.fn();
        render(<ErrorState onRetry={onRetry} retryLabel="Retry" />);
        fireEvent.click(screen.getByRole("button"));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("uses retryLabel prop as button text", () => {
        render(<ErrorState onRetry={() => {}} retryLabel="Reload" />);
        expect(screen.getByRole("button")).toHaveTextContent("Reload");
    });

    it("applies extra className", () => {
        const { container } = render(<ErrorState className="py-10" />);
        expect(container.firstChild).toHaveClass("py-10");
    });
});
