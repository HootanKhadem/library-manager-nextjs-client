'use client';

import {useEffect, useState} from 'react';

const STORAGE_KEY = 'bookwrym-theme';

export function ThemeToggle() {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        let stored: string | null = null;
        try {
            stored = localStorage.getItem(STORAGE_KEY);
        } catch {
            // localStorage unavailable — fall back to the dark default
        }
        if (stored === 'light') {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating theme preference from storage on mount
            setTheme('light');
            document.querySelector('.bw-world')?.setAttribute('data-theme', 'light');
        }
    }, []);

    function toggle() {
        const world = document.querySelector('.bw-world');
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        if (world) {
            if (next === 'light') {
                world.setAttribute('data-theme', 'light');
            } else {
                world.removeAttribute('data-theme');
            }
        }
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // localStorage unavailable (private mode, disabled) — theme just won't persist
        }
    }

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={theme === 'light'}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--bw-rib)] text-[var(--bw-ink-muted)] transition-colors duration-200 hover:text-[var(--bw-ink)]"
        >
            {theme === 'dark' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                        d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"
                        fill="currentColor"
                    />
                </svg>
            ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none"/>
                    <line x1="12" y1="1.5" x2="12" y2="4"/>
                    <line x1="12" y1="20" x2="12" y2="22.5"/>
                    <line x1="4.2" y1="4.2" x2="5.9" y2="5.9"/>
                    <line x1="18.1" y1="18.1" x2="19.8" y2="19.8"/>
                    <line x1="1.5" y1="12" x2="4" y2="12"/>
                    <line x1="20" y1="12" x2="22.5" y2="12"/>
                    <line x1="4.2" y1="19.8" x2="5.9" y2="18.1"/>
                    <line x1="18.1" y1="5.9" x2="19.8" y2="4.2"/>
                </svg>
            )}
        </button>
    );
}
