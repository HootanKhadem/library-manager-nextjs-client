import {render, screen} from "@testing-library/react";
import StarRating from "@/components/StarRating";

describe("StarRating component", () => {
    it("renders 5 filled stars for rating 5", () => {
        render(<StarRating rating={5}/>);
        expect(screen.getByLabelText("5 out of 5 stars")).toHaveTextContent("★★★★★");
    });

    it("renders 4 filled and 1 empty star for rating 4", () => {
        render(<StarRating rating={4}/>);
        expect(screen.getByLabelText("4 out of 5 stars")).toHaveTextContent("★★★★☆");
    });

    it("renders 3 filled and 2 empty stars for rating 3", () => {
        render(<StarRating rating={3}/>);
        expect(screen.getByLabelText("3 out of 5 stars")).toHaveTextContent("★★★☆☆");
    });

    it("renders 0 filled stars for rating 0", () => {
        render(<StarRating rating={0}/>);
        expect(screen.getByLabelText("0 out of 5 stars")).toHaveTextContent("☆☆☆☆☆");
    });

    it("respects custom max", () => {
        render(<StarRating rating={3} max={3}/>);
        expect(screen.getByLabelText("3 out of 3 stars")).toHaveTextContent("★★★");
    });
});
