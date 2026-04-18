import { render, screen } from "@testing-library/react";
import { Badge } from "@/src/components/ui/Badge";

describe("Badge component", () => {
    it("renders children", () => {
        render(<Badge>Owned</Badge>);
        expect(screen.getByText("Owned")).toBeInTheDocument();
    });

    it("applies default variant classes", () => {
        const { container } = render(<Badge>Default</Badge>);
        expect(container.firstChild).toHaveClass("rounded-full");
    });

    it("renders with success variant", () => {
        render(<Badge variant="success">Success</Badge>);
        expect(screen.getByText("Success")).toBeInTheDocument();
    });

    it("renders with warning variant", () => {
        render(<Badge variant="warning">Warning</Badge>);
        expect(screen.getByText("Warning")).toBeInTheDocument();
    });

    it("renders with danger variant", () => {
        render(<Badge variant="danger">Danger</Badge>);
        expect(screen.getByText("Danger")).toBeInTheDocument();
    });

    it("renders with muted variant", () => {
        render(<Badge variant="muted">Muted</Badge>);
        expect(screen.getByText("Muted")).toBeInTheDocument();
    });

    it("applies custom className", () => {
        const { container } = render(<Badge className="my-custom">Label</Badge>);
        expect(container.firstChild).toHaveClass("my-custom");
    });
});
