'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/src/contexts/AuthContext';
import styles from './login.module.css';

const FEATURES = [
    {strong: 'Books', rest: 'tracked across your full collection'},
    {strong: 'Loans', rest: 'managed with due date reminders'},
    {strong: 'Authors', rest: 'catalogued with full details'},
];

export default function LoginPage() {
    const {isAuthenticated, hydrated, login} = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (hydrated && isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [hydrated, isAuthenticated, router]);

    if (!hydrated || isAuthenticated) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Please enter your email and password.');
            return;
        }

        setIsLoading(true);
        try {
            const ok = await login(email, password, remember);
            if (ok) {
                router.replace('/dashboard');
            } else {
                setError('Invalid credentials. Please try again.');
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
                    'flex w-full max-w-[860px] min-h-[540px] rounded-xl overflow-hidden',
                    'shadow-[0_4px_24px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.06)]',
                    // responsive: stack vertically on small screens
                    'max-[640px]:flex-col max-[640px]:max-w-[420px] max-[640px]:min-h-0',
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
                    {/* Logo */}
                    <div className={`flex items-center gap-2.5 relative z-10 ${styles.a1}`}>
                        <div className="w-9 h-9 bg-rose-600 rounded-lg flex items-center justify-center shrink-0"
                             aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                 stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                            </svg>
                        </div>
                        <span className="text-[15px] font-semibold text-stone-50 tracking-[-0.2px]">Librax</span>
                    </div>

                    {/* Tagline */}
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

                    {/* Features */}
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
                    className="flex-1 bg-stone-50 flex flex-col justify-center px-11 py-12 max-[640px]:px-6 max-[640px]:py-8">

                    {/* Form header */}
                    <div className={`mb-7 ${styles.a4}`}>
                        <h1 className="text-xl font-semibold text-stone-900 tracking-[-0.4px] mb-1">Welcome back</h1>
                        <p className="text-[13px] text-stone-500">Sign in to your library</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>

                        {/* Email */}
                        <div className={`mb-4 ${styles.a5}`}>
                            <label className="block text-xs font-medium text-stone-700 mb-1.5 tracking-[0.1px]"
                                   htmlFor="email">
                                Email address
                            </label>
                            <div className={`relative ${styles.inputWrap}`}>
                                <span
                                    className={`absolute left-[11px] top-1/2 -translate-y-1/2 flex pointer-events-none transition-colors duration-150 text-stone-400 ${styles.inputIcon}`}
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
                        <div className={`mb-4 ${styles.a6}`}>
                            <label className="block text-xs font-medium text-stone-700 mb-1.5 tracking-[0.1px]"
                                   htmlFor="password">
                                Password
                            </label>
                            <div className={`relative ${styles.inputWrap}`}>
                                <span
                                    className={`absolute left-[11px] top-1/2 -translate-y-1/2 flex pointer-events-none transition-colors duration-150 text-stone-400 ${styles.inputIcon}`}
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
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-[11px] top-1/2 -translate-y-1/2 flex bg-transparent border-none p-0 text-stone-400 hover:text-stone-700 cursor-pointer transition-colors duration-150"
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
                        </div>

                        {/* Error message */}
                        {error && (
                            <p role="alert" className="text-xs text-rose-600 mb-3 -mt-1">{error}</p>
                        )}

                        {/* Remember / Forgot row */}
                        <div className={`flex justify-between items-center mb-5 ${styles.a7}`}>
                            <div>
                                <input
                                    type="checkbox"
                                    id="remember"
                                    name="remember"
                                    className={`absolute opacity-0 w-0 h-0 ${styles.rememberCheckbox}`}
                                    checked={remember}
                                    onChange={e => setRemember(e.target.checked)}
                                />
                                <label
                                    className={`flex items-center gap-2 cursor-pointer select-none ${styles.checkLabel}`}
                                    htmlFor="remember">
                                    <span
                                        className={`w-[15px] h-[15px] border border-stone-300/80 rounded-[4px] bg-white flex items-center justify-center shrink-0 transition-[border-color,background] duration-150 cursor-pointer ${styles.checkBox}`}
                                        aria-hidden="true"
                                    >
                                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none"
                                             stroke="#fff" strokeWidth="2.5" strokeLinecap="round"
                                             strokeLinejoin="round">
                                            <polyline points="1,5 4,8 9,2"/>
                                        </svg>
                                    </span>
                                    <span className="text-xs text-stone-500">Remember me</span>
                                </label>
                            </div>
                            <button
                                type="button"
                                className="text-xs font-medium text-rose-600 hover:text-rose-700 no-underline transition-colors duration-150 bg-transparent border-none p-0 cursor-pointer"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full h-10 bg-rose-600 hover:bg-rose-700 active:scale-[0.985] disabled:opacity-70 disabled:cursor-not-allowed text-white border-none rounded-lg font-[inherit] text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 tracking-[0.1px] transition-[background,transform] duration-150 ${styles.a8}`}
                        >
                            {isLoading ? (
                                <span>Signing in…</span>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                        <polyline points="10 17 15 12 10 7"/>
                                        <line x1="15" y1="12" x2="3" y2="12"/>
                                    </svg>
                                    Sign in
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className={`flex items-center gap-3 my-[18px] ${styles.a9}`} aria-hidden="true">
                        <div className="flex-1 h-px bg-stone-200"/>
                        <span className="text-[11px] text-stone-400 whitespace-nowrap">or continue with</span>
                        <div className="flex-1 h-px bg-stone-200"/>
                    </div>

                    {/* Google OAuth */}
                    <button
                        type="button"
                        className={`w-full h-10 bg-white border border-stone-300/80 hover:bg-stone-100 hover:border-stone-400 active:scale-[0.985] rounded-lg font-[inherit] text-[13px] font-medium text-stone-700 cursor-pointer flex items-center justify-center gap-2 transition-[background,border-color,transform] duration-150 ${styles.a10}`}
                        onClick={() => console.log('Google OAuth — connect your provider here')}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"/>
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"/>
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"/>
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    </button>

                    {/* Footer */}
                    <p className={`mt-[22px] text-center text-xs text-stone-400 ${styles.a11}`}>
                        Don&apos;t have an account?{' '}
                        <button
                            type="button"
                            className="text-rose-600 font-medium no-underline hover:text-rose-700 transition-colors duration-150 bg-transparent border-none p-0 cursor-pointer"
                        >
                            Create one
                        </button>
                    </p>

                </section>
            </div>
        </main>
    );
}
