import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import LentPage from "@/src/components/pages/LentPage";

const MOCK_LENDINGS = [
    {
        id: 1, bookId: 5, memberId: 3, userId: 42,
        lentDate: "2026-06-01", expectedReturnDate: "2026-07-01",
        actualReturnDate: null, status: "ACTIVE" as const,
    },
    {
        id: 2, bookId: 7, memberId: 4, userId: 42,
        lentDate: "2026-04-01", expectedReturnDate: "2026-05-01",
        actualReturnDate: null, status: "OVERDUE" as const,
    },
];

function mockFetch(response: unknown, ok = true) {
    global.fetch = jest.fn().mockResolvedValue({
        ok,
        json: () => Promise.resolve(response),
    });
}

function mockFetchReject() {
    global.fetch = jest.fn().mockRejectedValue(new Error("fetch failed"));
}

describe("LentPage", () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("renders page without crashing", () => {
        mockFetch(MOCK_LENDINGS);
        render(<LentPage />);
        expect(screen.getByTestId("lent-page")).toBeInTheDocument();
    });

    it("shows skeleton cards while loading", () => {
        global.fetch = jest.fn(() => new Promise(() => {}));
        render(<LentPage />);
        expect(screen.getAllByRole("generic").some((el) => el.classList.contains("animate-pulse"))).toBe(true);
    });

    it("shows lending cards after fetch resolves", async () => {
        mockFetch(MOCK_LENDINGS);
        render(<LentPage />);
        await waitFor(() => {
            expect(screen.getByText("Book #5")).toBeInTheDocument();
        });
    });

    it("marks overdue lendings correctly", async () => {
        mockFetch(MOCK_LENDINGS);
        render(<LentPage />);
        await waitFor(() => {
            expect(screen.getByText(/overdue/i)).toBeInTheDocument();
        });
    });

    it("shows error state when fetch fails", async () => {
        mockFetchReject();
        render(<LentPage />);
        await waitFor(() => {
            expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        });
    });

    it("shows retry button on error", async () => {
        mockFetchReject();
        render(<LentPage />);
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
        });
    });

    it("re-fetches when retry button clicked", async () => {
        let calls = 0;
        global.fetch = jest.fn(() => {
            calls++;
            if (calls === 1) return Promise.reject(new Error("fail"));
            return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_LENDINGS) });
        });
        render(<LentPage />);
        await waitFor(() => screen.getByRole("button", { name: /try again/i }));
        fireEvent.click(screen.getByRole("button", { name: /try again/i }));
        await waitFor(() => {
            expect(screen.getByText("Book #5")).toBeInTheDocument();
        });
    });

    it("shows empty state when no lendings returned", async () => {
        mockFetch([]);
        render(<LentPage />);
        await waitFor(() => {
            expect(screen.getByText("No books are currently lent out.")).toBeInTheDocument();
        });
    });

    it("shows overdue-specific empty state when overdue filter active and no overdue items", async () => {
        mockFetch([MOCK_LENDINGS[0]]);
        render(<LentPage />);
        await waitFor(() => screen.getByText("Book #5"));
        fireEvent.click(screen.getByText(/overdue only/i));
        await waitFor(() => {
            expect(screen.getByText("No overdue books")).toBeInTheDocument();
        });
    });
});
