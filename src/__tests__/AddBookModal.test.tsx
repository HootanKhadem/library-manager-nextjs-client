import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import AddBookModal from "@/src/components/AddBookModal";
import { NewBookFormData } from "@/src/lib/types";

describe("AddBookModal component", () => {
    const onClose = jest.fn();
    const onAdd = jest.fn().mockResolvedValue(true);

    beforeEach(() => jest.clearAllMocks());

    it("renders the modal heading", () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd}/>);
        expect(screen.getByRole("heading", {name: "Add New Book"})).toBeInTheDocument();
    });

    it("renders required form fields", () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd}/>);
        expect(screen.getByPlaceholderText(/The Brothers Karamazov/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Fyodor Dostoevsky/i)).toBeInTheDocument();
    });

    it("calls onClose when Cancel button is clicked", () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd}/>);
        fireEvent.click(screen.getByRole("button", {name: /Cancel/i}));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when X button is clicked", () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd}/>);
        // aria-label is now t.common.close = "Close" (from the default en context)
        fireEvent.click(screen.getByLabelText("Close"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does NOT call onAdd if title is empty", () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd}/>);
        fireEvent.click(screen.getByRole("button", {name: /Add to Library/i}));
        expect(onAdd).not.toHaveBeenCalled();
    });

    it("does NOT call onAdd if author is empty", () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd}/>);
        fireEvent.change(screen.getByPlaceholderText(/The Brothers Karamazov/i), {
            target: {value: "Some Book"},
        });
        fireEvent.click(screen.getByRole("button", {name: /Add to Library/i}));
        expect(onAdd).not.toHaveBeenCalled();
    });

    it("calls onAdd with form data when both title and author are provided", async () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd}/>);
        fireEvent.change(screen.getByPlaceholderText(/The Brothers Karamazov/i), {
            target: {value: "Dune"},
        });
        fireEvent.change(screen.getByPlaceholderText(/Fyodor Dostoevsky/i), {
            target: {value: "Frank Herbert"},
        });
        fireEvent.click(screen.getByRole("button", {name: /Add to Library/i}));
        expect(onAdd).toHaveBeenCalledWith(
            expect.objectContaining({title: "Dune", author: "Frank Herbert"})
        );
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it("stays open and shows an inline error when onAdd resolves false", async () => {
        const failingOnAdd = jest.fn().mockResolvedValue(false);
        render(<AddBookModal onClose={onClose} onAdd={failingOnAdd}/>);
        fireEvent.change(screen.getByPlaceholderText(/The Brothers Karamazov/i), {
            target: {value: "Dune"},
        });
        fireEvent.change(screen.getByPlaceholderText(/Fyodor Dostoevsky/i), {
            target: {value: "Frank Herbert"},
        });
        fireEvent.click(screen.getByRole("button", {name: /Add to Library/i}));
        expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i);
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes when onAdd resolves true", async () => {
        const succeedingOnAdd = jest.fn().mockResolvedValue(true);
        render(<AddBookModal onClose={onClose} onAdd={succeedingOnAdd}/>);
        fireEvent.change(screen.getByPlaceholderText(/The Brothers Karamazov/i), {
            target: {value: "Dune"},
        });
        fireEvent.change(screen.getByPlaceholderText(/Fyodor Dostoevsky/i), {
            target: {value: "Frank Herbert"},
        });
        fireEvent.click(screen.getByRole("button", {name: /Add to Library/i}));
        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });

    it("closes on Escape key press", () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd}/>);
        fireEvent.keyDown(document, {key: "Escape"});
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("has dialog role and aria-modal", () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd}/>);
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("renders a quantity field defaulting to 1", () => {
        render(<AddBookModal onClose={jest.fn()} onAdd={jest.fn()} />);
        expect(screen.getByLabelText(/quantity/i)).toHaveValue(1);
    });
});

describe("AddBookModal edit mode", () => {
    const onClose = jest.fn();
    const onAdd = jest.fn().mockResolvedValue(true);
    const genres = [{ id: 1, name: "Fiction" }, { id: 2, name: "Mystery" }];
    const initialData: NewBookFormData = {
        title: "Dune", author: "Frank Herbert", year: "1965", genre: "1", status: "Owned",
        publisher: "Chilton", isbn: "123", pages: "412", quantity: "3", rating: "5", description: "", notes: "",
    };

    beforeEach(() => jest.clearAllMocks());

    it("renders the edit heading and Save Changes button", () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd} mode="edit" initialData={initialData} genres={genres} />);
        expect(screen.getByRole("heading", { name: "Edit Book" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    });

    it("pre-fills form fields from initialData", () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd} mode="edit" initialData={initialData} genres={genres} />);
        expect(screen.getByPlaceholderText(/The Brothers Karamazov/i)).toHaveValue("Dune");
        expect(screen.getByPlaceholderText(/Fyodor Dostoevsky/i)).toHaveValue("Frank Herbert");
        expect(screen.getByLabelText(/quantity/i)).toHaveValue(3);
    });

    it("renders genre options from the genres prop", () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd} mode="edit" initialData={initialData} genres={genres} />);
        expect(screen.getByRole("option", { name: "Fiction" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Mystery" })).toBeInTheDocument();
    });

    it("calls onAdd with edited form data on save", async () => {
        render(<AddBookModal onClose={onClose} onAdd={onAdd} mode="edit" initialData={initialData} genres={genres} />);
        fireEvent.change(screen.getByPlaceholderText(/The Brothers Karamazov/i), { target: { value: "Dune Messiah" } });
        fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
        expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ title: "Dune Messiah", author: "Frank Herbert" }));
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });
});
