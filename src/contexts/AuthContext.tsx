'use client';

import {createContext, useContext, useState, useEffect, ReactNode} from 'react';

interface AuthContextValue {
    isAuthenticated: boolean;
    hydrated: boolean;
    login: (email: string, password: string, remember: boolean) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'librax_session';

export function AuthProvider({children}: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const persisted =
            localStorage.getItem(STORAGE_KEY) === 'true' ||
            sessionStorage.getItem(STORAGE_KEY) === 'true';
        setIsAuthenticated(persisted);
        setHydrated(true);
    }, []);

    function login(email: string, password: string, remember: boolean): boolean {
        if (!email.trim() || !password.trim()) return false;
        if (remember) {
            localStorage.setItem(STORAGE_KEY, 'true');
        } else {
            sessionStorage.setItem(STORAGE_KEY, 'true');
        }
        setIsAuthenticated(true);
        return true;
    }

    function logout() {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        setIsAuthenticated(false);
    }

    return (
        <AuthContext.Provider value={{isAuthenticated, hydrated, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
