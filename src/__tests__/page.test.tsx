import {render, screen} from "@testing-library/react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/src/contexts/AuthContext";
import HomePage from "@/src/app/(marketing)/page";

jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

jest.mock("@/src/contexts/AuthContext", () => ({
    useAuth: jest.fn(),
}));

const mockReplace = jest.fn();

type AuthState = {
    isAuthenticated?: boolean;
    hydrated?: boolean;
};

function setupAuth(overrides: AuthState = {}) {
    (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        hydrated: true,
        ...overrides,
    });
    (useRouter as jest.Mock).mockReturnValue({replace: mockReplace});
}

describe("Home page", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupAuth();
    });

    it("returns null while not yet hydrated", () => {
        setupAuth({hydrated: false});
        const {container} = render(<HomePage/>);
        expect(container.firstChild).toBeNull();
    });

    it("returns null and redirects to /dashboard when already authenticated", () => {
        setupAuth({isAuthenticated: true, hydrated: true});
        const {container} = render(<HomePage/>);
        expect(container.firstChild).toBeNull();
        expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });

    it("renders the marketing home when unauthenticated and hydrated", () => {
        render(<HomePage/>);
        expect(screen.getByRole("heading", {level: 1})).toHaveTextContent(/shelf glows/i);
    });

    it("links the primary CTA to /login", () => {
        render(<HomePage/>);
        const ctas = screen.getAllByRole("link", {name: /sign in to your library/i});
        expect(ctas.length).toBeGreaterThan(0);
        ctas.forEach(cta => expect(cta).toHaveAttribute("href", "/login"));
    });
});
