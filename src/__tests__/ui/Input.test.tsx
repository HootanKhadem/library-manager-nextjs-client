import { fireEvent, render, screen } from "@testing-library/react";
import { Input } from "@/src/components/ui/Input";

describe("Input component", () => {
    it("renders without label by default", () => {
        render(<Input placeholder="Enter text" />);
        expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("renders label and associates it with the input", () => {
        render(<Input label="Book Title" />);
        expect(screen.getByLabelText("Book Title")).toBeInTheDocument();
    });

    it("renders error message and sets aria-invalid", () => {
        render(<Input label="Title" error="Required" />);
        expect(screen.getByText("Required")).toBeInTheDocument();
        expect(screen.getByLabelText("Title")).toHaveAttribute("aria-invalid", "true");
    });

    it("renders helper text when no error", () => {
        render(<Input label="ISBN" helper="13-digit code" />);
        expect(screen.getByText("13-digit code")).toBeInTheDocument();
    });

    it("does not render helper text when error is present", () => {
        render(<Input label="Field" error="Bad input" helper="Some hint" />);
        expect(screen.queryByText("Some hint")).not.toBeInTheDocument();
        expect(screen.getByText("Bad input")).toBeInTheDocument();
    });

    it("calls onChange when value changes", () => {
        const onChange = jest.fn();
        render(<Input onChange={onChange} />);
        fireEvent.change(screen.getByRole("textbox"), { target: { value: "Dune" } });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("is disabled when disabled prop is set", () => {
        render(<Input disabled />);
        expect(screen.getByRole("textbox")).toBeDisabled();
    });
});
