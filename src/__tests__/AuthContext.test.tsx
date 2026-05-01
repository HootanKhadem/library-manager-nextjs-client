import {act, fireEvent, render, screen} from "@testing-library/react";
import {AuthProvider, useAuth} from "@/src/contexts/AuthContext";

const STORAGE_KEY = "librax_session";

function Consumer() {
    const {isAuthenticated, hydrated, login, logout} = useAuth();

    async function doLogin(email: string, password: string, remember: boolean) {
        await login(email, password, remember);
    }

    return (
        <div>
            <span data-testid="auth">{isAuthenticated ? "yes" : "no"}</span>
            <span data-testid="hydrated">{hydrated ? "yes" : "no"}</span>
            <button onClick={() => doLogin("a@b.com", "pass", true)}>login-remember</button>
            <button onClick={() => doLogin("a@b.com", "pass", false)}>login-session</button>
            <button onClick={() => doLogin("", "pass", false)}>login-empty-email</button>
            <button onClick={() => doLogin("a@b.com", "", false)}>login-empty-pw</button>
            <button onClick={logout}>logout</button>
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
        // Default: login succeeds, logout succeeds
        global.fetch = jest.fn().mockResolvedValue({ok: true});
    });

    afterEach(() => {
        jest.resetAllMocks();
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

    it("sets isAuthenticated to true after a successful login", async () => {
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("login-remember"));
        });
        expect(screen.getByTestId("auth")).toHaveTextContent("yes");
    });

    it("calls POST /api/auth/login with the correct payload", async () => {
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("login-remember"));
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({email: 'a@b.com', password: 'pass', remember: true}),
        }));
    });

    it("stores the session in localStorage when remember=true", async () => {
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("login-remember"));
        });
        expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
    });

    it("does not write to sessionStorage when remember=true", async () => {
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("login-remember"));
        });
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("stores the session in sessionStorage when remember=false", async () => {
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("login-session"));
        });
        expect(sessionStorage.getItem(STORAGE_KEY)).toBe("true");
    });

    it("does not write to localStorage when remember=false", async () => {
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("login-session"));
        });
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("returns false and does not authenticate when the API returns non-OK", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ok: false});
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("login-session"));
        });
        expect(screen.getByTestId("auth")).toHaveTextContent("no");
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    // ── logout() ─────────────────────────────────────────────────────────────

    it("sets isAuthenticated to false after logout", async () => {
        localStorage.setItem(STORAGE_KEY, "true");
        renderProvider();
        expect(screen.getByTestId("auth")).toHaveTextContent("yes");

        await act(async () => {
            fireEvent.click(screen.getByText("logout"));
        });
        expect(screen.getByTestId("auth")).toHaveTextContent("no");
    });

    it("calls POST /api/auth/logout", async () => {
        localStorage.setItem(STORAGE_KEY, "true");
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("logout"));
        });
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {method: 'POST'});
    });

    it("removes the key from localStorage on logout", async () => {
        localStorage.setItem(STORAGE_KEY, "true");
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("logout"));
        });
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("removes the key from sessionStorage on logout", async () => {
        sessionStorage.setItem(STORAGE_KEY, "true");
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("logout"));
        });
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("clears both storages on logout even when both were set", async () => {
        localStorage.setItem(STORAGE_KEY, "true");
        sessionStorage.setItem(STORAGE_KEY, "true");
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("logout"));
        });
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("still logs out and clears storage even when the logout API call fails", async () => {
        localStorage.setItem(STORAGE_KEY, "true");
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network error"));
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("logout"));
        });
        expect(screen.getByTestId("auth")).toHaveTextContent("no");
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    // ── useAuth outside provider ──────────────────────────────────────────────

    it("throws when useAuth is used outside of AuthProvider", () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {
        });
        expect(() => render(<Consumer/>)).toThrow("useAuth must be used within AuthProvider");
        spy.mockRestore();
    });
});
