import { render, screen } from "@testing-library/react";
import { StarRating } from "@/src/components/ui/StarRating";

describe("StarRating component", () => {
    it("renders with correct aria-label for value 5", () => {
        render(<StarRating value={5} />);
        expect(screen.getByLabelText("5 out of 5 stars")).toBeInTheDocument();
    });

    it("renders with correct aria-label for value 3", () => {
        render(<StarRating value={3} />);
        expect(screen.getByLabelText("3 out of 5 stars")).toBeInTheDocument();
    });

    it("renders with correct aria-label for value 0", () => {
        render(<StarRating value={0} />);
        expect(screen.getByLabelText("0 out of 5 stars")).toBeInTheDocument();
    });

    it("respects custom max", () => {
        render(<StarRating value={3} max={3} />);
        expect(screen.getByLabelText("3 out of 3 stars")).toBeInTheDocument();
    });

    it("renders correct number of star icons", () => {
        const { container } = render(<StarRating value={4} />);
        // 5 svg elements (one per star)
        const stars = container.querySelectorAll("svg");
        expect(stars).toHaveLength(5);
    });
});
