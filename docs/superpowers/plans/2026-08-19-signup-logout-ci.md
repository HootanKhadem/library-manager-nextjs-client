# Signup page, logout entry point, and CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/signup` page wired to the new `POST /auth/signup` backend endpoint, give the already-implemented `/auth/logout` flow a UI home (Topbar avatar dropdown), and stand up a GitHub Actions CI workflow that gates on lint/typecheck/test/build with a deploy-job placeholder.

**Architecture:** Follows the existing auth pattern exactly: a client component page → `AuthContext` method → a Next.js Route Handler under `src/app/api/auth/*` that proxies to `${API_BASE_URL}` and sets the two httpOnly cookies. No new libraries; reuses `lucide-react` (already a dependency) for icons and the existing `Avatar` UI component.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 + CSS Modules, Jest + React Testing Library, GitHub Actions.

## Global Constraints

- Node version: 20 (matches `Dockerfile`'s `node:20-alpine` — use `actions/setup-node@v4` with `node-version: 20` in CI).
- No new npm dependencies — `lucide-react` already ships `LogOut` and other needed icons; nothing else new is required.
- Test stack is Jest + `@testing-library/react`; module alias `^@/(.*)$` → repo root (see `jest.config.ts`). Always import via `@/src/...`, matching every existing test file.
- `/login` and (new) `/signup` pages are **deliberately unlocalized** (hardcoded English, no `useLanguage()`) — an existing, intentional convention. Do not add i18n to them.
- Every other UI surface (Topbar, Sidebar, etc.) *is* localized — any new string there needs a key added to **all three** of `src/lib/i18n/types.ts`, `src/lib/i18n/translations/en.ts`, and `src/lib/i18n/translations/fa.ts` in the same step, or the build fails (TypeScript enforces the `Translations` interface).
- TDD throughout: write the failing test, confirm it fails, then implement.
- Commit after each task with the existing repo's plain conventional-ish style (see `git log`, e.g. `feat(auth): ...`).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/contexts/AuthContext.tsx` (modify) | Add `signup()`, `user` state, email/name persistence |
| `src/app/api/auth/signup/route.ts` (create) | Proxy `POST /auth/signup` to backend, set cookies |
| `src/app/signup/page.tsx` (create) | Signup form UI |
| `src/app/signup/signup.module.css` (create) | Copy of `login.module.css` (same animation/decoration classes) |
| `src/app/login/page.tsx` (modify) | Wire dead "Create one" button to `/signup` |
| `src/app/(marketing)/_components/MarketingHeader.tsx` (modify) | Add secondary "Sign up" link next to "Sign in" |
| `src/components/Topbar.tsx` (modify) | Add avatar + account dropdown with "Log out" |
| `src/lib/i18n/types.ts`, `translations/en.ts`, `translations/fa.ts` (modify) | Add `topbar.logout` / `topbar.account` keys |
| `package.json` (modify) | Add `typecheck` script |
| `.github/workflows/ci.yml` (create) | CI pipeline |

Test files: `src/__tests__/AuthContext.test.tsx` (modify), `src/__tests__/api/auth/signup.route.test.ts` (create), `src/__tests__/signup.test.tsx` (create), `src/__tests__/login.test.tsx` (modify), `src/__tests__/MarketingHeader.test.tsx` (create), `src/__tests__/Topbar.test.tsx` (modify), `src/__tests__/AppShell.test.tsx` (modify).

---

## Task 1: AuthContext — `signup()` + `user` state

**Files:**
- Modify: `src/contexts/AuthContext.tsx`
- Test: `src/__tests__/AuthContext.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `useAuth()` now returns `{isAuthenticated, hydrated, user: {name?: string; email: string} | null, login, signup, logout}`. `signup(name: string, email: string, password: string): Promise<{ok: true} | {ok: false; message: string}>`. `login`/`logout` signatures unchanged.

- [ ] **Step 1: Write the failing tests**

Replace `src/__tests__/AuthContext.test.tsx` in full with:

```tsx
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
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npm test -- AuthContext.test.tsx`
Expected: FAIL — `signup` is not a function on the context value (new tests fail; the pre-existing login/logout tests still pass).

- [ ] **Step 3: Implement `signup()` and `user` state**

Replace `src/contexts/AuthContext.tsx` in full with:

```tsx
'use client';

import {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react';

interface AuthUser {
    email: string;
    name?: string;
}

interface AuthContextValue {
    isAuthenticated: boolean;
    hydrated: boolean;
    user: AuthUser | null;
    login: (email: string, password: string, remember: boolean) => Promise<boolean>;
    signup: (name: string, email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'librax_session';
const EMAIL_KEY = 'librax_email';
const NAME_KEY = 'librax_name';

function clearStoredSession() {
    for (const store of [localStorage, sessionStorage]) {
        store.removeItem(STORAGE_KEY);
        store.removeItem(EMAIL_KEY);
        store.removeItem(NAME_KEY);
    }
}

function persistSession(remember: boolean, email: string, name?: string) {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(STORAGE_KEY, 'true');
    store.setItem(EMAIL_KEY, email);
    if (name) store.setItem(NAME_KEY, name);
}

export function AuthProvider({children}: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        // The httpOnly cookies holding the real tokens can't be read here.
        // This localStorage/sessionStorage flag is a UI-side hint that tells
        // the client whether the user has an active session, so we can skip
        // the login screen without an extra server round-trip on every load.
        const persisted =
            localStorage.getItem(STORAGE_KEY) === 'true' ||
            sessionStorage.getItem(STORAGE_KEY) === 'true';
        setIsAuthenticated(persisted);

        if (persisted) {
            const email = localStorage.getItem(EMAIL_KEY) ?? sessionStorage.getItem(EMAIL_KEY);
            if (email) {
                const name = localStorage.getItem(NAME_KEY) ?? sessionStorage.getItem(NAME_KEY);
                setUser({email, name: name ?? undefined});
            }
        }

        setHydrated(true);
    }, []);

    useEffect(() => {
        // When a fetch call returns 401 anywhere in the app, fire this event
        // and we'll clear the stale session flag and mark the user as logged out.
        function handleUnauthorized() {
            clearStoredSession();
            setIsAuthenticated(false);
            setUser(null);
        }

        window.addEventListener('librax:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('librax:unauthorized', handleUnauthorized);
    }, []);

    const login = useCallback(async (email: string, password: string, remember: boolean): Promise<boolean> => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password, remember}),
        });

        if (!res.ok) return false;

        // Tokens are now in httpOnly cookies set by the route handler.
        // Store a plain UI flag (plus the email the user typed) so we know
        // on the next page load that the user is still logged in without
        // hitting the server again.
        persistSession(remember, email);
        setUser({email});
        setIsAuthenticated(true);
        return true;
    }, []);

    const signup = useCallback(async (
        name: string,
        email: string,
        password: string,
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, email, password}),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return {ok: false, message: data.message ?? 'Unable to create account. Please try again.'};
        }

        // A fresh signup implies "keep me signed in" — there's no remember-me
        // checkbox on this form, so always persist to localStorage.
        persistSession(true, email, name);
        setUser({email, name});
        setIsAuthenticated(true);
        return {ok: true};
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        await fetch('/api/auth/logout', {method: 'POST'}).catch(() => {
        });
        clearStoredSession();
        setIsAuthenticated(false);
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({isAuthenticated, hydrated, user, login, signup, logout}),
        [isAuthenticated, hydrated, user, login, signup, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- AuthContext.test.tsx`
Expected: PASS (all tests, including the pre-existing login/logout ones).

- [ ] **Step 5: Commit**

```bash
git add src/contexts/AuthContext.tsx src/__tests__/AuthContext.test.tsx
git commit -m "feat(auth): add signup() and persisted user info to AuthContext"
```

---

## Task 2: Signup API route

**Files:**
- Create: `src/app/api/auth/signup/route.ts`
- Test: `src/__tests__/api/auth/signup.route.test.ts`

**Interfaces:**
- Consumes: `process.env.API_BASE_URL` (already used by `login/route.ts`).
- Produces: `POST` handler at `/api/auth/signup`. Request body `{name, email, password}`. On success sets `access_token`/`refresh_token` httpOnly cookies and returns `201 {ok: true}`. On backend 4xx, forwards `{message}` and status. On network failure, `503 {message}`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/auth/signup.route.test.ts`:

```ts
/** @jest-environment node */
import {NextRequest} from 'next/server';
import {POST} from '@/src/app/api/auth/signup/route';

const MOCK_TOKENS = {access_token: 'access-abc', refresh_token: 'refresh-xyz'};

function makeRequest(body: object): NextRequest {
    return new NextRequest('http://localhost/api/auth/signup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    });
}

describe('POST /api/auth/signup', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    // ── Success path ──────────────────────────────────────────────────────────

    it('returns 201 with { ok: true } when the API creates the account', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(MOCK_TOKENS),
        });

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        expect(res.status).toBe(201);
        expect(await res.json()).toEqual({ok: true});
    });

    it('forwards name, email, and password to the external API', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(MOCK_TOKENS),
        });

        await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain('/auth/signup');
        const body = JSON.parse(options.body as string);
        expect(body).toEqual({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'});
    });

    it('sets access_token as an httpOnly cookie on success', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(MOCK_TOKENS),
        });

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        expect(res.cookies.get('access_token')?.value).toBe('access-abc');
    });

    it('sets refresh_token as an httpOnly cookie on success', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(MOCK_TOKENS),
        });

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        expect(res.cookies.get('refresh_token')?.value).toBe('refresh-xyz');
    });

    // ── Validation ───────────────────────────────────────────────────────────

    it('returns 400 when name is missing', async () => {
        const res = await POST(makeRequest({email: 'ada@example.com', password: 'Passw0rd'}));
        expect(res.status).toBe(400);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns 400 when email is missing', async () => {
        const res = await POST(makeRequest({name: 'Ada', password: 'Passw0rd'}));
        expect(res.status).toBe(400);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns 400 when password is missing', async () => {
        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com'}));
        expect(res.status).toBe(400);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    // ── Backend failure ──────────────────────────────────────────────────────

    it('returns 400 and the backend message on a weak password', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: () => Promise.resolve({message: 'Password too weak.'}),
        });

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'weak'}));

        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({message: 'Password too weak.'});
    });

    it('returns 409 and the backend message when the email is already registered', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 409,
            json: () => Promise.resolve({message: 'Email already registered.'}),
        });

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        expect(res.status).toBe(409);
        expect(await res.json()).toEqual({message: 'Email already registered.'});
    });

    it('does not set any auth cookies on failure', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 409,
            json: () => Promise.resolve({message: 'Email already registered.'}),
        });

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        expect(res.cookies.get('access_token')).toBeUndefined();
        expect(res.cookies.get('refresh_token')).toBeUndefined();
    });

    // ── Network failure ───────────────────────────────────────────────────────

    it('returns 503 when the external API is unreachable', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('fetch failed'));

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.message).toMatch(/unable to reach/i);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- signup.route.test.ts`
Expected: FAIL — cannot find module `@/src/app/api/auth/signup/route` (file doesn't exist yet).

- [ ] **Step 3: Implement the route**

Create `src/app/api/auth/signup/route.ts`:

```ts
import {NextRequest, NextResponse} from 'next/server';

function cookieBase(req: NextRequest) {
    // Use HTTPS as the signal, not NODE_ENV. This works correctly in staging
    // environments served over HTTPS with NODE_ENV !== 'production'.
    const isHttps = req.url.startsWith('https://');
    return {
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax' as const,
        path: '/',
    };
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);

    if (
        !body ||
        typeof body.name !== 'string' || !body.name.trim() ||
        typeof body.email !== 'string' || !body.email.trim() ||
        typeof body.password !== 'string' || !body.password.trim()
    ) {
        return NextResponse.json({message: 'Name, email, and password are required.'}, {status: 400});
    }

    const {name, email, password} = body;

    let apiRes: Response;
    try {
        apiRes = await fetch(`${process.env.API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, email, password}),
        });
    } catch {
        return NextResponse.json(
            {message: 'Unable to reach the authentication server. Please try again.'},
            {status: 503}
        );
    }

    if (!apiRes.ok) {
        const data = await apiRes.json().catch(() => ({}));
        return NextResponse.json(
            {message: data.message ?? 'Unable to create account.'},
            {status: apiRes.status}
        );
    }

    const {access_token, refresh_token} = await apiRes.json();

    const base = cookieBase(req);
    const response = NextResponse.json({ok: true}, {status: 201});

    response.cookies.set('access_token', access_token, base);
    response.cookies.set('refresh_token', refresh_token, base);

    return response;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- signup.route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/signup/route.ts src/__tests__/api/auth/signup.route.test.ts
