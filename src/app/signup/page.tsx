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
        {key: 'length', label: 'Minimum 8 characters', met: hasMinLength(password)},
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
                                    aria-label="Toggle password visibility"
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
