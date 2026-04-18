"use client";
/**
 * lib/i18n/context.tsx
 *
 * React context that provides translations and RTL awareness to every component.
 *
 * ARCHITECTURE OVERVIEW
 * ---------------------
 *   LanguageProvider  (wraps the entire app in LibraryApp.tsx)
 *     - stores: language, dir, t (Translations object)
 *     - exposes: useLanguage() hook
 *
 * Every component that needs a translated string calls:
 *   const { t, dir } = useLanguage();
 *   <p>{t.sidebar.navDashboard}</p>
 *
 * For strings that contain runtime values (e.g. counts, names) use the
 * interpolate utility exported from this file:
 *   interpolate(t.lent.subtitle, { count: String(lentBooks.length) })
 *   // "6 books currently out with friends & family"  (en)
 *   // "6 ..." (fa - uses the Farsi template with {count})
 *
 * RTL HANDLING
 * ------------
 * - "dir" is derived from LANGUAGE_META: "ltr" for English, "rtl" for Farsi.
 * - Components receive "dir" from the hook and set it on their root element.
 * - The <html> element in layout.tsx is also updated via a useEffect so the
 *   browser-native bidi algorithm applies to the entire document.
 * - Tailwind logical properties (ms-, me-, ps-, pe-, border-s-, etc.)
 *   respond to "dir" automatically - prefer them over physical ml-/pl-.
 *
 * FONT SWITCHING
 * --------------
 * - The Vazirmatn CSS variable (--font-vazirmatn) is loaded in layout.tsx.
 * - When dir === "rtl", LanguageProvider adds the class "font-vazirmatn" to
 *   the <body> element so Farsi text uses the correct typeface.
 * - The English fonts remain available as fallbacks for embedded Latin text.
 *
 * HOW TO ADD A NEW LANGUAGE
 * --------------------------
 * 1. Add the locale code to the Language union in lib/i18n/types.ts.
 * 2. Create lib/i18n/translations/<code>.ts.
 * 3. Import it here and add an entry to TRANSLATIONS and LANGUAGE_META.
 * 4. If RTL, set dir: "rtl" in LANGUAGE_META.
 * 5. Add the appropriate Google Font in app/layout.tsx and expose it as a
 *    CSS variable. Wire the font class into the body switch below.
 */

import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import {Language, TextDirection, Translations} from "@/src/lib/i18n/types";
import en from "@/src/lib/i18n/translations/en";
import fa from "@/src/lib/i18n/translations/fa";

// ---------------------------------------------------------------------------
// Translation map
// Maps every supported locale code to its translation object.
// When adding a new language, import it above and add it here.
// ---------------------------------------------------------------------------
const TRANSLATIONS: Record<Language, Translations> = {en, fa};

// ---------------------------------------------------------------------------
// Language metadata
//
// dir        - Text direction: "ltr" or "rtl"
// nativeName - Name of the language written in that language
//              (shown in the switcher so users can identify it without
//               knowing any other language)
// fontClass  - Optional Tailwind/CSS class applied to <body> for
//              language-specific font selection.
//              The class must be registered in app/layout.tsx as a CSS var.
// ---------------------------------------------------------------------------
interface LanguageMeta {
    dir: TextDirection;
    nativeName: string;
    fontClass?: string;
}

export const LANGUAGE_META: Record<Language, LanguageMeta> = {
    en: {dir: "ltr", nativeName: "English"},
    fa: {dir: "rtl", nativeName: "\u0641\u0627\u0631\u0633\u06CC", fontClass: "font-vazirmatn"},
};

// ---------------------------------------------------------------------------
// Context value shape
// ---------------------------------------------------------------------------
interface LanguageContextValue {
    /** Current locale, e.g. "en" or "fa" */
    language: Language;
    /** Text direction for the current locale */
    dir: TextDirection;
    /** Full translation object - access keys directly: t.sidebar.navDashboard */
    t: Translations;
    /** Switch to a different locale */
    setLanguage: (lang: Language) => void;
    /** All supported languages and their metadata (for rendering the switcher) */
    languages: typeof LANGUAGE_META;
}

// Default fallback - satisfies TypeScript without optional chaining everywhere
const LanguageContext = createContext<LanguageContextValue>({
    language: "en",
    dir: "ltr",
    t: en,
    setLanguage: () => {
    },
    languages: LANGUAGE_META,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface LanguageProviderProps {
    children: React.ReactNode;
    /** Optional initial language (useful in tests or SSR hints) */
    initialLanguage?: Language;
}

export function LanguageProvider({children, initialLanguage = "en"}: LanguageProviderProps) {
    const [language, setLanguageState] = useState<Language>(initialLanguage);

    const meta = LANGUAGE_META[language];

    // Sync <html> dir + lang and <body> font class on every language change.
    // This ensures the browser bidi algorithm, screen-reader announcements, and
    // scrollbar placement all update correctly when the user switches languages.
    useEffect(() => {
        if (typeof document === "undefined") return; // SSR guard

        const html = document.documentElement;
        const body = document.body;

        // Set direction and locale on the root element
        html.setAttribute("dir", meta.dir);
        html.setAttribute("lang", language);

        // Swap font class on body: remove all known font classes first, then add
        // the one for the new language (if any).
        Object.values(LANGUAGE_META).forEach(({fontClass}) => {
            if (fontClass) body.classList.remove(fontClass);
        });
        if (meta.fontClass) {
            body.classList.add(meta.fontClass);
        }
    }, [language, meta]);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
    }, []);

    const value: LanguageContextValue = {
        language,
        dir: meta.dir,
        t: TRANSLATIONS[language],
        setLanguage,
        languages: LANGUAGE_META,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

// ---------------------------------------------------------------------------
// Hook
// useLanguage - primary hook for accessing translations and direction.
//
// Usage inside any client component:
//   const { t, dir, language, setLanguage } = useLanguage();
// ---------------------------------------------------------------------------
export function useLanguage(): LanguageContextValue {
    return useContext(LanguageContext);
}

// ---------------------------------------------------------------------------
// Interpolation helper
//
// interpolate() replaces {placeholder} tokens in a translation string.
//
// Example:
//   interpolate("Lent {title} to {person}", { title: "Ficciones", person: "Lucas M." })
//   // "Lent Ficciones to Lucas M."
//
//   interpolate("{count} books in collection", { count: "5" })
//   // "5 books in collection" (en)
//
// All token values must be strings. Convert numbers before passing:
//   interpolate(t.books.subtitle, { count: String(books.length) })
// ---------------------------------------------------------------------------
export function interpolate(template: string, vars: Record<string, string>): string {
    return Object.entries(vars).reduce(
        (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, "g"), value),
        template
    );
}
