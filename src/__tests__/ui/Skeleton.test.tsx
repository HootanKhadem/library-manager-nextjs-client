import { render } from "@testing-library/react";
import { Skeleton } from "@/src/components/ui/Skeleton";

describe("Skeleton", () => {
    it("renders a div with animate-pulse class", () => {
        const { container } = render(<Skeleton />);
        const el = container.firstChild as HTMLElement;
        expect(el.tagName).toBe("DIV");
        expect(el).toHaveClass("animate-pulse");
    });

    it("applies extra className alongside base classes", () => {
        const { container } = render(<Skeleton className="h-4 w-32" />);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass("h-4", "w-32", "animate-pulse");
    });

    it("has aria-hidden to hide from screen readers", () => {
        const { container } = render(<Skeleton />);
        expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });
});
