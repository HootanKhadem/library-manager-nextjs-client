"use client";
/**
 * components/LanguageSwitcher.tsx
 *
 * A compact button group that lets the user toggle between supported languages.
 *
 * DESIGN DECISIONS
 * ----------------
 * - Renders one button per language in LANGUAGE_META.
 * - The active language button is visually highlighted.
 * - Each button label is the language's native name (e.g. "English", "فارسی")
 *   so that users who don't yet know the UI language can still find their option.
 * - The component is intentionally small — it lives inside the Sidebar footer
 *   below the "Add New Book" button.
 *
 * ADDING MORE LANGUAGES
 * ----------------------
 * No changes are needed here. The component iterates over LANGUAGE_META from
 * context.tsx, so any language registered there automatically gets a button.
 *
 * RTL AWARENESS
 * -------------
 * The switcher itself does not need any RTL-specific CSS because it uses
 * justify-center and the buttons are symmetric. The parent layout handles
 * directional mirroring via the dir attribute on <html>.
 */

import {useLanguage} from "@/lib/i18n/context";
import {Language} from "@/lib/i18n/types";

export default function LanguageSwitcher() {
    const {language, setLanguage, languages, t} = useLanguage();

    return (
        <div className="mt-3">
            {/* Section label — uses the translated "Language" string */}
            <p className="font-mono text-[0.52rem] tracking-[0.2em] uppercase text-[rgba(196,116,42,0.45)] mb-1.5 text-center">
                {t.sidebar.languageSwitcherLabel}
            </p>

            {/* One button per registered language */}
            <div className="flex gap-1.5 justify-center" role="group" aria-label={t.sidebar.languageSwitcherLabel}>
                {(Object.entries(languages) as [Language, { nativeName: string; dir: string }][]).map(
                    ([code, meta]) => {
                        const isActive = code === language;
                        return (
                            <button
                                key={code}
                                onClick={() => setLanguage(code)}
                                aria-pressed={isActive}
                                aria-label={`Switch to ${meta.nativeName}`}
                                className={`
                  flex-1 px-2 py-1.5 rounded text-[0.7rem] font-mono tracking-wide transition-all duration-200
                  ${
                                    isActive
                                        ? "bg-[#b8922a] text-[#1a0f00] font-bold shadow-sm"
                                        : "bg-[rgba(196,116,42,0.12)] text-[rgba(245,240,232,0.55)] border border-[rgba(196,116,42,0.2)] hover:bg-[rgba(196,116,42,0.2)] hover:text-[rgba(245,240,232,0.8)]"
                                }
                `}
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
