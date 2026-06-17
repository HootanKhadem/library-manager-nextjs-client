import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import DashboardPage from "@/src/components/pages/DashboardPage";

const MOCK_BOOK_STATS = { totalBooks: 10, addedThisMonth: 2 };
const MOCK_LENT_STATS = { totalLentOut: 3, uniqueLendees: 2 };
const MOCK_OVERDUE_STATS = { totalOverdue: 1 };
const MOCK_RECENT_BOOKS = [
    { id: 1, name: "Dune", author: "Herbert", genre: "Sci-Fi", status: "OWNED", rating: 5 },
];
const MOCK_ACTIVITY = [
    { id: 1, action: "ADDED", bookName: "Dune", memberName: null, occurredAt: "2026-06-01T10:00:00" },
];

function mockFetch(responses: Record<string, unknown>) {
    global.fetch = jest.fn((url: string) => {
        const key = Object.keys(responses).find((k) => url.includes(k));
        if (key) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(responses[key]),
            });
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    }) as jest.Mock;
}

function allSuccessResponses() {
    mockFetch({
        "stats/books": MOCK_BOOK_STATS,
        "stats/lent-out": MOCK_LENT_STATS,
        "stats/overdue": MOCK_OVERDUE_STATS,
        "recently-added": MOCK_RECENT_BOOKS,
        "recent-activity": MOCK_ACTIVITY,
    });
}

describe("DashboardPage", () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("renders page without crashing", () => {
        allSuccessResponses();
        render(<DashboardPage onViewAll={jest.fn()} />);
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    });

    it("shows book count after stats/books resolves", async () => {
        allSuccessResponses();
        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("10")).toBeInTheDocument();
        });
    });

    it("shows lent count after stats/lent-out resolves", async () => {
        allSuccessResponses();
        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("3")).toBeInTheDocument();
        });
    });

    it("shows overdue count after stats/overdue resolves", async () => {
        allSuccessResponses();
        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("1")).toBeInTheDocument();
        });
    });

    it("shows recently added book after recently-added resolves", async () => {
        allSuccessResponses();
        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("Dune")).toBeInTheDocument();
        });
    });

    it("shows activity entry after recent-activity resolves", async () => {
        allSuccessResponses();
        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getAllByText(/Dune/).length).toBeGreaterThan(0);
        });
    });

    it("shows error state for stats/books when that fetch fails", async () => {
        global.fetch = jest.fn((url: string) => {
            if (url.includes("stats/books")) return Promise.reject(new Error("fail"));
            if (url.includes("stats/lent-out")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_LENT_STATS) });
            if (url.includes("stats/overdue")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_OVERDUE_STATS) });
            if (url.includes("recently-added")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_RECENT_BOOKS) });
            if (url.includes("recent-activity")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_ACTIVITY) });
            return Promise.reject(new Error("unexpected"));
        }) as jest.Mock;

        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getAllByText(/Failed to load/).length).toBeGreaterThan(0);
        });
        expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("shows error state for recently-added when that fetch fails", async () => {
        global.fetch = jest.fn((url: string) => {
            if (url.includes("recently-added")) return Promise.reject(new Error("fail"));
            if (url.includes("stats/books")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_BOOK_STATS) });
            if (url.includes("stats/lent-out")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_LENT_STATS) });
            if (url.includes("stats/overdue")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_OVERDUE_STATS) });
            if (url.includes("recent-activity")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_ACTIVITY) });
            return Promise.reject(new Error("unexpected"));
        }) as jest.Mock;

        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        });
        expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("shows retry button for recently-added error and re-fetches on click", async () => {
        let callCount = 0;
        global.fetch = jest.fn((url: string) => {
            if (url.includes("recently-added")) {
                callCount++;
                if (callCount === 1) return Promise.reject(new Error("fail"));
                return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_RECENT_BOOKS) });
            }
            if (url.includes("stats/books")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_BOOK_STATS) });
            if (url.includes("stats/lent-out")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_LENT_STATS) });
            if (url.includes("stats/overdue")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_OVERDUE_STATS) });
            if (url.includes("recent-activity")) return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_ACTIVITY) });
            return Promise.reject(new Error("unexpected"));
        }) as jest.Mock;

        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole("button", { name: /try again/i }));
        await waitFor(() => {
            expect(screen.getByText("Dune")).toBeInTheDocument();
        });
    });

    it("shows empty state when recently-added returns empty array", async () => {
        mockFetch({
            "stats/books": MOCK_BOOK_STATS,
            "stats/lent-out": MOCK_LENT_STATS,
            "stats/overdue": MOCK_OVERDUE_STATS,
            "recently-added": [],
            "recent-activity": MOCK_ACTIVITY,
        });
        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("No books added yet")).toBeInTheDocument();
        });
    });

    it("shows empty state when recent-activity returns empty array", async () => {
        mockFetch({
            "stats/books": MOCK_BOOK_STATS,
            "stats/lent-out": MOCK_LENT_STATS,
            "stats/overdue": MOCK_OVERDUE_STATS,
            "recently-added": MOCK_RECENT_BOOKS,
            "recent-activity": [],
        });
        render(<DashboardPage onViewAll={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText("No recent activity")).toBeInTheDocument();
        });
    });
});
