import { fireEvent, render, screen } from "@testing-library/react";
import Pagination from "@/src/components/ui/Pagination";

describe("Pagination component", () => {
    it("renders nothing when totalPages is 1", () => {
        const { container } = render(
            <Pagination page={1} totalPages={1} onPageChange={jest.fn()} prevLabel="Previous" nextLabel="Next" />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when totalPages is 0", () => {
        const { container } = render(
            <Pagination page={1} totalPages={0} onPageChange={jest.fn()} prevLabel="Previous" nextLabel="Next" />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("renders a button for every page when the total is small", () => {
        render(<Pagination page={1} totalPages={3} onPageChange={jest.fn()} prevLabel="Previous" nextLabel="Next" />);
        expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    });

    it("marks the current page with aria-current", () => {
        render(<Pagination page={2} totalPages={3} onPageChange={jest.fn()} prevLabel="Previous" nextLabel="Next" />);
        expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
        expect(screen.getByRole("button", { name: "1" })).not.toHaveAttribute("aria-current");
    });

    it("calls onPageChange with the clicked page number", () => {
        const onPageChange = jest.fn();
        render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} prevLabel="Previous" nextLabel="Next" />);
        fireEvent.click(screen.getByRole("button", { name: "3" }));
        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it("disables the previous button on the first page", () => {
        render(<Pagination page={1} totalPages={5} onPageChange={jest.fn()} prevLabel="Previous" nextLabel="Next" />);
        expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    });

    it("disables the next button on the last page", () => {
        render(<Pagination page={5} totalPages={5} onPageChange={jest.fn()} prevLabel="Previous" nextLabel="Next" />);
        expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });

    it("calls onPageChange with page - 1 when Previous is clicked", () => {
        const onPageChange = jest.fn();
        render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} prevLabel="Previous" nextLabel="Next" />);
        fireEvent.click(screen.getByRole("button", { name: "Previous" }));
        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("calls onPageChange with page + 1 when Next is clicked", () => {
        const onPageChange = jest.fn();
        render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} prevLabel="Previous" nextLabel="Next" />);
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it("shows an ellipsis when there is a gap between page groups", () => {
        render(<Pagination page={1} totalPages={10} onPageChange={jest.fn()} prevLabel="Previous" nextLabel="Next" />);
        expect(screen.getByText("…")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "10" })).toBeInTheDocument();
    });
});
