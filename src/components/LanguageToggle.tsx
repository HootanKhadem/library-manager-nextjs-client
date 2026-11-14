"use client";

import {useLanguage} from "@/src/lib/i18n/context";

/** One-tap switch to the other language, for pages with no sidebar (login, sign up, marketing). */
export function LanguageToggle({className = ""}: { className?: string }) {
    const {language, setLanguage, languages} = useLanguage();
    const other = language === "fa" ? "en" : "fa";

    return (
        <button
            type="button"
            onClick={() => setLanguage(other)}
            lang={other}
            className={className}
        >
            {languages[other].nativeName}
        </button>
    );
}
