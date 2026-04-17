"use client";
/**
 * components/LanguageSwitcher.tsx
 *
 * A compact button group that lets the user toggle between supported languages.
 * Renders one button per language in LANGUAGE_META. All colours use design tokens
 * so the component is theme-aware.
 *
 * ADDING MORE LANGUAGES
 * ─────────────────────
 * No changes needed here — the component iterates LANGUAGE_META from context.tsx,
 * so any language registered there automatically gets a button.
 */

import { useLanguage } from "@/src/lib/i18n/context";
import { Language } from "@/src/lib/i18n/types";

export default function LanguageSwitcher() {
    const { language, setLanguage, languages, t } = useLanguage();

    return (
        <div>
            <p className="text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wide">
                {t.sidebar.languageSwitcherLabel}
            </p>

            <div className="flex gap-2" role="group" aria-label={t.sidebar.languageSwitcherLabel}>
                {(Object.entries(languages) as [Language, { nativeName: string; dir: string }][]).map(
                    ([code, meta]) => {
                        const isActive = code === language;
                        return (
                            <button
                                key={code}
                                onClick={() => setLanguage(code)}
                                aria-pressed={isActive}
                                aria-label={`Switch to ${meta.nativeName}`}
                                className={[
                                    "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer",
                                    isActive
                                        ? "bg-[var(--accent)] text-white"
                                        : "bg-transparent text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-stone-100",
                                ].join(" ")}
                            >
                                {meta.nativeName}
                            </button>
                        );
                    }
                )}
            </div>
        </div>
    );
}