git commit -m "feat(api): add POST /api/auth/signup proxy route"
```

---

## Task 3: Signup page UI

**Files:**
- Create: `src/app/signup/page.tsx`
- Create: `src/app/signup/signup.module.css`
- Test: `src/__tests__/signup.test.tsx`

**Interfaces:**
- Consumes: `useAuth()` from Task 1 (`signup`, `isAuthenticated`, `hydrated`), `useRouter()` from `next/navigation`.
- Produces: default export `SignupPage` at `@/src/app/signup/page`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/signup.test.tsx`:

```tsx
import {act, fireEvent, render, screen} from "@testing-library/react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/src/contexts/AuthContext";
import SignupPage from "@/src/app/signup/page";

jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

jest.mock("@/src/contexts/AuthContext", () => ({
    useAuth: jest.fn(),
}));

const mockReplace = jest.fn();
const mockPush = jest.fn();

type AuthState = {
    isAuthenticated?: boolean;
    hydrated?: boolean;
    signup?: jest.Mock;
};

function setupAuth(overrides: AuthState = {}) {
    (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        hydrated: true,
        signup: jest.fn().mockResolvedValue({ok: true}),
        ...overrides,
    });
    (useRouter as jest.Mock).mockReturnValue({replace: mockReplace, push: mockPush});
}

async function fillValidForm() {
    fireEvent.change(screen.getByLabelText(/^name$/i), {target: {value: "Ada Lovelace"}});
    fireEvent.change(screen.getByLabelText(/email address/i), {target: {value: "ada@example.com"}});
    fireEvent.change(screen.getByLabelText(/^password$/i), {target: {value: "Passw0rd"}});
    fireEvent.change(screen.getByLabelText(/confirm password/i), {target: {value: "Passw0rd"}});
}

async function submitForm() {
    await fillValidForm();
    await act(async () => {
        fireEvent.click(screen.getByRole("button", {name: /create account/i}));
    });
}

describe("SignupPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupAuth();
    });

    // ── Rendering ────────────────────────────────────────────────────────────

    it("returns null while not yet hydrated", () => {
        setupAuth({hydrated: false});
        const {container} = render(<SignupPage/>);
        expect(container.firstChild).toBeNull();
    });

    it("returns null and redirects to /dashboard when already authenticated", () => {
        setupAuth({isAuthenticated: true, hydrated: true});
        const {container} = render(<SignupPage/>);
        expect(container.firstChild).toBeNull();
        expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });

    it("renders the page when unauthenticated and hydrated", () => {
        render(<SignupPage/>);
        expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("renders the form header", () => {
        render(<SignupPage/>);
        expect(screen.getByRole("heading", {name: /create.*account/i})).toBeInTheDocument();
    });

    it("renders name, email, password, and confirm password fields", () => {
        render(<SignupPage/>);
        expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it("does not render a Google OAuth button", () => {
        render(<SignupPage/>);
        expect(screen.queryByRole("button", {name: /continue with google/i})).not.toBeInTheDocument();
    });

    it("renders the sign-in footer link back to /login", () => {
        render(<SignupPage/>);
        expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: /^sign in$/i})).toBeInTheDocument();
    });

    it("navigates to /login when the footer sign-in button is clicked", () => {
        render(<SignupPage/>);
        fireEvent.click(screen.getByRole("button", {name: /^sign in$/i}));
        expect(mockPush).toHaveBeenCalledWith("/login");
    });

    // ── Password requirements checklist ─────────────────────────────────────

    it("shows all three password requirements as unmet initially", () => {
        render(<SignupPage/>);
        expect(screen.getByTestId("pw-req-length")).toHaveAttribute("data-met", "false");
        expect(screen.getByTestId("pw-req-uppercase")).toHaveAttribute("data-met", "false");
        expect(screen.getByTestId("pw-req-digit")).toHaveAttribute("data-met", "false");
    });

    it("marks requirements as met as the password satisfies them", () => {
        render(<SignupPage/>);
        fireEvent.change(screen.getByLabelText(/^password$/i), {target: {value: "Passw0rd"}});
        expect(screen.getByTestId("pw-req-length")).toHaveAttribute("data-met", "true");
        expect(screen.getByTestId("pw-req-uppercase")).toHaveAttribute("data-met", "true");
        expect(screen.getByTestId("pw-req-digit")).toHaveAttribute("data-met", "true");
    });

    it("marks the digit requirement as unmet when the password has no digit", () => {
        render(<SignupPage/>);
        fireEvent.change(screen.getByLabelText(/^password$/i), {target: {value: "Password"}});
        expect(screen.getByTestId("pw-req-digit")).toHaveAttribute("data-met", "false");
    });

    // ── Validation ───────────────────────────────────────────────────────────

    it("shows an error when submitted with fields empty", () => {
        render(<SignupPage/>);
        fireEvent.click(screen.getByRole("button", {name: /create account/i}));
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
    });

    it("shows an error when the password does not meet the requirements", () => {
        render(<SignupPage/>);
        fireEvent.change(screen.getByLabelText(/^name$/i), {target: {value: "Ada"}});
        fireEvent.change(screen.getByLabelText(/email address/i), {target: {value: "ada@example.com"}});
        fireEvent.change(screen.getByLabelText(/^password$/i), {target: {value: "weak"}});
        fireEvent.change(screen.getByLabelText(/confirm password/i), {target: {value: "weak"}});
        fireEvent.click(screen.getByRole("button", {name: /create account/i}));
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });

    it("shows an error when the passwords do not match", () => {
        render(<SignupPage/>);
        fireEvent.change(screen.getByLabelText(/^name$/i), {target: {value: "Ada"}});
        fireEvent.change(screen.getByLabelText(/email address/i), {target: {value: "ada@example.com"}});
        fireEvent.change(screen.getByLabelText(/^password$/i), {target: {value: "Passw0rd"}});
        fireEvent.change(screen.getByLabelText(/confirm password/i), {target: {value: "Different1"}});
        fireEvent.click(screen.getByRole("button", {name: /create account/i}));
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it("does not call signup() when validation fails", () => {
        const mockSignup = jest.fn();
        setupAuth({signup: mockSignup});
        render(<SignupPage/>);
        fireEvent.click(screen.getByRole("button", {name: /create account/i}));
        expect(mockSignup).not.toHaveBeenCalled();
    });

    // ── Loading state ────────────────────────────────────────────────────────

    it("shows 'Creating account…' and disables the button while the request is in flight", async () => {
        setupAuth({
            signup: jest.fn().mockReturnValue(new Promise(() => {
            }))
        });
        render(<SignupPage/>);
        await fillValidForm();
        fireEvent.click(screen.getByRole("button", {name: /create account/i}));

        const btn = await screen.findByRole("button", {name: /creating account/i});
        expect(btn).toBeDisabled();
    });

    // ── Successful signup ────────────────────────────────────────────────────

    it("calls signup() with name, email, and password", async () => {
        const mockSignup = jest.fn().mockResolvedValue({ok: true});
        setupAuth({signup: mockSignup});
        render(<SignupPage/>);
        await submitForm();
        expect(mockSignup).toHaveBeenCalledWith("Ada Lovelace", "ada@example.com", "Passw0rd");
    });

    it("redirects to /dashboard after a successful signup", async () => {
        render(<SignupPage/>);
        await submitForm();
        expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });

    // ── Failed signup ─────────────────────────────────────────────────────────

    it("shows the backend's error message and re-enables the button on failure", async () => {
        setupAuth({signup: jest.fn().mockResolvedValue({ok: false, message: "Email already registered."})});
        render(<SignupPage/>);
        await submitForm();
        expect(screen.getByText("Email already registered.")).toBeInTheDocument();
        expect(screen.getByRole("button", {name: /create account/i})).not.toBeDisabled();
    });

    it("shows a generic error when signup() throws", async () => {
        setupAuth({signup: jest.fn().mockRejectedValue(new Error("network error"))});
        render(<SignupPage/>);
        await submitForm();
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- signup.test.tsx`
Expected: FAIL — cannot find module `@/src/app/signup/page`.

