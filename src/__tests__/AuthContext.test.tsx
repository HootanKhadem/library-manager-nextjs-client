import {act, fireEvent, render, screen} from "@testing-library/react";
import {AuthProvider, useAuth} from "@/src/contexts/AuthContext";

const STORAGE_KEY = "librax_session";
const EMAIL_KEY = "librax_email";
const NAME_KEY = "librax_name";

function Consumer() {
    const {isAuthenticated, hydrated, user, login, signup, logout} = useAuth();

    async function doLogin(email: string, password: string, remember: boolean) {
        await login(email, password, remember);
    }

    async function doSignup(name: string, email: string, password: string) {
        const result = await signup(name, email, password);
        if (!result.ok) {
            const el = document.getElementById("signup-error");
            if (el) el.textContent = result.message;
        }
    }

    return (
        <div>
            <span data-testid="auth">{isAuthenticated ? "yes" : "no"}</span>
            <span data-testid="hydrated">{hydrated ? "yes" : "no"}</span>
            <span data-testid="user-email">{user?.email ?? ""}</span>
            <span data-testid="user-name">{user?.name ?? ""}</span>
            <span id="signup-error" data-testid="signup-error"></span>
            <button onClick={() => doLogin("a@b.com", "pass", true)}>login-remember</button>
            <button onClick={() => doLogin("a@b.com", "pass", false)}>login-session</button>
            <button onClick={() => doLogin("", "pass", false)}>login-empty-email</button>
            <button onClick={() => doLogin("a@b.com", "", false)}>login-empty-pw</button>
            <button onClick={() => doSignup("Ada Lovelace", "ada@example.com", "Passw0rd")}>signup-ok</button>
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
        // Default: login/signup succeed, logout succeeds
        global.fetch = jest.fn().mockResolvedValue({ok: true, json: () => Promise.resolve({})});
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

    it("hydrates the user's email from storage when a session is persisted", () => {
        localStorage.setItem(STORAGE_KEY, "true");
        localStorage.setItem(EMAIL_KEY, "stored@example.com");
        renderProvider();
        expect(screen.getByTestId("user-email")).toHaveTextContent("stored@example.com");
    });

    it("has no user when no session is persisted, even if email keys exist", () => {
        localStorage.setItem(EMAIL_KEY, "stale@example.com");
        renderProvider();
        expect(screen.getByTestId("user-email")).toHaveTextContent("");
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

    it("stores the email in localStorage when remember=true", async () => {
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("login-remember"));
        });
        expect(localStorage.getItem(EMAIL_KEY)).toBe("a@b.com");
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

    // ── signup() ─────────────────────────────────────────────────────────────

    it("calls POST /api/auth/signup with the correct payload", async () => {
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("signup-ok"));
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({name: 'Ada Lovelace', email: 'ada@example.com', password: 'Passw0rd'}),
        }));
    });

    it("sets isAuthenticated to true after a successful signup", async () => {
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("signup-ok"));
        });
        expect(screen.getByTestId("auth")).toHaveTextContent("yes");
    });

    it("stores name and email in localStorage after a successful signup", async () => {
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("signup-ok"));
        });
        expect(localStorage.getItem(EMAIL_KEY)).toBe("ada@example.com");
        expect(localStorage.getItem(NAME_KEY)).toBe("Ada Lovelace");
    });

    it("exposes the new user's name and email via the user object", async () => {
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("signup-ok"));
        });
        expect(screen.getByTestId("user-name")).toHaveTextContent("Ada Lovelace");
        expect(screen.getByTestId("user-email")).toHaveTextContent("ada@example.com");
    });

    it("returns the backend's error message and does not authenticate on failure", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({message: 'Email already registered.'}),
        });
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("signup-ok"));
        });
        expect(screen.getByTestId("auth")).toHaveTextContent("no");
        expect(screen.getByTestId("signup-error")).toHaveTextContent("Email already registered.");
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

    it("clears the stored email and name on logout", async () => {
        localStorage.setItem(STORAGE_KEY, "true");
        localStorage.setItem(EMAIL_KEY, "a@b.com");
        localStorage.setItem(NAME_KEY, "A B");
        renderProvider();
        await act(async () => {
            fireEvent.click(screen.getByText("logout"));
        });
        expect(localStorage.getItem(EMAIL_KEY)).toBeNull();
        expect(localStorage.getItem(NAME_KEY)).toBeNull();
    });

    it("clears the user object on logout", async () => {
        localStorage.setItem(STORAGE_KEY, "true");
        localStorage.setItem(EMAIL_KEY, "a@b.com");
        renderProvider();
        expect(screen.getByTestId("user-email")).toHaveTextContent("a@b.com");
        await act(async () => {
            fireEvent.click(screen.getByText("logout"));
        });
        expect(screen.getByTestId("user-email")).toHaveTextContent("");
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
