import { render, screen, fireEvent } from "@testing-library/react";
import AuthorsPage from "@/src/components/pages/AuthorsPage";
import { Author } from "@/src/lib/types";

const MOCK_AUTHORS: Author[] = [
    { id: "a1", initials: "JB", name: "Jorge Borges", bookCount: 2, genre: "Fiction" },
];

describe("AuthorsPage — empty and error states", () => {
    it("shows author cards when authors present", () => {
        render(<AuthorsPage authors={MOCK_AUTHORS} />);
        expect(screen.getByText("Jorge Borges")).toBeInTheDocument();
    });

    it("shows empty state when authors array is empty", () => {
        render(<AuthorsPage authors={[]} />);
        expect(screen.getByText("No authors yet")).toBeInTheDocument();
    });

    it("links each author card to its own page", () => {
        render(<AuthorsPage authors={MOCK_AUTHORS} />);
        expect(screen.getByRole("link", { name: /Jorge Borges/ })).toHaveAttribute("href", "/authors/a1");
    });

    it("shows error state when isError is true", () => {
        render(
            <AuthorsPage
                authors={[]}
               
                isError
                onRetry={jest.fn()}
            />
        );
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("calls onRetry when retry button clicked", () => {
        const onRetry = jest.fn();
        render(
            <AuthorsPage
                authors={[]}
               
                isError
                onRetry={onRetry}
            />
        );
        fireEvent.click(screen.getByRole("button", { name: /try again/i }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});

describe("AuthorsPage — loading and pagination", () => {
    it("shows loading text when isLoading and no authors yet", () => {
        render(<AuthorsPage authors={[]} isLoading />);
        expect(screen.getByText("Loading…")).toBeInTheDocument();
    });

    it("renders pagination controls when totalPages > 1", () => {
        render(
            <AuthorsPage
                authors={MOCK_AUTHORS}
               
                page={1}
                totalPages={3}
                onPageChange={jest.fn()}
            />
        );
        expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    });
});