- [ ] **Step 3: Create the CSS module**

Create `src/app/signup/signup.module.css` — identical content to `src/app/login/login.module.css`:

```css
/* Card entrance */
.card {
    animation: fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* Left-panel decorative blobs */
.panelLeft {
    position: relative;
    overflow: hidden;
}

.panelLeft::before {
    content: '';
    position: absolute;
    top: -70px;
    right: -70px;
    width: 240px;
    height: 240px;
    border-radius: 50%;
    background: rgba(225, 29, 72, 0.08);
    pointer-events: none;
}

.panelLeft::after {
    content: '';
    position: absolute;
    bottom: 30px;
    left: -50px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: rgba(225, 29, 72, 0.05);
    pointer-events: none;
}

/* Input focus ring (can't express the exact glow with Tailwind 4 ring alone) */
.input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.12);
}

.input:hover {
    border-color: #a8a29e; /* stone-400 */
}

.inputWrap:focus-within .inputIcon {
    color: var(--accent);
}

/* Staggered entrance animations */
.a1 {
    animation: fadeUp 0.45s 0.05s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.a2 {
    animation: fadeUp 0.45s 0.10s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.a3 {
    animation: fadeUp 0.45s 0.15s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.a4 {
    animation: fadeUp 0.45s 0.12s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.a5 {
    animation: fadeUp 0.45s 0.16s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.a6 {
    animation: fadeUp 0.45s 0.20s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.a7 {
    animation: fadeUp 0.45s 0.24s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.a8 {
    animation: fadeUp 0.45s 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.a9 {
    animation: fadeUp 0.45s 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.a10 {
    animation: fadeUp 0.45s 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.a11 {
    animation: fadeUp 0.45s 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
}
```

