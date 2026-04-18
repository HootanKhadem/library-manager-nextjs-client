import { fireEvent, render, screen } from "@testing-library/react";
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from "@/src/components/ui/Modal";

describe("Modal component", () => {
    const onClose = jest.fn();
    beforeEach(() => jest.clearAllMocks());

    it("renders nothing when open=false", () => {
        const { container } = render(<Modal open={false} onClose={onClose}><p>Content</p></Modal>);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders children when open=true", () => {
        render(<Modal open onClose={onClose}><p>Modal content</p></Modal>);
        expect(screen.getByText("Modal content")).toBeInTheDocument();
    });

    it("has dialog role and aria-modal", () => {
        render(<Modal open onClose={onClose}><p>Content</p></Modal>);
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("calls onClose when backdrop is clicked", () => {
        const { container } = render(<Modal open onClose={onClose}><p>Content</p></Modal>);
        // The backdrop is the fixed overlay div (first child of dialog wrapper)
        const backdrop = container.querySelector("[aria-hidden='true']");
        expect(backdrop).toBeInTheDocument();
        fireEvent.click(backdrop!);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when Escape is pressed", () => {
        render(<Modal open onClose={onClose}><p>Content</p></Modal>);
        fireEvent.keyDown(document, { key: "Escape" });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("forwards data-testid to the container div", () => {
        render(<Modal open onClose={onClose} data-testid="my-modal"><p>Content</p></Modal>);
        expect(screen.getByTestId("my-modal")).toBeInTheDocument();
    });
});

describe("ModalCloseButton", () => {
    it("renders with default aria-label Close", () => {
        render(<ModalCloseButton onClose={jest.fn()} />);
        expect(screen.getByLabelText("Close")).toBeInTheDocument();
    });

    it("calls onClose when clicked", () => {
        const onClose = jest.fn();
        render(<ModalCloseButton onClose={onClose} />);
        fireEvent.click(screen.getByLabelText("Close"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

describe("Modal sub-components", () => {
    it("ModalHeader renders children", () => {
        render(<ModalHeader><span>Header</span></ModalHeader>);
        expect(screen.getByText("Header")).toBeInTheDocument();
    });

    it("ModalBody renders children", () => {
        render(<ModalBody><span>Body</span></ModalBody>);
        expect(screen.getByText("Body")).toBeInTheDocument();
    });

    it("ModalFooter renders children", () => {
        render(<ModalFooter><span>Footer</span></ModalFooter>);
        expect(screen.getByText("Footer")).toBeInTheDocument();
    });
});
