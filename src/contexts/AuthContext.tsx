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
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating auth flag from storage on mount, not a cascading-render loop
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
