import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardBody, CardFooter } from "@/src/components/ui/Card";

describe("Card component", () => {
    it("renders children", () => {
        render(<Card><span>Card content</span></Card>);
        expect(screen.getByText("Card content")).toBeInTheDocument();
    });

    it("applies custom className", () => {
        const { container } = render(<Card className="custom-card">Content</Card>);
        expect(container.firstChild).toHaveClass("custom-card");
    });
});

describe("CardHeader", () => {
    it("renders children", () => {
        render(<CardHeader><span>Header</span></CardHeader>);
        expect(screen.getByText("Header")).toBeInTheDocument();
    });
});

describe("CardBody", () => {
    it("renders children", () => {
        render(<CardBody><span>Body content</span></CardBody>);
        expect(screen.getByText("Body content")).toBeInTheDocument();
    });
});

describe("CardFooter", () => {
    it("renders children", () => {
        render(<CardFooter><button>Save</button></CardFooter>);
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });
});