- [ ] **Step 4: Implement the page**

Create `src/app/signup/page.tsx`:

```tsx
'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/src/contexts/AuthContext';
import styles from './signup.module.css';

const FEATURES = [
    {strong: 'Books', rest: 'tracked across your full collection'},
    {strong: 'Loans', rest: 'managed with due date reminders'},
    {strong: 'Authors', rest: 'catalogued with full details'},
];

function hasMinLength(pw: string) {
    return pw.length >= 8;
}

function hasUppercase(pw: string) {
    return /[A-Z]/.test(pw);
}

function hasDigit(pw: string) {
    return /\d/.test(pw);
}

export default function SignupPage() {
    const {isAuthenticated, hydrated, signup} = useAuth();
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (hydrated && isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [hydrated, isAuthenticated, router]);

    if (!hydrated || isAuthenticated) return null;

    const passwordRequirements = [
        {key: 'length', label: 'At least 8 characters', met: hasMinLength(password)},
        {key: 'uppercase', label: 'One uppercase letter', met: hasUppercase(password)},
        {key: 'digit', label: 'One number', met: hasDigit(password)},
    ];

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        if (!hasMinLength(password) || !hasUppercase(password) || !hasDigit(password)) {
            setError('Password must be at least 8 characters and include an uppercase letter and a number.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await signup(name, email, password);
            if (result.ok) {
                router.replace('/dashboard');
            } else {
                setError(result.message);
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#f5f4f0] px-4 py-6">
            <div
                className={[
                    'flex w-full max-w-215 min-h-135 rounded-xl overflow-hidden',
                    'shadow-[0_4px_24px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.06)]',
                    'max-[640px]:flex-col max-[640px]:max-w-105 max-[640px]:min-h-0',
                    styles.card,
                ].join(' ')}
            >
                {/* ── Left panel ───────────────────────────────── */}
                <aside
                    className={[
                        'w-[42%] shrink-0 bg-stone-900 px-9 py-10 flex flex-col justify-between',
                        'max-[640px]:w-full max-[640px]:px-6 max-[640px]:py-7',
                        styles.panelLeft,
                    ].join(' ')}
                >
                    <div className={`flex items-center gap-2.5 relative z-10 ${styles.a1}`}>
                        <div className="w-9 h-9 bg-rose-600 rounded-lg flex items-center justify-center shrink-0"
                             aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                 stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                            </svg>
                        </div>
                        <span className="text-[15px] font-semibold text-stone-50 tracking-[-0.2px]">bookwrym</span>
                    </div>

                    <div className={`relative z-10 ${styles.a2}`}>
                        <p className="text-[26px] font-semibold text-stone-50 leading-[1.3] tracking-[-0.6px] mb-3.5 max-[640px]:text-xl">
                            Your personal<br/>
                            <em className="not-italic text-rose-500">reading universe,</em><br/>
                            organized.
                        </p>
                        <p className="text-[13px] text-stone-400 leading-relaxed">
                            Track books, manage loans, and discover patterns in your reading life — all in one place.
                        </p>
                    </div>

                    <ul
                        className={`flex flex-col gap-2.5 relative z-10 max-[640px]:hidden ${styles.a3}`}
                        aria-label="Features"
                    >
                        {FEATURES.map(({strong, rest}) => (
                            <li key={strong} className="flex items-center gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" aria-hidden="true"/>
                                <span className="text-xs text-stone-500 leading-snug">
                                    <strong className="text-stone-300 font-medium">{strong}</strong> {rest}
                                </span>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* ── Right panel ──────────────────────────────── */}
                <section
                    className="flex-1 bg-stone-50 flex flex-col justify-center px-11 py-12 max-[640px]:px-6 max-[640px]:py-8 overflow-y-auto">

                    <div className={`mb-6 ${styles.a4}`}>
                        <h1 className="text-xl font-semibold text-stone-900 tracking-[-0.4px] mb-1">Create your
                            account</h1>
                        <p className="text-[13px] text-stone-500">Start cataloguing your library</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>

                        {/* Name */}
                        <div className={`mb-3.5 ${styles.a5}`}>
                            <label className="block text-xs font-medium text-stone-700 mb-1.5 tracking-[0.1px]"
                                   htmlFor="name">
                                Name
                            </label>
                            <div className={`relative ${styles.inputWrap}`}>
                                <input
                                    className={`w-full h-10 px-3 border border-stone-300/80 rounded-lg bg-white font-[inherit] text-[13px] text-stone-900 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-stone-300 ${styles.input}`}
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Ada Lovelace"
                                    autoComplete="name"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className={`mb-3.5 ${styles.a5}`}>
                            <label className="block text-xs font-medium text-stone-700 mb-1.5 tracking-[0.1px]"
                                   htmlFor="email">
                                Email address
                            </label>
                            <div className={`relative ${styles.inputWrap}`}>
                                <span
                                    className={`absolute left-2.75 top-1/2 -translate-y-1/2 flex pointer-events-none transition-colors duration-150 text-stone-400 ${styles.inputIcon}`}
                                    aria-hidden="true">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <path
                                            d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                        <polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                </span>
                                <input
                                    className={`w-full h-10 pl-9 pr-3 border border-stone-300/80 rounded-lg bg-white font-[inherit] text-[13px] text-stone-900 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-stone-300 ${styles.input}`}
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className={`mb-3.5 ${styles.a6}`}>
                            <label className="block text-xs font-medium text-stone-700 mb-1.5 tracking-[0.1px]"
                                   htmlFor="password">
                                Password
                            </label>
                            <div className={`relative ${styles.inputWrap}`}>
                                <span
                                    className={`absolute left-2.75 top-1/2 -translate-y-1/2 flex pointer-events-none transition-colors duration-150 text-stone-400 ${styles.inputIcon}`}
                                    aria-hidden="true">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                </span>
                                <input
                                    className={`w-full h-10 pl-9 pr-9 border border-stone-300/80 rounded-lg bg-white font-[inherit] text-[13px] text-stone-900 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-stone-300 ${styles.input}`}
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-2.75 top-1/2 -translate-y-1/2 flex bg-transparent border-none p-0 text-stone-400 hover:text-stone-700 cursor-pointer transition-colors duration-150"
                                    aria-label="Toggle password visibility"
                                    onClick={() => setShowPassword(v => !v)}
                                >
                                    {showPassword ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                             stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                             strokeLinejoin="round">
                                            <path
                                                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                            <path
                                                d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                            <line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                             stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                             strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <ul className="mt-2 space-y-1" aria-label="Password requirements">
                                {passwordRequirements.map(({key, label, met}) => (
                                    <li
                                        key={key}
                                        data-testid={`pw-req-${key}`}
                                        data-met={met}
                                        className={`flex items-center gap-1.5 text-[11px] ${met ? 'text-emerald-600' : 'text-stone-400'}`}
                                    >
                                        <span aria-hidden="true">{met ? '✓' : '○'}</span>
                                        {label}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Confirm password */}
                        <div className={`mb-4 ${styles.a7}`}>
                            <label className="block text-xs font-medium text-stone-700 mb-1.5 tracking-[0.1px]"
                                   htmlFor="confirmPassword">
                                Confirm password
                            </label>
                            <div className={`relative ${styles.inputWrap}`}>
                                <input
                                    className={`w-full h-10 pl-3 pr-9 border border-stone-300/80 rounded-lg bg-white font-[inherit] text-[13px] text-stone-900 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-stone-300 ${styles.input}`}
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-2.75 top-1/2 -translate-y-1/2 flex bg-transparent border-none p-0 text-stone-400 hover:text-stone-700 cursor-pointer transition-colors duration-150"
                                    aria-label="Toggle confirm password visibility"
                                    onClick={() => setShowConfirmPassword(v => !v)}
                                >
                                    {showConfirmPassword ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                             stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                             strokeLinejoin="round">
                                            <path
                                                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                            <path
                                                d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                            <line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                             stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                             strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <p role="alert" className="text-xs text-rose-600 mb-3 -mt-1">{error}</p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full h-10 bg-rose-600 hover:bg-rose-700 active:scale-[0.985] disabled:opacity-70 disabled:cursor-not-allowed text-white border-none rounded-lg font-[inherit] text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 tracking-[0.1px] transition-[background,transform] duration-150 ${styles.a9}`}
                        >
                            {isLoading ? (
                                <span>Creating account…</span>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                        <polyline points="10 17 15 12 10 7"/>
                                        <line x1="15" y1="12" x2="3" y2="12"/>
                                    </svg>
                                    Create account
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className={`mt-5.5 text-center text-xs text-stone-400 ${styles.a10}`}>
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="text-rose-600 font-medium no-underline hover:text-rose-700 transition-colors duration-150 bg-transparent border-none p-0 cursor-pointer"
                        >
                            Sign in
                        </button>
                    </p>

                </section>
            </div>
        </main>
    );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- signup.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/signup/page.tsx src/app/signup/signup.module.css src/__tests__/signup.test.tsx
git commit -m "feat(auth): add signup page"
```

---

## Task 4: Wire "Create one" on the login page to /signup

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/__tests__/login.test.tsx`

**Interfaces:**
- Consumes: `useRouter().push` (the login page already calls `useRouter()` for `replace`).

- [ ] **Step 1: Write the failing test**

In `src/__tests__/login.test.tsx`, change the `setupAuth` mock's `useRouter` return to include `push`, and add a new test. Apply this diff:

```tsx
// Before:
const mockReplace = jest.fn();
// ...
    (useRouter as jest.Mock).mockReturnValue({replace: mockReplace});

// After:
const mockReplace = jest.fn();
const mockPush = jest.fn();
// ...
    (useRouter as jest.Mock).mockReturnValue({replace: mockReplace, push: mockPush});
```

Add this test in the `// ── Rendering ──` section, right after the "renders the create account footer link" test:

```tsx
    it("navigates to /signup when the create account button is clicked", () => {
        render(<LoginPage/>);
        fireEvent.click(screen.getByRole("button", {name: /create one/i}));
        expect(mockPush).toHaveBeenCalledWith("/signup");
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- login.test.tsx`
Expected: FAIL — `mockPush` was never called (button has no `onClick`).

- [ ] **Step 3: Wire the button**

In `src/app/login/page.tsx`, find the footer button:

```tsx
                        <button
                            type="button"
                            className="text-rose-600 font-medium no-underline hover:text-rose-700 transition-colors duration-150 bg-transparent border-none p-0 cursor-pointer"
                        >
                            Create one
                        </button>
```

Replace with:

```tsx
                        <button
                            type="button"
                            onClick={() => router.push('/signup')}
                            className="text-rose-600 font-medium no-underline hover:text-rose-700 transition-colors duration-150 bg-transparent border-none p-0 cursor-pointer"
                        >
                            Create one
                        </button>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- login.test.tsx`
Expected: PASS (all tests, including the new one).

- [ ] **Step 5: Commit**

```bash
git add src/app/login/page.tsx src/__tests__/login.test.tsx
git commit -m "feat(auth): wire login page's Create one button to /signup"
```

---

## Task 5: Marketing header — secondary "Sign up" link

**Files:**
- Modify: `src/app/(marketing)/_components/MarketingHeader.tsx`
- Test: `src/__tests__/MarketingHeader.test.tsx`

**Interfaces:**
- Consumes: nothing new (plain `next/link`, same as the existing "Sign in" link).

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/MarketingHeader.test.tsx`:

```tsx
import {render, screen} from "@testing-library/react";
import {MarketingHeader} from "@/src/app/(marketing)/_components/MarketingHeader";

describe("MarketingHeader", () => {
    it("renders a Sign in link to /login", () => {
        render(<MarketingHeader/>);
        expect(screen.getByRole("link", {name: /^sign in$/i})).toHaveAttribute("href", "/login");
    });

    it("renders a Sign up link to /signup", () => {
        render(<MarketingHeader/>);
        expect(screen.getByRole("link", {name: /^sign up$/i})).toHaveAttribute("href", "/signup");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- MarketingHeader.test.tsx`
Expected: FAIL — no element with role `link` named "Sign up".

- [ ] **Step 3: Add the link**

In `src/app/(marketing)/_components/MarketingHeader.tsx`, find:

```tsx
                <div className="flex items-center gap-3">
                    <ThemeToggle/>
                    <Link
                        href="/login"
                        className="rounded-full bg-[var(--bw-rose)] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[var(--bw-glow-shadow)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
                    >
                        Sign in
                    </Link>
                </div>
```

Replace with:

```tsx
                <div className="flex items-center gap-3">
                    <ThemeToggle/>
                    <Link
                        href="/signup"
                        className="rounded-full border border-[var(--bw-rib)] px-5 py-2.5 text-[13px] font-semibold text-[var(--bw-ink)] transition-colors duration-200 hover:bg-[var(--bw-bg-raised)]"
                    >
                        Sign up
                    </Link>
                    <Link
                        href="/login"
                        className="rounded-full bg-[var(--bw-rose)] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[var(--bw-glow-shadow)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
                    >
                        Sign in
                    </Link>
                </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- MarketingHeader.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "src/app/(marketing)/_components/MarketingHeader.tsx" src/__tests__/MarketingHeader.test.tsx
git commit -m "feat(marketing): add Sign up link to the marketing header"
```

---

## Task 6: Logout — Topbar avatar dropdown

**Files:**
- Modify: `src/components/Topbar.tsx`
- Modify: `src/lib/i18n/types.ts`
- Modify: `src/lib/i18n/translations/en.ts`
- Modify: `src/lib/i18n/translations/fa.ts`
- Modify: `src/__tests__/Topbar.test.tsx`
- Modify: `src/__tests__/AppShell.test.tsx`

**Interfaces:**
- Consumes: `useAuth()` from Task 1 (`user`, `logout`), `Avatar` from `@/src/components/ui/Avatar`, `LogOut` icon from `lucide-react`.
- Produces: nothing new consumed elsewhere — this is a leaf UI change.

- [ ] **Step 1: Add i18n keys (types + both locales)**

In `src/lib/i18n/types.ts`, change:

```ts
    topbar: {
        toggleMenu: string;
        pages: {
```

to:

```ts
    topbar: {
        toggleMenu: string;
        account: string;
        logout: string;
        pages: {
```

In `src/lib/i18n/translations/en.ts`, change:

```ts
    topbar: {
        toggleMenu: "Toggle menu",
        pages: {
```

to:

```ts
    topbar: {
        toggleMenu: "Toggle menu",
        account: "Account",
        logout: "Log out",
        pages: {
```

In `src/lib/i18n/translations/fa.ts`, change:

```ts
    topbar: {
        toggleMenu: "نمایش/مخفی منو",
        pages: {
```

to:

```ts
    topbar: {
        toggleMenu: "نمایش/مخفی منو",
        account: "حساب کاربری",
        logout: "خروج",
        pages: {
```

Run: `npm run typecheck`
Expected: PASS — confirms the `Translations` interface and both locale files stay in sync (this would fail to compile if a key were missing from either file).

- [ ] **Step 2: Write the failing Topbar tests**

In `src/__tests__/Topbar.test.tsx`, add a `useAuth` mock and `useRouter` alongside the existing `usePathname` mock, and add new tests. Apply this diff:

```tsx
// Before:
jest.mock("next/navigation", () => ({
    usePathname: jest.fn(() => "/dashboard"),
}));

// After:
jest.mock("next/navigation", () => ({
    usePathname: jest.fn(() => "/dashboard"),
    useRouter: jest.fn(() => ({replace: jest.fn()})),
}));

const mockLogout = jest.fn();
jest.mock("@/src/contexts/AuthContext", () => ({
    useAuth: jest.fn(() => ({
        user: {name: "Ada Lovelace", email: "ada@example.com"},
        logout: mockLogout,
    })),
}));
```

Add these tests at the end of the `describe("Topbar component", ...)` block, before the closing `});`:

```tsx
    describe("account menu", () => {
        it("renders an account button", () => {
            render(<Topbar {...defaultProps} />);
            expect(screen.getByRole("button", {name: /account/i})).toBeInTheDocument();
        });

        it("opens the account menu showing the user's name and Log out when clicked", () => {
            render(<Topbar {...defaultProps} />);
            fireEvent.click(screen.getByRole("button", {name: /account/i}));
            expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
            expect(screen.getByRole("menuitem", {name: /log out/i})).toBeInTheDocument();
        });

        it("calls logout() when Log out is clicked", async () => {
            mockLogout.mockResolvedValue(undefined);
            render(<Topbar {...defaultProps} />);
            fireEvent.click(screen.getByRole("button", {name: /account/i}));
            fireEvent.click(screen.getByRole("menuitem", {name: /log out/i}));
            expect(mockLogout).toHaveBeenCalled();
        });

        it("closes the menu when Escape is pressed", () => {
            render(<Topbar {...defaultProps} />);
            fireEvent.click(screen.getByRole("button", {name: /account/i}));
            expect(screen.getByRole("menu")).toBeInTheDocument();
            fireEvent.keyDown(document, {key: "Escape"});
            expect(screen.queryByRole("menu")).not.toBeInTheDocument();
        });
    });
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- Topbar.test.tsx`
Expected: FAIL — no button named "account" exists yet.

- [ ] **Step 4: Implement the avatar dropdown**

In `src/components/Topbar.tsx`, update the imports:

```tsx
// Before:
"use client";

import {useState} from "react";
import {usePathname} from "next/navigation";
import {ScanLine, Search, X} from "lucide-react";
import {PageId} from "@/src/lib/types";
import {useLanguage} from "@/src/lib/i18n/context";
import {useLibrary} from "@/src/contexts/LibraryContext";
import {Topbar as TopbarShell} from "@/src/components/ui/Topbar";
import {BarcodeScanner} from "@/src/components/ui/BarcodeScanner";

// After:
"use client";

import {useEffect, useRef, useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import {LogOut, ScanLine, Search, X} from "lucide-react";
import {PageId} from "@/src/lib/types";
import {useLanguage} from "@/src/lib/i18n/context";
import {useLibrary} from "@/src/contexts/LibraryContext";
import {useAuth} from "@/src/contexts/AuthContext";
import {Avatar} from "@/src/components/ui/Avatar";
import {Topbar as TopbarShell} from "@/src/components/ui/Topbar";
import {BarcodeScanner} from "@/src/components/ui/BarcodeScanner";
```

Update the component body — add hooks and the outside-click/Escape effect right after the existing `useState` calls:

```tsx
// Before:
export default function Topbar({onMenuToggle}: TopbarProps) {
    const { t } = useLanguage();
    const {searchQuery, setSearchQuery} = useLibrary();
    const pathname = usePathname();
    const [scannerOpen, setScannerOpen] = useState(false);
    const [searchExpanded, setSearchExpanded] = useState(false);

// After:
export default function Topbar({onMenuToggle}: TopbarProps) {
    const { t } = useLanguage();
    const {searchQuery, setSearchQuery} = useLibrary();
    const {user, logout} = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [scannerOpen, setScannerOpen] = useState(false);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!accountOpen) return;

        function handleClickOutside(e: MouseEvent) {
            if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
                setAccountOpen(false);
            }
        }

        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") setAccountOpen(false);
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [accountOpen]);

    async function handleLogout() {
        setAccountOpen(false);
        await logout();
        router.replace("/login");
    }
```

Update `endSlot` to append the account menu after the search block. Find:

```tsx
                endSlot={
                    <div className="flex items-center gap-2">
                        <button
                            className="sm:hidden p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-stone-100 hover:text-[var(--foreground)] transition-colors cursor-pointer"
                            aria-label={t.common.search}
                            onClick={() => setSearchExpanded(true)}
                        >
                            <Search className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <div className="hidden sm:flex items-center gap-2 h-8 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 w-56 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all">
                            <Search className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
                            <input
                                type="search"
                                placeholder={t.common.searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
                                aria-label={t.common.search}
                            />
                            <button
                                type="button"
                                onClick={() => setScannerOpen(true)}
                                aria-label={t.barcodeScanner.title}
                                className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                            >
                                <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                }
```

Replace with:

```tsx
                endSlot={
                    <div className="flex items-center gap-2">
                        <button
                            className="sm:hidden p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-stone-100 hover:text-[var(--foreground)] transition-colors cursor-pointer"
                            aria-label={t.common.search}
                            onClick={() => setSearchExpanded(true)}
                        >
                            <Search className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <div className="hidden sm:flex items-center gap-2 h-8 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 w-56 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all">
                            <Search className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
                            <input
                                type="search"
                                placeholder={t.common.searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
                                aria-label={t.common.search}
                            />
                            <button
                                type="button"
                                onClick={() => setScannerOpen(true)}
                                aria-label={t.barcodeScanner.title}
                                className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                            >
                                <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="relative" ref={accountRef}>
                            <button
                                type="button"
                                onClick={() => setAccountOpen(o => !o)}
                                aria-haspopup="menu"
                                aria-expanded={accountOpen}
                                aria-label={t.topbar.account}
                                className="flex items-center rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                            >
                                <Avatar name={user?.name ?? user?.email ?? "?"} size="sm" />
                            </button>

                            {accountOpen && (
                                <div
                                    role="menu"
                                    aria-label={t.topbar.account}
                                    className="absolute end-0 top-full mt-2 w-56 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg py-1.5 z-30"
                                >
                                    <div className="px-3 py-2 border-b border-[var(--border)]">
                                        <p className="text-xs font-semibold text-[var(--foreground)] truncate">
                                            {user?.name ?? user?.email ?? t.topbar.account}
                                        </p>
                                        {user?.email && user?.name && (
                                            <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                                                {user.email}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--foreground)] hover:bg-stone-100 transition-colors cursor-pointer"
                                    >
                                        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                                        {t.topbar.logout}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                }
```

- [ ] **Step 5: Run Topbar tests to verify they pass**

Run: `npm test -- Topbar.test.tsx`
Expected: PASS

- [ ] **Step 6: Fix AppShell.test.tsx (now needs AuthProvider)**

`AppShell` renders `Topbar`, which now calls `useAuth()`. In `src/__tests__/AppShell.test.tsx`, add the import and wrap the render:

```tsx
// Before:
import { LibraryProvider } from "@/src/contexts/LibraryContext";
import { LanguageProvider } from "@/src/lib/i18n/context";
import AppShell from "@/src/components/AppShell";

// After:
import { LibraryProvider } from "@/src/contexts/LibraryContext";
import { LanguageProvider } from "@/src/lib/i18n/context";
import { AuthProvider } from "@/src/contexts/AuthContext";
import AppShell from "@/src/components/AppShell";
```

```tsx
// Before:
function renderApp() {
    return render(
        <LanguageProvider>
            <LibraryProvider>
                <AppShell>
                    <BooksRoute />
                </AppShell>
            </LibraryProvider>
        </LanguageProvider>
    );
}

// After:
function renderApp() {
    return render(
        <AuthProvider>
            <LanguageProvider>
                <LibraryProvider>
                    <AppShell>
                        <BooksRoute />
                    </AppShell>
                </LibraryProvider>
            </LanguageProvider>
        </AuthProvider>
    );
}
```

- [ ] **Step 7: Run the full suite to verify nothing else broke**

Run: `npm test`
Expected: PASS — all suites, including `AppShell.test.tsx` and every other file that renders `Topbar`/`AppShell`.

- [ ] **Step 8: Commit**

```bash
git add src/components/Topbar.tsx src/lib/i18n/types.ts src/lib/i18n/translations/en.ts src/lib/i18n/translations/fa.ts src/__tests__/Topbar.test.tsx src/__tests__/AppShell.test.tsx
git commit -m "feat(auth): add Topbar avatar dropdown with logout"
```

---

## Task 7: GitHub Actions CI

**Files:**
- Modify: `package.json`
- Create: `.github/workflows/ci.yml`

**Interfaces:** none — this task doesn't touch application code.

- [ ] **Step 1: Add the `typecheck` script**

In `package.json`, change:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "jest",
    "test:watch": "jest --watch"
  },
```

to:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch"
  },
```

- [ ] **Step 2: Verify the new script works locally**

Run: `npm run typecheck`
Expected: exits 0 with no type errors (the project already builds cleanly; this just wires the existing `"noEmit": true` config to a script).

- [ ] **Step 3: Write the workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  test:
    name: Lint, typecheck, test, build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

      - name: Test
        run: npm test -- --ci

      - name: Build
        run: npm run build

  deploy:
    name: Deploy
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/master'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy (placeholder)
        run: |
          echo "TODO: wire up the real deploy step here."
          echo "The project already has a Dockerfile and docker-compose.yml —"
          echo "the likely next step is building and pushing an image (e.g. to"
          echo "GHCR or another registry) and rolling it out to the host."
```

- [ ] **Step 4: Verify the pipeline's commands succeed locally, in order**

Run, in this exact order, from the repo root:

```bash
npm run lint
npm run typecheck
npm test -- --ci
npm run build
```

Expected: all four exit 0. This mirrors exactly what the `test` job runs, so a local green run means the CI job will be green too (the `deploy` job has no real logic yet to verify).

- [ ] **Step 5: Commit**

```bash
git add package.json .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow (lint/typecheck/test/build + deploy stub)"
```

---

## Self-Review Notes

- **Spec coverage:** §1 Signup page → Task 3. §2 Entry points → Tasks 4 & 5. §3 AuthContext changes → Task 1. §4 Topbar logout → Task 6. §5 CI → Task 7. §2's "no Google button" and "remove nothing from login" constraints are directly asserted in Task 3's tests and left untouched in Task 4.
- **Type consistency:** `signup()` returns `{ok: true} | {ok: false; message: string}` everywhere it's referenced (Task 1's interface, Task 1's implementation, Task 3's test mocks, Task 3's page code) — verified consistent across tasks.
- **Task order:** Tasks 1→2→3 are strictly sequential (page needs the route; route and context are independent of each other but both needed before the page). Task 4 depends on nothing but the existing login page. Task 5 is fully independent. Task 6 depends on Task 1's `user`/`logout`. Task 7 is fully independent — could run first or last.
