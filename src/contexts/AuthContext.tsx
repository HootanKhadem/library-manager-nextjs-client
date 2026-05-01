'use client';

import {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react';

interface AuthContextValue {
    isAuthenticated: boolean;
    hydrated: boolean;
    login: (email: string, password: string, remember: boolean) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'librax_session';

export function AuthProvider({children}: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        // The httpOnly cookies holding the real tokens can't be read here.
        // This localStorage/sessionStorage flag is a UI-side hint that tells
        // the client whether the user has an active session, so we can skip
        // the login screen without an extra server round-trip on every load.
        const persisted =
            localStorage.getItem(STORAGE_KEY) === 'true' ||
            sessionStorage.getItem(STORAGE_KEY) === 'true';
        setIsAuthenticated(persisted);
        setHydrated(true);
    }, []);

    useEffect(() => {
        // When a fetch call returns 401 anywhere in the app, fire this event
        // and we'll clear the stale session flag and mark the user as logged out.
        function handleUnauthorized() {
            localStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem(STORAGE_KEY);
            setIsAuthenticated(false);
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
        // Store a plain UI flag so we know on the next page load that the
        // user is still logged in without hitting the server again.
        if (remember) {
            localStorage.setItem(STORAGE_KEY, 'true');
        } else {
            sessionStorage.setItem(STORAGE_KEY, 'true');
        }

        setIsAuthenticated(true);
        return true;
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        await fetch('/api/auth/logout', {method: 'POST'}).catch(() => {
        });
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        setIsAuthenticated(false);
    }, []);

    const value = useMemo(
        () => ({isAuthenticated, hydrated, login, logout}),
        [isAuthenticated, hydrated, login, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
