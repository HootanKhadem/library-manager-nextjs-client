import {fireEvent, render, screen} from "@testing-library/react";
import {AuthProvider, useAuth} from "@/src/contexts/AuthContext";

const STORAGE_KEY = "librax_session";

// Minimal consumer component for driving the context
function Consumer() {
    const {isAuthenticated, hydrated, login, logout} = useAuth();
    return (
        <div>
            <span data-testid="auth">{isAuthenticated ? "yes" : "no"}</span>
            <span data-testid="hydrated">{hydrated ? "yes" : "no"}</span>
            <button onClick={() => login("a@b.com", "pass", true)}>login-remember</button>
            <button onClick={() => login("a@b.com", "pass", false)}>login-session</button>
            <button onClick={() => login("", "pass", false)}>login-empty-email</button>
            <button onClick={() => login("a@b.com", "", false)}>login-empty-pw</button>
            <button onClick={() => logout()}>logout</button>
        </div>
    );
}

function renderProvider() {
    return render(
        <AuthProvider>
            <Consumer/>
        </AuthProvider>
    );
}

describe("AuthContext", () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    // ── Initial hydration ────────────────────────────────────────────────────

    it("is unauthenticated when no session is stored", () => {
        renderProvider();
        expect(screen.getByTestId("auth")).toHaveTextContent("no");
    });

    it("is hydrated after mount", () => {
        renderProvider();
        expect(screen.getByTestId("hydrated")).toHaveTextContent("yes");
    });

    it("reads a persisted session from localStorage on mount", () => {
        localStorage.setItem(STORAGE_KEY, "true");
        renderProvider();
        expect(screen.getByTestId("auth")).toHaveTextContent("yes");
    });

    it("reads a persisted session from sessionStorage on mount", () => {
        sessionStorage.setItem(STORAGE_KEY, "true");
        renderProvider();
        expect(screen.getByTestId("auth")).toHaveTextContent("yes");
    });

    it("stays unauthenticated when the stored value is not 'true'", () => {
        localStorage.setItem(STORAGE_KEY, "false");
        renderProvider();
        expect(screen.getByTestId("auth")).toHaveTextContent("no");
    });

    // ── login() ──────────────────────────────────────────────────────────────

    it("sets isAuthenticated to true after a successful login", () => {
        renderProvider();
        fireEvent.click(screen.getByText("login-remember"));
        expect(screen.getByTestId("auth")).toHaveTextContent("yes");
    });

    it("stores the session in localStorage when remember=true", () => {
        renderProvider();
        fireEvent.click(screen.getByText("login-remember"));
        expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
    });

    it("does not write to sessionStorage when remember=true", () => {
        renderProvider();
        fireEvent.click(screen.getByText("login-remember"));
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("stores the session in sessionStorage when remember=false", () => {
        renderProvider();
        fireEvent.click(screen.getByText("login-session"));
        expect(sessionStorage.getItem(STORAGE_KEY)).toBe("true");
    });

    it("does not write to localStorage when remember=false", () => {
        renderProvider();
        fireEvent.click(screen.getByText("login-session"));
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("returns false and does not authenticate when email is empty", () => {
        renderProvider();
        fireEvent.click(screen.getByText("login-empty-email"));
        expect(screen.getByTestId("auth")).toHaveTextContent("no");
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("returns false and does not authenticate when password is empty", () => {
        renderProvider();
        fireEvent.click(screen.getByText("login-empty-pw"));
        expect(screen.getByTestId("auth")).toHaveTextContent("no");
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    // ── logout() ─────────────────────────────────────────────────────────────

    it("sets isAuthenticated to false after logout", () => {
        localStorage.setItem(STORAGE_KEY, "true");
        renderProvider();
        expect(screen.getByTestId("auth")).toHaveTextContent("yes");

        fireEvent.click(screen.getByText("logout"));
        expect(screen.getByTestId("auth")).toHaveTextContent("no");
    });

    it("removes the key from localStorage on logout", () => {
        localStorage.setItem(STORAGE_KEY, "true");
        renderProvider();
        fireEvent.click(screen.getByText("logout"));
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("removes the key from sessionStorage on logout", () => {
        sessionStorage.setItem(STORAGE_KEY, "true");
        renderProvider();
        fireEvent.click(screen.getByText("logout"));
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("clears both storages on logout even when both were set", () => {
        localStorage.setItem(STORAGE_KEY, "true");
        sessionStorage.setItem(STORAGE_KEY, "true");
        renderProvider();
        fireEvent.click(screen.getByText("logout"));
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    // ── useAuth outside provider ──────────────────────────────────────────────

    it("throws when useAuth is used outside of AuthProvider", () => {
        // Suppress the expected React error boundary output
        const spy = jest.spyOn(console, "error").mockImplementation(() => {
        });
        expect(() => render(<Consumer/>)).toThrow("useAuth must be used within AuthProvider");
        spy.mockRestore();
    });
});
