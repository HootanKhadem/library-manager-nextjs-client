import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
        }) as unknown as typeof fetch;
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

    it("marks a lending as returned and refetches the list", async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([{ id: 9, bookId: 1, memberId: 2, lentDate: "2026-08-01", expectedReturnDate: null, actualReturnDate: null, status: "ACTIVE" }]) })
            .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 9, status: "RETURNED" }) })
            .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });

        render(<LentPage />);
        await waitFor(() => expect(screen.getByText(/mark returned/i)).toBeInTheDocument());

        await userEvent.click(screen.getByText(/mark returned/i));

        await waitFor(() => expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/lending/9/return", expect.objectContaining({ method: "PUT" })));
        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
    });
});
