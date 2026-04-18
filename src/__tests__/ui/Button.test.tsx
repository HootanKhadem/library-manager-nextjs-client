import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "@/src/components/ui/Button";

describe("Button component", () => {
    it("renders children", () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
    });

    it("calls onClick when clicked", () => {
        const onClick = jest.fn();
        render(<Button onClick={onClick}>Click</Button>);
        fireEvent.click(screen.getByRole("button"));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("is disabled when disabled prop is set", () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole("button")).toBeDisabled();
    });

    it("is disabled and shows spinner when loading", () => {
        render(<Button loading>Loading</Button>);
        const btn = screen.getByRole("button");
        expect(btn).toBeDisabled();
        // spinner SVG should be present
        expect(btn.querySelector("svg")).toBeInTheDocument();
    });

    it("does not call onClick when disabled", () => {
        const onClick = jest.fn();
        render(<Button disabled onClick={onClick}>Disabled</Button>);
        fireEvent.click(screen.getByRole("button"));
        expect(onClick).not.toHaveBeenCalled();
    });

    it("applies primary variant classes by default", () => {
        render(<Button>Primary</Button>);
        const btn = screen.getByRole("button");
        expect(btn.className).toContain("bg-[var(--accent)]");
    });

    it("applies secondary variant classes", () => {
        render(<Button variant="secondary">Secondary</Button>);
        const btn = screen.getByRole("button");
        expect(btn.className).toContain("border");
    });

    it("applies danger variant classes", () => {
        render(<Button variant="danger">Danger</Button>);
        const btn = screen.getByRole("button");
        expect(btn.className).toContain("bg-[var(--destructive)]");
    });

    it("applies custom className", () => {
        render(<Button className="custom-class">Custom</Button>);
        expect(screen.getByRole("button").className).toContain("custom-class");
    });
});
