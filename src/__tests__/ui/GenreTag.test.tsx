import { render, screen } from "@testing-library/react";
import { GenreTag } from "@/src/components/ui/GenreTag";

describe("GenreTag component", () => {
    it("renders the genre text", () => {
        render(<GenreTag genre="Fiction" />);
        expect(screen.getByText("Fiction")).toBeInTheDocument();
    });

    it("renders non-fiction genre", () => {
        render(<GenreTag genre="Non-fiction" />);
        expect(screen.getByText("Non-fiction")).toBeInTheDocument();
    });

    it("renders custom genre", () => {
        render(<GenreTag genre="Art Theory" />);
        expect(screen.getByText("Art Theory")).toBeInTheDocument();
    });

    it("applies custom className", () => {
        const { container } = render(<GenreTag genre="Poetry" className="extra-class" />);
        expect(container.firstChild).toHaveClass("extra-class");
    });
});
